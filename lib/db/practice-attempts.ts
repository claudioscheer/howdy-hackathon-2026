import { z } from "zod";
import {
  QuestionOutcomeSchema,
  SessionReportSchema,
  UsedQuestionSchema,
  type SessionReport,
} from "@/lib/interview/contracts";
import type { SessionState } from "@/lib/interview/session";
import { getPrisma } from "./prisma";

const StoredDimensionSchema = z.object({
  status: z.enum(["scored", "insufficient_evidence"]),
  score: z.number().int().min(1).max(5).optional(),
  summary: z.string().min(1),
  remainingUnknown: z.string().min(1).optional(),
});

const StoredDimensionsSchema = z.object({
  relevance: StoredDimensionSchema,
  specificity: StoredDimensionSchema,
  fundamentals: StoredDimensionSchema,
  structure: StoredDimensionSchema,
});

function persistableDimensions(
  report: SessionReport,
): z.infer<typeof StoredDimensionsSchema> {
  return StoredDimensionsSchema.parse({
    relevance: stripEvidence(report.dimensions.relevance),
    specificity: stripEvidence(report.dimensions.specificity),
    fundamentals: stripEvidence(report.dimensions.fundamentals),
    structure: stripEvidence(report.dimensions.structure),
  });
}

function stripEvidence(
  dimension: SessionReport["dimensions"]["relevance"],
): z.infer<typeof StoredDimensionSchema> {
  if (dimension.status === "scored") {
    return {
      status: "scored",
      score: dimension.score,
      summary: dimension.summary,
      remainingUnknown: dimension.remainingUnknown,
    };
  }
  return {
    status: "insufficient_evidence",
    summary: dimension.summary,
    remainingUnknown: dimension.remainingUnknown,
  };
}

export function reportFromStored(input: {
  attemptNumber: number;
  summary: string;
  dimensions: unknown;
}): SessionReport | null {
  const dimensions = StoredDimensionsSchema.safeParse(input.dimensions);
  if (!dimensions.success) {
    return null;
  }
  const restored = {
    attemptNumber: input.attemptNumber,
    summary: input.summary,
    dimensions: {
      relevance: { ...dimensions.data.relevance, evidence: [] },
      specificity: { ...dimensions.data.specificity, evidence: [] },
      fundamentals: { ...dimensions.data.fundamentals, evidence: [] },
      structure: { ...dimensions.data.structure, evidence: [] },
    },
  };
  const parsed = SessionReportSchema.safeParse(restored);
  return parsed.success ? parsed.data : null;
}

export async function savePracticeAttempt(
  state: SessionState,
  elapsedSeconds: number,
): Promise<void> {
  const report = state.report;
  if (report === undefined || state.status !== "COMPLETE") {
    return;
  }
  const outcomes = z.array(QuestionOutcomeSchema).parse(state.questionOutcomes);
  const used = z.array(UsedQuestionSchema).parse(state.usedQuestions);
  const prisma = getPrisma();
  const existing = await prisma.interviewAttempt.findUnique({
    where: {
      opportunityId_attemptNumber: {
        opportunityId: state.opportunity.id,
        attemptNumber: state.attemptNumber,
      },
    },
  });
  if (existing !== null) {
    return;
  }
  await prisma.$transaction([
    prisma.interviewAttempt.create({
      data: {
        id: `${state.opportunity.id}-attempt-${state.attemptNumber}`,
        opportunityId: state.opportunity.id,
        attemptNumber: state.attemptNumber,
        elapsedSeconds: Math.max(0, elapsedSeconds),
        summary: report.summary,
        dimensions: persistableDimensions(report),
        questionOutcomes: outcomes,
        usedQuestions: used,
      },
    }),
    prisma.opportunity.update({
      where: { id: state.opportunity.id },
      data: { attemptsUsed: { increment: 1 } },
    }),
  ]);
}

export async function loadLatestAttempt(opportunityId: string): Promise<{
  attemptNumber: number;
  summary: string;
  dimensions: unknown;
} | null> {
  const row = await getPrisma().interviewAttempt.findFirst({
    where: { opportunityId },
    orderBy: { attemptNumber: "desc" },
  });
  if (row === null) {
    return null;
  }
  return {
    attemptNumber: row.attemptNumber,
    summary: row.summary,
    dimensions: row.dimensions,
  };
}
