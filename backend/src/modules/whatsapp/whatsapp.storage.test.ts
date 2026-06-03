import { test } from "node:test";
import assert from "node:assert/strict";
import { extensionForMime, buildMediaPath } from "./whatsapp.storage";

test("extensionForMime: known MIME types", () => {
  assert.equal(extensionForMime("image/jpeg"), "jpg");
  assert.equal(extensionForMime("image/png"), "png");
  assert.equal(extensionForMime("application/pdf"), "pdf");
  assert.equal(extensionForMime("video/mp4"), "mp4");
});

test("extensionForMime: strips MIME parameters", () => {
  assert.equal(extensionForMime("audio/ogg; codecs=opus"), "ogg");
  assert.equal(extensionForMime("IMAGE/JPEG"), "jpg");
});

test("extensionForMime: falls back to subtype then bin", () => {
  assert.equal(extensionForMime("application/zip"), "zip");
  assert.equal(extensionForMime("application/vnd.some.long.subtype"), "bin");
  assert.equal(extensionForMime("garbage"), "bin");
});

test("buildMediaPath: scoped by workspace + conversation, safe wamid + ext", () => {
  const p = buildMediaPath("ws1", "conv1", "wamid.ABC=", "image/png");
  // wamid is sanitised: non [a-zA-Z0-9_-] chars (incl. "." and "=") → "_".
  assert.equal(p, "ws1/conv1/wamid_ABC_.png");
});
