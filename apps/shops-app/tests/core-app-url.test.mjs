import test from "node:test";
import assert from "node:assert/strict";
import { resolveCoreAppBaseUrl } from "../lib/core-app-url.mjs";

test("resolveCoreAppBaseUrl prefers the configured core app base URL", () => {
  assert.equal(
    resolveCoreAppBaseUrl("http://localhost:3100/", "localhost"),
    "http://localhost:3100",
  );
});

test("resolveCoreAppBaseUrl falls back to localhost during local development", () => {
  assert.equal(
    resolveCoreAppBaseUrl(undefined, "localhost"),
    "http://localhost:3000",
  );
});

test("resolveCoreAppBaseUrl falls back to the production core app domain outside local development", () => {
  assert.equal(
    resolveCoreAppBaseUrl(undefined, "shops.nexoraxs.com"),
    "https://app.nexoraxs.com",
  );
});
