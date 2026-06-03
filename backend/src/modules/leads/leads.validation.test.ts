import { test } from "node:test";
import assert from "node:assert/strict";
import { CreateLeadSchema, UpdateLeadSchema, LeadFilterSchema } from "./leads.validation";

const CONTACT = "11111111-1111-1111-1111-111111111111";

test("CreateLeadSchema: minimal payload applies defaults", () => {
  const r = CreateLeadSchema.parse({ contact_id: CONTACT });
  assert.equal(r.contact_id, CONTACT);
  assert.equal(r.source, "manual");
  assert.equal(r.status, "new");
  assert.equal(r.amount, 0);
  assert.equal(r.paid_amount, 0);
});

test("CreateLeadSchema: rejects non-uuid contact_id", () => {
  assert.equal(CreateLeadSchema.safeParse({ contact_id: "nope" }).success, false);
});

test("CreateLeadSchema: rejects negative amount", () => {
  assert.equal(CreateLeadSchema.safeParse({ contact_id: CONTACT, amount: -1 }).success, false);
});

test("CreateLeadSchema: rejects more than 2 decimal places", () => {
  assert.equal(CreateLeadSchema.safeParse({ contact_id: CONTACT, amount: 10.123 }).success, false);
  assert.equal(CreateLeadSchema.safeParse({ contact_id: CONTACT, amount: 10.12 }).success, true);
});

test("CreateLeadSchema: allows overpayment (paid_amount > amount)", () => {
  // Overpayment / credit is intentionally permitted (no cross-field guard).
  const r = CreateLeadSchema.safeParse({ contact_id: CONTACT, amount: 100, paid_amount: 150 });
  assert.equal(r.success, true);
});

test("CreateLeadSchema: rejects unknown status / source", () => {
  assert.equal(CreateLeadSchema.safeParse({ contact_id: CONTACT, status: "won" }).success, false);
  assert.equal(CreateLeadSchema.safeParse({ contact_id: CONTACT, source: "tiktok" }).success, false);
});

test("CreateLeadSchema: accepts all six statuses and seven sources", () => {
  for (const status of ["new", "contacted", "qualified", "booked", "paid", "lost"]) {
    assert.equal(CreateLeadSchema.safeParse({ contact_id: CONTACT, status }).success, true, status);
  }
  for (const source of ["whatsapp", "meta_ads", "website", "google_business", "manual", "referral", "other"]) {
    assert.equal(CreateLeadSchema.safeParse({ contact_id: CONTACT, source }).success, true, source);
  }
});

test("UpdateLeadSchema: strips contact_id (cannot be reassigned)", () => {
  const r = UpdateLeadSchema.parse({ contact_id: CONTACT, status: "booked" });
  assert.equal("contact_id" in r, false);
  assert.equal(r.status, "booked");
});

test("UpdateLeadSchema: empty object is valid (no-op update)", () => {
  assert.equal(UpdateLeadSchema.safeParse({}).success, true);
});

test("LeadFilterSchema: coerces query strings and applies defaults", () => {
  const r = LeadFilterSchema.parse({ page: "2", limit: "10" });
  assert.equal(r.page, 2);
  assert.equal(r.limit, 10);

  const d = LeadFilterSchema.parse({});
  assert.equal(d.page, 1);
  assert.equal(d.limit, 25);
});

test("LeadFilterSchema: rejects limit above 100", () => {
  assert.equal(LeadFilterSchema.safeParse({ limit: "500" }).success, false);
});
