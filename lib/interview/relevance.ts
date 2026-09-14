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
  questionId?: string;
};

function words(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 0);
}

export function contentTokens(text: string): Set<string> {
  return new Set(
    words(text).filter((token) => token.length > 3 && !SKIP_TOKENS.has(token)),
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

// Follow-up prompts are judged against the original prompt of the same topic
// only; earlier questions must not leak their vocabulary into later ones.
function topicPromptText(prompt: string, context: RelevanceContext): string {
  const questionTurns = (context.history ?? []).filter(
    (turn) => turn.speaker === "interviewer" && turn.kind === "question",
  );
  const topicId = context.questionId ?? questionTurns.at(-1)?.questionId;
  return [
    prompt,
    ...questionTurns
      .filter((turn) => turn.questionId === topicId)
      .map((turn) => turn.content),
  ].join(" ");
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
  const topicText = topicPromptText(prompt, context);
  const questionTokens = contentTokens(topicText);
  const assessmentTokens = briefTokens(context.brief);
  // Topic cues such as "api" are shorter than content tokens, so cue matching
  // reads every word while the shared-token fallback keeps content tokens.
  const families = matchingTopicFamilies(new Set(words(topicText)));

  if (families.length > 0) {
    const answerWords = new Set(words(answer));
    return families.some((family) => sharesAny(answerWords, family.answerCues));
  }
  if (assessmentTokens.size > 0) {
    return sharesAny(answerTokens, assessmentTokens);
  }
  if (questionTokens.size === 0) {
    return true;
  }
  return sharedCount(answerTokens, questionTokens) >= 2;
}
