import test from "node:test";
import assert from "node:assert/strict";
import {
  SHOPS_MODE_OPTIONS,
  formatShopsModeLabel,
  isValidShopsMode,
} from "../lib/shops-mode.mjs";

test("Shops mode options expose the three foundation choices", () => {
  assert.deepEqual(
    SHOPS_MODE_OPTIONS.map((option) => option.value),
    ["business_management", "online_store", "both"],
  );
});

test("isValidShopsMode accepts supported values only", () => {
  assert.equal(isValidShopsMode("business_management"), true);
  assert.equal(isValidShopsMode("online_store"), true);
  assert.equal(isValidShopsMode("both"), true);
  assert.equal(isValidShopsMode("inventory"), false);
});

test("formatShopsModeLabel returns a readable placeholder dashboard label", () => {
  assert.equal(
    formatShopsModeLabel("online_store"),
    "Online Store",
  );
});
