import type { InterviewerBrief } from "./brief";
import type { TranscriptTurn } from "./contracts";
import { matchingTopicFamilies } from "./relevance-topics";

const SKIP_TOKENS = new Set([
  "about",
  "also",
  "been",
  "describe",
  "example",
  "from",
  "give",
  "have",
  "into",
  "just",
  "like",
  "made",
  "make",
  "more",
  "only",
  "over",
  "situation",
  "some",
  "such",
  "talk",
  "tell",
  "than",
  "that",
  "them",
  "then",
  "they",
  "this",
  "through",
  "time",
  "used",
  "using",
  "walk",
  "were",
  "what",
  "when",
  "with",
  "work",
  "worked",
  "working",
  "your",
]);

export type RelevanceContext = {
  brief?: InterviewerBrief;
  history?: TranscriptTurn[];
};

export function contentTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((token) => token.length > 3 && !SKIP_TOKENS.has(token)),
  );
}

function briefTokens(brief: InterviewerBrief | undefined): Set<string> {
  if (brief === undefined) {
    return new Set();
  }
  return contentTokens(
    [
      brief.competency,
      brief.roleRelevance,
      brief.expectedDepth,
      ...brief.evidenceToListenFor,
      ...brief.followUpTriggers,
    ].join(" "),
  );
}

function originalPromptTokens(
  prompt: string,
  history: TranscriptTurn[] | undefined,
): Set<string> {
  const tokens = contentTokens(prompt);
  if (history === undefined) {
    return tokens;
  }
  for (const turn of history) {
    if (turn.speaker === "interviewer" && turn.kind === "question") {
      for (const token of contentTokens(turn.content)) {
        tokens.add(token);
      }
    }
  }
  return tokens;
}

function sharesAny(left: Set<string>, right: Iterable<string>): boolean {
  for (const token of right) {
    if (left.has(token)) {
      return true;
    }
  }
  return false;
}

function sharedCount(left: Set<string>, right: Set<string>): number {
  let count = 0;
  for (const token of right) {
    if (left.has(token)) {
      count += 1;
    }
  }
  return count;
}

export function answersQuestion(
  prompt: string,
  answer: string,
  context: RelevanceContext = {},
): boolean {
  const answerTokens = contentTokens(answer);
  const questionTokens = originalPromptTokens(prompt, context.history);
  const assessmentTokens = briefTokens(context.brief);
  const families = matchingTopicFamilies(questionTokens);

  if (families.length > 0) {
    return families.some((family) =>
      sharesAny(answerTokens, family.answerCues),
    );
  }
  if (assessmentTokens.size > 0) {
    return sharesAny(answerTokens, assessmentTokens);
  }
  if (questionTokens.size === 0) {
    return true;
  }
  return sharedCount(answerTokens, questionTokens) >= 2;
}
