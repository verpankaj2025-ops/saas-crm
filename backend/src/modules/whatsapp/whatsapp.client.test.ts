import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMediaPayload,
  buildTemplatePayload,
  getMediaUrl,
  downloadMedia,
  sendWhatsAppMedia,
  sendWhatsAppTemplate,
  WhatsAppApiError,
} from "./whatsapp.client";
import { extractMedia, mediaContentType } from "./whatsapp.inbound";
import { buildMediaPath } from "./whatsapp.storage";
import type { WhatsAppMessage } from "./whatsapp.types";

// ── Pure payload builders ─────────────────────────────────────

test("buildMediaPayload: image with caption", () => {
  assert.deepEqual(buildMediaPayload("+15551234567", "image", "https://x/y.jpg", "hi"), {
    messaging_product: "whatsapp",
    recipient_type:    "individual",
    to:    "+15551234567",
    type:  "image",
    image: { link: "https://x/y.jpg", caption: "hi" },
  });
});

test("buildMediaPayload: audio ignores caption", () => {
  const p = buildMediaPayload("+1", "audio", "https://x/a.ogg", "should-drop");
  assert.deepEqual(p.audio, { link: "https://x/a.ogg" });
});

test("buildMediaPayload: document keeps filename + caption", () => {
  const p = buildMediaPayload("+1", "document", "https://x/d.pdf", "doc", "invoice.pdf");
  assert.deepEqual(p.document, { link: "https://x/d.pdf", caption: "doc", filename: "invoice.pdf" });
});

test("buildTemplatePayload: builds body components from params", () => {
  const p = buildTemplatePayload("+1", "welcome", "en_US", ["Asha", "Mon"]);
  assert.equal(p.template.name, "welcome");
  assert.equal(p.template.language.code, "en_US");
  assert.deepEqual(p.template.components, [
    { type: "body", parameters: [{ type: "text", text: "Asha" }, { type: "text", text: "Mon" }] },
  ]);
});

test("buildTemplatePayload: no params → empty components", () => {
  assert.deepEqual(buildTemplatePayload("+1", "ping", "en", []).template.components, []);
});

// ── Mocked-fetch network functions ────────────────────────────

function mockFetch(handler: (url: string, init?: RequestInit) => unknown): () => void {
  const original = globalThis.fetch;
  // @ts-expect-error test override
  globalThis.fetch = async (url: string, init?: RequestInit) => handler(url, init);
  return () => { globalThis.fetch = original; };
}

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body, headers: { get: () => null } };
}

test("getMediaUrl: returns media info on success", async () => {
  let calledUrl = "";
  const restore = mockFetch((url) => {
    calledUrl = url;
    return jsonResponse({ url: "https://lookaside/abc", mime_type: "image/jpeg", id: "M1", file_size: 1234 });
  });
  try {
    const info = await getMediaUrl("M1", "TOKEN");
    assert.equal(info.url, "https://lookaside/abc");
    assert.equal(info.mime_type, "image/jpeg");
    assert.match(calledUrl, /\/v20\.0\/M1$/);
  } finally { restore(); }
});

test("getMediaUrl: throws WhatsAppApiError on API error", async () => {
  const restore = mockFetch(() => jsonResponse({ error: { message: "bad", code: 100 } }, false, 400));
  try {
    await assert.rejects(() => getMediaUrl("M1", "TOKEN"), WhatsAppApiError);
  } finally { restore(); }
});

test("downloadMedia: returns buffer + content type from headers", async () => {
  const bytes = Buffer.from("hello-bytes");
  const restore = mockFetch(() => ({
    ok: true, status: 200,
    headers: { get: (h: string) => (h === "content-type" ? "image/png" : null) },
    arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  }));
  try {
    const { buffer, contentType } = await downloadMedia("https://lookaside/abc", "TOKEN");
    assert.equal(contentType, "image/png");
    assert.equal(buffer.toString(), "hello-bytes");
  } finally { restore(); }
});

test("downloadMedia: throws on non-OK", async () => {
  const restore = mockFetch(() => ({ ok: false, status: 404, headers: { get: () => null } }));
  try {
    await assert.rejects(() => downloadMedia("https://x", "T"), WhatsAppApiError);
  } finally { restore(); }
});

test("sendWhatsAppMedia: posts media payload + returns wamid", async () => {
  let sentBody: any;
  const restore = mockFetch((_url, init) => {
    sentBody = JSON.parse(String(init?.body));
    return jsonResponse({ messages: [{ id: "wamid.SENT" }], contacts: [{ wa_id: "15551234567" }] });
  });
  try {
    const res = await sendWhatsAppMedia("PNID", "TOKEN", "+15551234567", "image", "https://x/y.jpg", "cap");
    assert.equal(res.wamid, "wamid.SENT");
    assert.equal(sentBody.type, "image");
    assert.equal(sentBody.image.link, "https://x/y.jpg");
    assert.equal(sentBody.image.caption, "cap");
  } finally { restore(); }
});

test("sendWhatsAppTemplate: posts template payload + returns wamid", async () => {
  let sentBody: any;
  const restore = mockFetch((_url, init) => {
    sentBody = JSON.parse(String(init?.body));
    return jsonResponse({ messages: [{ id: "wamid.T" }] });
  });
  try {
    const res = await sendWhatsAppTemplate("PNID", "TOKEN", "+1", "welcome", "en_US", ["Asha"]);
    assert.equal(res.wamid, "wamid.T");
    assert.equal(sentBody.type, "template");
    assert.equal(sentBody.template.name, "welcome");
    assert.equal(sentBody.template.components[0].parameters[0].text, "Asha");
  } finally { restore(); }
});

test("sendWhatsAppMedia: surfaces permanent API errors", async () => {
  const restore = mockFetch(() => jsonResponse({ error: { message: "unsupported", code: 131051 } }, false, 400));
  try {
    await assert.rejects(
      () => sendWhatsAppMedia("PNID", "TOKEN", "+1", "image", "https://x/y.jpg"),
      (err: unknown) => err instanceof WhatsAppApiError && err.isPermanent,
    );
  } finally { restore(); }
});

// ── Inbound pipeline: simulated webhook + mocked fetch ────────
// Mirrors processMessage's media branch end-to-end minus the Supabase upload
// (a thin wrapper): parse the webhook → resolve URL → download → derive the
// deterministic storage path + content_type.

test("inbound media pipeline: webhook → mediaUrl → download → path", async () => {
  const wamsg = {
    id: "wamid.IN1", from: "15551234567", timestamp: "1700000000",
    type: "image", image: { id: "MEDIA42", mime_type: "image/jpeg", caption: "spa pic" },
  } as WhatsAppMessage;

  const media = extractMedia(wamsg);
  assert.ok(media);
  assert.equal(media.mediaId, "MEDIA42");
  assert.equal(mediaContentType(media.type), "image");

  const bytes = Buffer.from("JPEGDATA");
  const restore = mockFetch((url) => {
    if (url.endsWith("/MEDIA42")) {
      return jsonResponse({ url: "https://lookaside/dl", mime_type: "image/jpeg", id: "MEDIA42", file_size: bytes.length });
    }
    return {
      ok: true, status: 200,
      headers: { get: (h: string) => (h === "content-type" ? "image/jpeg" : null) },
      arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    };
  });
  try {
    const info     = await getMediaUrl(media.mediaId, "TOKEN");
    const download = await downloadMedia(info.url, "TOKEN", media.mime);
    const path     = buildMediaPath("ws1", "conv1", wamsg.id, info.mime_type);

    assert.equal(download.buffer.toString(), "JPEGDATA");
    assert.equal(download.contentType, "image/jpeg");
    assert.equal(path, "ws1/conv1/wamid_IN1.jpg");
  } finally { restore(); }
});
