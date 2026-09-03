import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

describe("acceptance.json", () => {
  const acceptancePath = path.resolve(import.meta.dirname, "../../acceptance.json");

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

    const ids = content.criteria.map((item: { id: string }) => item.id);
    expect(ids).toContain("ACC-UI-LANDING");
  });
});
