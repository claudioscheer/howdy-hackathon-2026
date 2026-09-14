import Link from "next/link";
import { listDashboardOpportunities } from "@/lib/db/opportunities";
import { DASHBOARD_PAGE } from "@/lib/ui/copy";
import { DashboardHeader } from "./header";
import { OpportunityCard, StatCard } from "./opportunity-card";
import { countOpenablePractice } from "./practice-eligibility";

function DashboardStats({
  opportunityCount,
  practiceCount,
}: {
  opportunityCount: number;
  practiceCount: number;
}): React.JSX.Element {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <StatCard
        label="Active Opportunities"
        value={`${opportunityCount} Roles`}
        testId="stat-opportunities"
      />
      <StatCard
        label="Seeded Practice"
        value={`${practiceCount} Available`}
        testId="stat-links"
      />
      <StatCard
        label="Hackathon Policy"
        value="2 Attempts"
        testId="stat-limits"
      />
    </div>
  );
}

export default async function DashboardPage(): Promise<React.JSX.Element> {
  const opportunities = await listDashboardOpportunities();
  const activeCount = opportunities.filter(
    (item) => item.status === "Active",
  ).length;

  return (
    <div className="min-h-screen bg-white text-black">
      <DashboardHeader />

      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <DashboardStats
          opportunityCount={activeCount}
          practiceCount={countOpenablePractice(opportunities)}
        />

        <div
          data-testid="dashboard-disclaimer"
          className="rounded border border-[#e0e0e8] bg-[#f0f0fa]/40 p-4 text-xs leading-relaxed text-[#5a5a5f]"
        >
          <span className="font-bold text-black uppercase tracking-wide">
            Candidate Protocol:
          </span>{" "}
          {DASHBOARD_PAGE.disclaimer}
        </div>

        <section className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-[0.96px] text-black">
              Managed Opportunities & Practice Sessions
            </h2>
            <Link
              href="/dashboard/new"
              data-testid="create-opportunity-button"
              className="inline-flex items-center justify-center rounded-full border border-black bg-white px-5 py-2.5 text-[13px] font-bold uppercase leading-[0.94] tracking-[1.17px] text-black transition-colors hover:bg-black hover:text-white"
            >
              + {DASHBOARD_PAGE.createButton}
            </Link>
          </div>

          {opportunities.length === 0 ? (
            <p
              data-testid="dashboard-empty-state"
              className="rounded border border-[#e0e0e8] bg-white p-5 text-sm text-[#5a5a5f]"
            >
              {DASHBOARD_PAGE.emptyState}
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {opportunities.map((item) => (
                <OpportunityCard key={item.id} item={item} />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
