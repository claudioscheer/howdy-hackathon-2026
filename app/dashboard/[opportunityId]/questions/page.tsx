import Link from "next/link";
import { notFound } from "next/navigation";
import { CREATE_OPPORTUNITY_PAGE, QUESTIONS_PAGE } from "@/lib/ui/copy";
import {
  getQuestionPrepStatus,
  listPlannedQuestions,
} from "@/lib/db/questions";
import { DashboardHeader } from "../../header";
import {
  GenerateQuestionsPanel,
  GeneratingQuestionsStatus,
} from "./generate-panel";
import { ReviewQuestionsForm } from "./review-form";

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}): Promise<React.JSX.Element> {
  const { opportunityId } = await params;
  const status = await getQuestionPrepStatus(opportunityId);
  if (status === null) {
    notFound();
  }
  const questions = await listPlannedQuestions(opportunityId);
  const showReview = status === "ready" || questions.length > 0;

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
        <h1
          data-testid="questions-page-title"
          className="text-3xl font-bold uppercase leading-[0.95] tracking-[1.2px] text-black"
        >
          {showReview ? QUESTIONS_PAGE.title : QUESTIONS_PAGE.generateTitle}
        </h1>
        {status === "generating" ? <GeneratingQuestionsStatus /> : null}
        {status === "idle" && questions.length === 0 ? (
          <GenerateQuestionsPanel opportunityId={opportunityId} />
        ) : null}
        {showReview && status !== "generating" ? (
          <ReviewQuestionsForm
            opportunityId={opportunityId}
            initialPrompts={questions.map((question) => question.prompt)}
          />
        ) : null}
      </main>
    </div>
  );
}
