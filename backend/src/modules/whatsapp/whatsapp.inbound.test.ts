import { test } from "node:test";
import assert from "node:assert/strict";
import { extractMedia, mediaContentType } from "./whatsapp.inbound";
import type { WhatsAppMessage } from "./whatsapp.types";

const base = { id: "wamid.X", from: "15551234567", timestamp: "1700000000" };

test("extractMedia: image with caption", () => {
  const msg = { ...base, type: "image", image: { id: "M1", mime_type: "image/jpeg", caption: "hello" } } as WhatsAppMessage;
  assert.deepEqual(extractMedia(msg), {
    type: "image", mediaId: "M1", mime: "image/jpeg", caption: "hello", filename: null,
  });
});

test("extractMedia: document carries filename, no caption", () => {
  const msg = { ...base, type: "document", document: { id: "D1", mime_type: "application/pdf", filename: "invoice.pdf" } } as WhatsAppMessage;
  assert.deepEqual(extractMedia(msg), {
    type: "document", mediaId: "D1", mime: "application/pdf", caption: null, filename: "invoice.pdf",
  });
});

test("extractMedia: audio/video/sticker resolve their ids", () => {
  assert.equal(extractMedia({ ...base, type: "audio", audio: { id: "A1", mime_type: "audio/ogg" } } as WhatsAppMessage)?.mediaId, "A1");
  assert.equal(extractMedia({ ...base, type: "video", video: { id: "V1", mime_type: "video/mp4" } } as WhatsAppMessage)?.mediaId, "V1");
  assert.equal(extractMedia({ ...base, type: "sticker", sticker: { id: "S1", mime_type: "image/webp" } } as WhatsAppMessage)?.type, "sticker");
});

test("extractMedia: text and unknown types return null", () => {
  assert.equal(extractMedia({ ...base, type: "text", text: { body: "hi" } } as WhatsAppMessage), null);
  assert.equal(extractMedia({ ...base, type: "location" } as WhatsAppMessage), null);
});

test("extractMedia: media object missing id returns null", () => {
  assert.equal(extractMedia({ ...base, type: "image", image: undefined } as unknown as WhatsAppMessage), null);
});

test("mediaContentType: sticker maps to image, others pass through", () => {
  assert.equal(mediaContentType("sticker"), "image");
  assert.equal(mediaContentType("image"), "image");
  assert.equal(mediaContentType("document"), "document");
  assert.equal(mediaContentType("audio"), "audio");
  assert.equal(mediaContentType("video"), "video");
});
