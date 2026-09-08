import Link from "next/link";
import { notFound } from "next/navigation";
import { CREATE_OPPORTUNITY_PAGE } from "@/lib/ui/copy";
import {
  getOpportunityForEdit,
  toCreateInput,
} from "@/lib/db/opportunity-write";
import { DashboardHeader } from "../../header";
import { CreateOpportunityForm } from "../../new/create-form";
import { updateOpportunityAction } from "../../actions";

export default async function EditOpportunityPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}): Promise<React.JSX.Element> {
  const { opportunityId } = await params;
  const record = await getOpportunityForEdit(opportunityId);
  if (!record) {
    notFound();
  }

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
            data-testid="edit-opportunity-title"
            className="text-3xl font-bold uppercase leading-[0.95] tracking-[1.2px] text-black"
          >
            {CREATE_OPPORTUNITY_PAGE.editTitle}
          </h1>
        </div>
        <CreateOpportunityForm
          action={updateOpportunityAction}
          defaults={toCreateInput(record)}
          opportunityId={opportunityId}
          submitLabel={CREATE_OPPORTUNITY_PAGE.saveEditsButton}
        />
      </main>
    </div>
  );
}
