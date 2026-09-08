import Link from "next/link";
import { CREATE_OPPORTUNITY_PAGE } from "@/lib/ui/copy";
import { DashboardHeader } from "../header";
import { CreateOpportunityForm } from "./create-form";

export default function CreateOpportunityPage(): React.JSX.Element {
  return (
    <div className="min-h-screen bg-white text-black">
      <DashboardHeader />
      <main className="mx-auto flex max-w-6xl flex-col gap-8 px-6 py-10">
        <Link
          href="/dashboard"
          data-testid="back-to-dashboard-link"
          className="text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f] transition-colors hover:text-black"
        >
          ← {CREATE_OPPORTUNITY_PAGE.backToDashboard}
        </Link>
        <div className="flex max-w-xl flex-col gap-3">
          <h1
            data-testid="create-opportunity-title"
            className="text-3xl font-bold uppercase leading-[0.95] tracking-[1.2px] text-black"
          >
            {CREATE_OPPORTUNITY_PAGE.title}
          </h1>
          <p
            data-testid="create-opportunity-description"
            className="text-sm leading-relaxed text-[#5a5a5f]"
          >
            {CREATE_OPPORTUNITY_PAGE.description}
          </p>
        </div>
        <CreateOpportunityForm />
      </main>
    </div>
  );
}
