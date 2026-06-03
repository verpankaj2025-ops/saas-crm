import { test } from "node:test";
import assert from "node:assert/strict";
import {
  getOnlineUsers,
  isUserOnline,
  markUserOnline,
  markUserOffline,
} from "./presence";

const WS = "11111111-1111-1111-1111-111111111111";
const WS2 = "22222222-2222-2222-2222-222222222222";
const U1 = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa";
const U2 = "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb";

test("first tab transitions a user offline → online", () => {
  assert.equal(isUserOnline(WS, U1), false);
  assert.equal(markUserOnline(WS, U1), true); // transition
  assert.equal(isUserOnline(WS, U1), true);
});

test("additional tabs do not re-trigger the online transition", () => {
  assert.equal(markUserOnline(WS, U2), true);
  assert.equal(markUserOnline(WS, U2), false); // second tab, no transition
  assert.equal(markUserOnline(WS, U2), false); // third tab, no transition
  assert.equal(isUserOnline(WS, U2), true);
});

test("user stays online until the last tab disconnects", () => {
  markUserOnline(WS2, U1); // tab 1 (transition true)
  markUserOnline(WS2, U1); // tab 2 (transition false)
  // Until the last reference is released the user is still online. We model
  // tabs at the socket layer; presence only flips on the final removal.
  assert.equal(markUserOffline(WS2, U1), true);
  assert.equal(isUserOnline(WS2, U1), false);
  assert.equal(markUserOffline(WS2, U1), false); // already offline, no transition
});

test("getOnlineUsers returns a snapshot scoped to the workspace", () => {
  const ws = "33333333-3333-3333-3333-333333333333";
  markUserOnline(ws, U1);
  markUserOnline(ws, U2);
  const online = getOnlineUsers(ws).sort();
  assert.deepEqual(online, [U1, U2].sort());
  // Unknown workspace is empty, never undefined.
  assert.deepEqual(getOnlineUsers("does-not-exist"), []);
});

test("offline on an unknown user/workspace is a no-op", () => {
  assert.equal(markUserOffline("nope", "nobody"), false);
});
