import { describe, expect, it, vi } from "vitest";

const prismaCtor = vi.hoisted(() => vi.fn());

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      prismaCtor();
    }
  },
}));

describe("prisma singleton", () => {
  it("reuses one client until reset", async () => {
    vi.resetModules();
    prismaCtor.mockClear();
    const { getPrisma, resetPrismaForTests } = await import("./prisma");

    const first = getPrisma();
    const second = getPrisma();
    expect(first).toBe(second);
    expect(prismaCtor).toHaveBeenCalledTimes(1);

    resetPrismaForTests();
    const third = getPrisma();
    expect(third).not.toBe(first);
    expect(prismaCtor).toHaveBeenCalledTimes(2);
  });
});
