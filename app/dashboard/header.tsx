import Link from "next/link";
import { DASHBOARD_PAGE } from "@/lib/ui/copy";

export function DashboardHeader(): React.JSX.Element {
  return (
    <header className="border-b border-[#e0e0e8] bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            data-testid="brand-link"
            className="text-sm font-bold uppercase tracking-[1.17px] text-black"
          >
            Howdy Coach
          </Link>
          <span className="text-xs text-[#e0e0e8]">/</span>
          <span
            data-testid="dashboard-badge"
            className="text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f]"
          >
            {DASHBOARD_PAGE.badge}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            data-testid="sign-out-link"
            className="text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f] transition-colors hover:text-black"
          >
            Sign Out
          </Link>
        </div>
      </div>
    </header>
  );
}
