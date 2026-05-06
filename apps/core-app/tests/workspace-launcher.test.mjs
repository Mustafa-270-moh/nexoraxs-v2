import test from "node:test";
import assert from "node:assert/strict";
import {
  buildWorkspaceAppUrl,
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
