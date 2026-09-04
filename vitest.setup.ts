import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

Object.defineProperty(window, "matchMedia", {
  configurable: true,
  writable: true,
  value: (query: string) => ({
    matches: true,
    media: query,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: () => undefined,
    removeListener: () => undefined,
    dispatchEvent: () => true,
  }),
});

vi.mock("next/font/google", () => ({
  Geist: () => ({
    variable: "--font-geist-sans",
    className: "font-geist",
  }),
  Geist_Mono: () => ({
    variable: "--font-geist-mono",
    className: "font-geist-mono",
  }),
  Barlow: () => ({
    className: "font-barlow-italic",
  }),
}));

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    prefetch: vi.fn(),
    back: vi.fn(),
  })),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
}));
