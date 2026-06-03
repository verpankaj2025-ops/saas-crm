import { test } from "node:test";
import assert from "node:assert/strict";
import { quoteOrValue } from "./leads.repository";

// quoteOrValue is the escape used before embedding a search term into a
// PostgREST `.or()` expression. The value must always be wrapped in double
// quotes (so commas/parens are treated as data, not structure) with any
// backslash or double-quote backslash-escaped.

test("quoteOrValue: wraps plain value in double quotes", () => {
  assert.equal(quoteOrValue("%spa%"), '"%spa%"');
});

test("quoteOrValue: commas/parens stay inside the quotes (no filter injection)", () => {
  // A naive build would let these break out of the ilike condition.
  assert.equal(quoteOrValue("%a,b)%"), '"%a,b)%"');
});

test("quoteOrValue: escapes embedded double quotes", () => {
  assert.equal(quoteOrValue('%a"b%'), '"%a\\"b%"');
});

test("quoteOrValue: escapes backslashes before quotes", () => {
  assert.equal(quoteOrValue("%a\\b%"), '"%a\\\\b%"');
});
