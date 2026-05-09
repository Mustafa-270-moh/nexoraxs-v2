import test from "node:test";
import assert from "node:assert/strict";
import {
  SHOPS_BUSINESS_TYPE_OPTIONS,
  SHOPS_COUNTRY_OPTIONS,
  SHOPS_CURRENCY_OPTIONS,
  createInitialShopsSetup,
  formatShopsBusinessTypeLabel,
  formatShopsCountryLabel,
  formatShopsCurrencyLabel,
} from "../lib/shops-setup.mjs";

test("Shops setup exposes the supported business types for the wizard", () => {
  assert.deepEqual(
    SHOPS_BUSINESS_TYPE_OPTIONS.map((option) => option.value),
    [
      "mobile_store",
      "clothing",
      "shoes",
      "supermarket",
      "electronics",
      "other",
    ],
  );
});

test("Shops setup defaults use Egypt, EGP, and Main Branch", () => {
  assert.deepEqual(createInitialShopsSetup(null), {
    business_type: "mobile_store",
    country: "EG",
    currency: "EGP",
    first_branch_name: "Main Branch",
  });
});

test("Shops setup label helpers stay readable on the placeholder dashboard", () => {
  assert.equal(formatShopsBusinessTypeLabel("electronics"), "Electronics");
  assert.equal(formatShopsCountryLabel(SHOPS_COUNTRY_OPTIONS[0].value), "Egypt");
  assert.equal(formatShopsCurrencyLabel(SHOPS_CURRENCY_OPTIONS[0].value), "EGP");
});
