import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("Layer 4: Acceptance Criteria Registry", () => {
  const acceptancePath = path.resolve(import.meta.dirname, "../../acceptance.json");

  it("contains valid acceptance schema", () => {
    expect(fs.existsSync(acceptancePath)).toBe(true);
    const content = JSON.parse(fs.readFileSync(acceptancePath, "utf8"));
    expect(content.project).toBe("Howdy Interview Coach");
    expect(Array.isArray(content.criteria)).toBe(true);
    expect(content.criteria.length).toBeGreaterThan(0);

    for (const item of content.criteria) {
      expect(item).toHaveProperty("id");
      expect(item).toHaveProperty("layer");
      expect(item).toHaveProperty("description");
      expect(typeof item.passes).toBe("boolean");
    }
  });
});
