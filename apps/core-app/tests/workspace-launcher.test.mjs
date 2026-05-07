import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWorkspaceAppUrl,
  resolveShopsAppBaseUrl,
  resolveSelectedWorkspaceSlug,
} from "../lib/workspace-launcher.mjs";

test("resolveSelectedWorkspaceSlug prefers the requested workspace when available", () => {
  const workspaces = [
    { slug: "alpha-workspace" },
    { slug: "beta-workspace" },
  ];

  assert.equal(
    resolveSelectedWorkspaceSlug(workspaces, "beta-workspace"),
    "beta-workspace",
  );
});

test("resolveSelectedWorkspaceSlug falls back to the first workspace", () => {
  const workspaces = [
    { slug: "alpha-workspace" },
    { slug: "beta-workspace" },
  ];

  assert.equal(
    resolveSelectedWorkspaceSlug(workspaces, "missing-workspace"),
    "alpha-workspace",
  );
});

test("buildWorkspaceAppUrl creates the workspace launcher path safely", () => {
  assert.equal(
    buildWorkspaceAppUrl("http://localhost:3001/", "blue-market"),
    "http://localhost:3001/w/blue-market",
  );
});

test("resolveShopsAppBaseUrl prefers the configured app base URL", () => {
  assert.equal(
    resolveShopsAppBaseUrl("http://localhost:3100/", "localhost"),
    "http://localhost:3100",
  );
});

test("resolveShopsAppBaseUrl falls back to localhost during local development", () => {
  assert.equal(
    resolveShopsAppBaseUrl(undefined, "localhost"),
    "http://localhost:3001",
  );
});

test("resolveShopsAppBaseUrl falls back to the production domain outside local development", () => {
  assert.equal(
    resolveShopsAppBaseUrl(undefined, "app.nexoraxs.com"),
    "https://shops.nexoraxs.com",
  );
});
