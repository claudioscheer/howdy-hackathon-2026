import Link from "next/link";
import { LOGIN_PAGE } from "@/lib/ui/copy";
import { LoginForm } from "@/lib/ui/login-form";
import { LoginShowcase } from "@/lib/ui/login-showcase";

export default function LoginPage(): React.JSX.Element {
  return (
    <div className="grid min-h-screen grid-cols-1 bg-white font-sans text-black lg:grid-cols-2">
      <div className="relative flex min-h-screen flex-col items-center justify-center p-8 sm:p-12 lg:p-16">
        <Link
          href="/"
          data-testid="back-home-link"
          className="absolute top-8 left-8 inline-flex items-center text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f] transition-colors hover:text-black sm:top-12 sm:left-12"
        >
          ← Back to Overview
        </Link>

        <div className="flex w-full max-w-md flex-col justify-center">
          <div className="mb-8 flex flex-col">
            <span
              data-testid="login-badge"
              className="mb-4 inline-flex w-fit items-center rounded-full border border-[#e0e0e8] bg-white px-3 py-1 text-xs font-normal uppercase tracking-[0.96px] text-[#5a5a5f]"
            >
              {LOGIN_PAGE.badge}
            </span>
            <h1
              data-testid="login-title"
              className="text-3xl font-bold uppercase leading-[0.95] tracking-[1.2px] text-black sm:text-4xl"
            >
              {LOGIN_PAGE.title}
            </h1>
            <p
              data-testid="login-description"
              className="mt-3 max-w-sm text-sm leading-relaxed text-[#5a5a5f]"
            >
              {LOGIN_PAGE.description}
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="absolute bottom-6 text-[12px] text-zinc-400">
          {LOGIN_PAGE.disclaimer}
        </p>
      </div>

      <div className="flex w-full items-center justify-center">
        <LoginShowcase />
      </div>
    </div>
  );
}
