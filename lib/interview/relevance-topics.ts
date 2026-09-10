const CONFLICT_ANSWER_CUES = [
  "alternative",
  "alternatives",
  "compromise",
  "conflict",
  "debate",
  "debated",
  "disagree",
  "disagreed",
  "disagreement",
  "objected",
  "opposed",
  "proposed",
  "pushback",
  "rewrite",
  "tension",
  "tradeoff",
  "tradeoffs",
];

const API_ANSWER_CUES = [
  "api",
  "contract",
  "endpoint",
  "graphql",
  "idempotent",
  "interface",
  "payload",
  "protobuf",
  "schema",
  "versioning",
];

const DELIVERY_ANSWER_CUES = [
  "canary",
  "delivery",
  "flag",
  "migration",
  "release",
  "risk",
  "rollback",
  "rollout",
  "shipped",
  "shipping",
  "staged",
];

export type TopicFamily = {
  id: string;
  questionCues: readonly string[];
  answerCues: readonly string[];
};

export const TOPIC_FAMILIES: readonly TopicFamily[] = [
  {
    id: "conflict",
    questionCues: [
      "conflict",
      "debate",
      "disagree",
      "disagreement",
      "pushback",
    ],
    answerCues: CONFLICT_ANSWER_CUES,
  },
  {
    id: "api-design",
    questionCues: ["api", "contract", "endpoint", "interface"],
    answerCues: API_ANSWER_CUES,
  },
  {
    id: "delivery-risk",
    questionCues: ["delivery", "release", "risk", "rollout", "shipping"],
    answerCues: DELIVERY_ANSWER_CUES,
  },
];

export function matchingTopicFamilies(
  questionTokens: Set<string>,
): TopicFamily[] {
  return TOPIC_FAMILIES.filter((family) =>
    family.questionCues.some((cue) => questionTokens.has(cue)),
  );
}
