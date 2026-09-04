import { describe, expect, it } from "vitest";
import { extractElementSnippet, validateLandingDesign } from "./design";

const validSample = `
<div className="bg-black text-white">
  <span data-testid="app-badge" className="uppercase">Badge</span>
  <h1 data-testid="hero-title" className="uppercase">Title</h1>
  <p data-testid="hero-description">Desc</p>
  <a data-testid="start-practice" className="border rounded-full uppercase">Start</a>
</div>
`;

describe("design harness contract", () => {
  describe("extractElementSnippet", () => {
    it("returns null when testid is not in source", () => {
      expect(extractElementSnippet("<div>hello</div>", "missing")).toBeNull();
    });

    it("returns null when openTag is missing before marker", () => {
      expect(extractElementSnippet('data-testid="foo">', "foo")).toBeNull();
    });

    it("returns null when closeTag is missing after marker", () => {
      expect(extractElementSnippet('<div data-testid="foo"', "foo")).toBeNull();
    });

    it("extracts opening tag snippet when well formed", () => {
      expect(
        extractElementSnippet(
          '<a data-testid="btn" className="x">link</a>',
          "btn",
        ),
      ).toBe('<a data-testid="btn" className="x">');
    });
  });

  describe("validateLandingDesign", () => {
    it("passes for valid sample with design doc present", () => {
      const result = validateLandingDesign(validSample, true);
      expect(result.valid).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it("fails when DESIGN.md is missing", () => {
      const result = validateLandingDesign(validSample, false);
      expect(result.valid).toBe(false);
      expect(result.reasons).toContain(
        "DESIGN.md is missing from repository root",
      );
    });

    it("passes for valid light theme sample with bg-white", () => {
      const lightSample = validSample.replace("bg-black", "bg-white");
      const result = validateLandingDesign(lightSample, true);
      expect(result.valid).toBe(true);
      expect(result.reasons).toEqual([]);
    });

    it("fails when valid canvas surface is missing", () => {
      const source = validSample.replace("bg-black", "bg-zinc-50");
      const result = validateLandingDesign(source, true);
      expect(result.valid).toBe(false);
      expect(result.reasons).toContain(
        "missing DESIGN.md canvas surface (must use bg-white for light theme or bg-black for dark theme)",
      );
    });

    it("fails when forbidden accent classes are present", () => {
      const source = validSample.replace(
        'className="uppercase"',
        'className="uppercase bg-blue-100"',
      );
      const result = validateLandingDesign(source, true);
      expect(result.valid).toBe(false);
      expect(result.reasons[0]).toMatch(/violates monochrome palette/);
    });

    it("fails when start-practice lacks ghost pill properties or uses filled background", () => {
      const noPill = validSample.replace("rounded-full", "rounded-sm");
      expect(validateLandingDesign(noPill, true).valid).toBe(false);

      const filled = validSample.replace("border", "bg-foreground");
      expect(validateLandingDesign(filled, true).valid).toBe(false);

      const noCta = validSample.replace('data-testid="start-practice"', "");
      expect(validateLandingDesign(noCta, true).valid).toBe(false);
    });

    it("fails when uppercase typography is missing on hero-title or app-badge", () => {
      const noTitleUpper = validSample.replace(
        '<h1 data-testid="hero-title" className="uppercase">',
        '<h1 data-testid="hero-title" className="lowercase">',
      );
      expect(validateLandingDesign(noTitleUpper, true).valid).toBe(false);

      const noBadgeUpper = validSample.replace(
        '<span data-testid="app-badge" className="uppercase">',
        '<span data-testid="app-badge" className="lowercase">',
      );
      expect(validateLandingDesign(noBadgeUpper, true).valid).toBe(false);

      const noTitle = validSample.replace('data-testid="hero-title"', "");
      expect(validateLandingDesign(noTitle, true).valid).toBe(false);

      const noBadge = validSample.replace('data-testid="app-badge"', "");
      expect(validateLandingDesign(noBadge, true).valid).toBe(false);
    });
  });
});
