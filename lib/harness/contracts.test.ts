import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  proveEmptyAnswerContract,
  proveGroundingContract,
  proveLandingContract,
  proveSchemaContract,
  proveStateCapContract,
  REQUIRED_LANDING_TEST_IDS,
} from "./contracts";

describe("layer 0 contracts", () => {
  it("proves schema, grounding, cap, and empty-answer with negatives", () => {
    expect(proveSchemaContract().pass).toBe(true);
    expect(proveGroundingContract().pass).toBe(true);
    expect(proveStateCapContract().pass).toBe(true);
    expect(proveEmptyAnswerContract().pass).toBe(true);
  });

  it("proves landing testids on the real page", () => {
    const proof = proveLandingContract(
      path.resolve(import.meta.dirname, "../.."),
    );
    expect(proof.pass).toBe(true);
    expect(REQUIRED_LANDING_TEST_IDS.length).toBe(5);
  });

  it("fails when the landing page is missing or lacks a testid", () => {
    const missingRoot = fs.mkdtempSync(path.join(os.tmpdir(), "no-page-"));
    expect(proveLandingContract(missingRoot).pass).toBe(false);
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "landing-"));
    fs.mkdirSync(path.join(root, "app"));
    fs.writeFileSync(
      path.join(root, "app/page.tsx"),
      "export default function Page() { return null }",
    );
    expect(proveLandingContract(root).pass).toBe(false);
    expect(proveLandingContract(root).evidence).toMatch(/missing data-testid/);
  });
});
