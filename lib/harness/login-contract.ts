import fs from "node:fs";
import path from "node:path";
import { type Proof } from "./contracts";
import { FORBIDDEN_MARKETING_ACCENT_CLASSES } from "./design";

export const REQUIRED_LOGIN_TEST_IDS = [
  "back-home-link",
  "login-badge",
  "login-title",
  "login-description",
  "login-form",
  "email-input",
  "password-input",
  "login-submit",
  "login-showcase",
] as const;

export const FORBIDDEN_LOGIN_TEST_IDS = [
  "login-success",
  "candidate-login",
  "social-auth-google",
] as const;

function checkMissingTestIds(source: string): string[] {
  return REQUIRED_LOGIN_TEST_IDS.filter(
    (id) =>
      !source.includes(`data-testid="${id}"`) &&
      !source.includes(`testId="${id}"`),
  );
}

function checkForbiddenTestIds(source: string): string[] {
  return FORBIDDEN_LOGIN_TEST_IDS.filter((id) =>
    source.includes(`data-testid="${id}"`),
  );
}

function checkLoginDesignViolations(source: string): string[] {
  const violations: string[] = [];
  const foundAccents = FORBIDDEN_MARKETING_ACCENT_CLASSES.filter((cls) =>
    source.includes(cls),
  );
  if (foundAccents.length > 0) {
    violations.push(
      `Forbidden marketing accent classes: ${foundAccents.join(", ")}`,
    );
  }
  const hasAsteriskPlaceholder =
    source.includes('placeholder="********"') ||
    source.includes("passwordPlaceholder");
  if (!hasAsteriskPlaceholder) {
    violations.push('Password input must use passwordPlaceholder="********"');
  }
  if (!source.includes('router.push("/dashboard")')) {
    violations.push('Login submit must redirect directly to "/dashboard"');
  }
  return violations;
}

export function proveLoginContract(rootDir: string): Proof {
  const pagePath = path.join(rootDir, "app/login/page.tsx");
  const formPath = path.join(rootDir, "lib/ui/login-form.tsx");
  const showcasePath = path.join(rootDir, "lib/ui/login-showcase.tsx");

  if (!fs.existsSync(pagePath)) {
    return { pass: false, evidence: "app/login/page.tsx is missing" };
  }
  if (!fs.existsSync(formPath)) {
    return { pass: false, evidence: "lib/ui/login-form.tsx is missing" };
  }
  if (!fs.existsSync(showcasePath)) {
    return { pass: false, evidence: "lib/ui/login-showcase.tsx is missing" };
  }

  const pageSource = fs.readFileSync(pagePath, "utf8");
  const formSource = fs.readFileSync(formPath, "utf8");
  const showcaseSource = fs.readFileSync(showcasePath, "utf8");
  const combinedSource = `${pageSource}\n${formSource}\n${showcaseSource}`;

  const missing = checkMissingTestIds(combinedSource);
  if (missing.length > 0) {
    return {
      pass: false,
      evidence: `Missing required login data-testid: ${missing.join(", ")}`,
    };
  }

  const forbidden = checkForbiddenTestIds(combinedSource);
  if (forbidden.length > 0) {
    return {
      pass: false,
      evidence: `Found forbidden login data-testid: ${forbidden.join(", ")}`,
    };
  }

  const designViolations = checkLoginDesignViolations(combinedSource);
  if (designViolations.length > 0) {
    return {
      pass: false,
      evidence: designViolations.join("; "),
    };
  }

  return {
    pass: true,
    evidence:
      "app/login/page.tsx and lib/ui/login-form.tsx conform to login contract and DESIGN.md",
  };
}
