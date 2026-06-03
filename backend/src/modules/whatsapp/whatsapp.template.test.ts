import { test } from "node:test";
import assert from "node:assert/strict";
import { orderedTemplateParams, renderTemplateBody } from "./whatsapp.template";

test("orderedTemplateParams: returns values in the template's declared order", () => {
  const params = orderedTemplateParams(["first_name", "booking_date"], {
    booking_date: "2025-01-02",
    first_name:   "Asha",
  });
  assert.deepEqual(params, ["Asha", "2025-01-02"]);
});

test("orderedTemplateParams: missing values become empty strings", () => {
  assert.deepEqual(orderedTemplateParams(["a", "b"], { a: "x" }), ["x", ""]);
  assert.deepEqual(orderedTemplateParams(["a"]), [""]);
});

test("orderedTemplateParams: no variables → empty array", () => {
  assert.deepEqual(orderedTemplateParams([], { a: "x" }), []);
});

test("renderTemplateBody: substitutes {{name}} placeholders", () => {
  const out = renderTemplateBody("Hi {{first_name}}, see you {{booking_date}}.", {
    first_name:   "Asha",
    booking_date: "Mon",
  });
  assert.equal(out, "Hi Asha, see you Mon.");
});

test("renderTemplateBody: tolerates whitespace inside braces", () => {
  assert.equal(renderTemplateBody("Hi {{ first_name }}", { first_name: "Bo" }), "Hi Bo");
});

test("renderTemplateBody: leaves unknown placeholders intact", () => {
  assert.equal(renderTemplateBody("Hi {{missing}}", {}), "Hi {{missing}}");
});
