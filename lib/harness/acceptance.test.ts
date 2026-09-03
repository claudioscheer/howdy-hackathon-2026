import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";
import { ACCEPTANCE_SPECS } from "./report";

describe("acceptance.json", () => {
  const acceptancePath = path.resolve(
    import.meta.dirname,
    "../../acceptance.json",
  );

  it("lists criteria with ids and boolean passes flags", () => {
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

  it("keeps canonical criterion ids in the harness spec", () => {
    const ids = ACCEPTANCE_SPECS.map((item) => item.id);
    expect(ids).toContain("ACC-UI-LANDING");
    expect(ids).toContain("ACC-L2-REVIEW");
    expect(ids).toContain("ACC-L1-CANARIES");
    expect(ids).toContain("ACC-L0-EMPTY-ANSWER");
  });
});
