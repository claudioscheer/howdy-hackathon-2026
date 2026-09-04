import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  FORBIDDEN_LOGIN_TEST_IDS,
  proveLoginContract,
  REQUIRED_LOGIN_TEST_IDS,
} from "./login-contract";

const repoRoot = path.resolve(import.meta.dirname, "../..");

function createFixtureWorkspace(overrides: {
  pageContent?: string;
  formContent?: string;
  showcaseContent?: string;
  skipPage?: boolean;
  skipForm?: boolean;
  skipShowcase?: boolean;
}): string {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "login-contract-"));
  fs.mkdirSync(path.join(root, "app/login"), { recursive: true });
  fs.mkdirSync(path.join(root, "lib/ui"), { recursive: true });

  const validPage = `
    <a data-testid="back-home-link">Home</a>
    <span data-testid="login-badge">Badge</span>
    <h1 data-testid="login-title">Title</h1>
    <p data-testid="login-description">Desc</p>
  `;

  const validForm = `
    <form data-testid="login-form">
      <input data-testid="email-input" />
      <input data-testid="password-input" placeholder="********" />
      <button data-testid="login-submit">Submit</button>
    </form>
    // router.push("/dashboard")
  `;

  const validShowcase = `
    <div data-testid="login-showcase">Showcase</div>
  `;

  if (!overrides.skipPage) {
    fs.writeFileSync(
      path.join(root, "app/login/page.tsx"),
      overrides.pageContent ?? validPage,
    );
  }
  if (!overrides.skipForm) {
    fs.writeFileSync(
      path.join(root, "lib/ui/login-form.tsx"),
      overrides.formContent ?? validForm,
    );
  }
  if (!overrides.skipShowcase) {
    fs.writeFileSync(
      path.join(root, "lib/ui/login-showcase.tsx"),
      overrides.showcaseContent ?? validShowcase,
    );
  }
  return root;
}

describe("proveLoginContract", () => {
  it("proves login contract on the real repo", () => {
    const proof = proveLoginContract(repoRoot);
    expect(proof.pass).toBe(true);
    expect(proof.evidence).toContain("app/login/page.tsx");
  });

  it("fails when app/login/page.tsx is missing", () => {
    const root = createFixtureWorkspace({ skipPage: true });
    const proof = proveLoginContract(root);
    expect(proof.pass).toBe(false);
    expect(proof.evidence).toBe("app/login/page.tsx is missing");
  });

  it("fails when lib/ui/login-form.tsx is missing", () => {
    const root = createFixtureWorkspace({ skipForm: true });
    const proof = proveLoginContract(root);
    expect(proof.pass).toBe(false);
    expect(proof.evidence).toBe("lib/ui/login-form.tsx is missing");
  });

  it("fails when lib/ui/login-showcase.tsx is missing", () => {
    const root = createFixtureWorkspace({ skipShowcase: true });
    const proof = proveLoginContract(root);
    expect(proof.pass).toBe(false);
    expect(proof.evidence).toBe("lib/ui/login-showcase.tsx is missing");
  });

  it("fails when a required testid is missing", () => {
    const root = createFixtureWorkspace({
      pageContent: '<div data-testid="login-badge">Only badge</div>',
    });
    const proof = proveLoginContract(root);
    expect(proof.pass).toBe(false);
    expect(proof.evidence).toContain("Missing required login data-testid");
  });

  it("fails when a forbidden testid is present", () => {
    const root = createFixtureWorkspace({
      formContent: `
        <form data-testid="login-form">
          <input data-testid="email-input" />
          <input data-testid="password-input" placeholder="********" />
          <button data-testid="login-submit">Submit</button>
          <div data-testid="login-success">Card</div>
        </form>
        // router.push("/dashboard")
      `,
    });
    const proof = proveLoginContract(root);
    expect(proof.pass).toBe(false);
    expect(proof.evidence).toContain("Found forbidden login data-testid");
  });

  it("fails when forbidden marketing accents are present", () => {
    const root = createFixtureWorkspace({
      pageContent: `
        <a data-testid="back-home-link" className="bg-blue-500">Home</a>
        <span data-testid="login-badge">Badge</span>
        <h1 data-testid="login-title">Title</h1>
        <p data-testid="login-description">Desc</p>
      `,
    });
    const proof = proveLoginContract(root);
    expect(proof.pass).toBe(false);
    expect(proof.evidence).toContain("Forbidden marketing accent classes");
  });

  it("fails when password placeholder or dashboard redirect is missing", () => {
    const root = createFixtureWorkspace({
      formContent: `
        <form data-testid="login-form">
          <input data-testid="email-input" />
          <input data-testid="password-input" placeholder="wrong" />
          <button data-testid="login-submit">Submit</button>
        </form>
      `,
    });
    const proof = proveLoginContract(root);
    expect(proof.pass).toBe(false);
    expect(proof.evidence).toContain('passwordPlaceholder="********"');
    expect(proof.evidence).toContain(
      'Login submit must redirect directly to "/dashboard"',
    );
  });

  it("exports required and forbidden test IDs collections", () => {
    expect(REQUIRED_LOGIN_TEST_IDS.length).toBeGreaterThan(0);
    expect(FORBIDDEN_LOGIN_TEST_IDS).toContain("login-success");
  });
});
