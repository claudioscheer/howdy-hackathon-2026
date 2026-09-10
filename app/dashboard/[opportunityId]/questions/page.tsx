import type { PlannedQuestion } from "@prisma/client";
import Link from "next/link";
import { notFound } from "next/navigation";
import { parseInterviewerBrief } from "@/lib/interview/brief";
import { CREATE_OPPORTUNITY_PAGE, QUESTIONS_PAGE } from "@/lib/ui/copy";
import { practicePath } from "@/lib/db/opportunity-item";
import {
  getOpportunityQuestionPrep,
  listPlannedQuestions,
} from "@/lib/db/questions";
import { DashboardHeader } from "../../header";
import {
  GenerateQuestionsPanel,
  GeneratingQuestionsStatus,
} from "./generate-panel";
import { fieldsFromBrief, type ReviewQuestionFields } from "./review-model";
import { ReviewQuestionsForm } from "./review-form";

function toReviewQuestion(row: PlannedQuestion): ReviewQuestionFields {
  const brief = parseInterviewerBrief(row.brief);
  return fieldsFromBrief(
    row.prompt,
    row.primaryDimension,
    row.importance ?? "",
    row.competency ?? "",
    brief,
  );
}

export default async function QuestionsPage({
  params,
}: {
  params: Promise<{ opportunityId: string }>;
}): Promise<React.JSX.Element> {
  const { opportunityId } = await params;
  const prep = await getOpportunityQuestionPrep(opportunityId);
  if (prep === null) {
    notFound();
  }
  const questions = await listPlannedQuestions(opportunityId);
  const showGenerate = prep.status === "idle" && questions.length === 0;
  const showReview = prep.status !== "generating";

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
          {questions.length > 0
            ? QUESTIONS_PAGE.title
            : QUESTIONS_PAGE.generateTitle}
        </h1>
        {questions.length > 0 ? (
          <Link
            href={practicePath({
              id: opportunityId,
              practiceSessionId: prep.practiceSessionId ?? undefined,
            })}
            data-testid="open-practice-link"
            className="text-xs font-bold uppercase tracking-[0.96px] text-black underline"
          >
            {QUESTIONS_PAGE.openPractice}
          </Link>
        ) : null}
        {prep.status === "generating" ? <GeneratingQuestionsStatus /> : null}
        {showGenerate ? (
          <GenerateQuestionsPanel opportunityId={opportunityId} />
        ) : null}
        {showReview ? (
          <ReviewQuestionsForm
            opportunityId={opportunityId}
            initialQuestions={questions.map(toReviewQuestion)}
            targetMinutes={prep.targetMinutes}
            sessionAnswerBudget={prep.sessionAnswerBudget}
          />
        ) : null}
      </main>
    </div>
  );
}
