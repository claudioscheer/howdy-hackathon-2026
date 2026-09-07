import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  proveGroundingContract,
  proveLandingContract,
  proveSchemaContract,
  REQUIRED_LANDING_TEST_IDS,
} from "./contracts";

describe("layer 0 contracts", () => {
  it("proves shared schema and transcript grounding", () => {
    expect(proveSchemaContract().pass).toBe(true);
    expect(proveGroundingContract().pass).toBe(true);
  });

  it("proves landing markers on the real page", () => {
    const proof = proveLandingContract(
      path.resolve(import.meta.dirname, "../.."),
    );
    expect(proof.pass).toBe(true);
    expect(REQUIRED_LANDING_TEST_IDS).toHaveLength(4);
  });

  it("reports missing pages, markers, and design violations", () => {
    const missing = fs.mkdtempSync(path.join(os.tmpdir(), "missing-page-"));
    expect(proveLandingContract(missing).evidence).toMatch(/missing/);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "landing-"));
    fs.mkdirSync(path.join(root, "app"));
    fs.writeFileSync(path.join(root, "app/page.tsx"), "export default null");
    expect(proveLandingContract(root).evidence).toMatch(/missing data-testid/);
    fs.writeFileSync(
      path.join(root, "app/page.tsx"),
      '<div className="bg-white" data-testid="app-badge"><i data-testid="hero-title"/><i data-testid="hero-description"/><i data-testid="start-practice"/></div>',
    );
    expect(proveLandingContract(root).evidence).toMatch(/violates DESIGN/);
  });
});
