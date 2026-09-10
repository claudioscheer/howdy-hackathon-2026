import { QUESTIONS_PAGE } from "@/lib/ui/copy";
import type { ReviewQuestionFields } from "./review-model";

const FIELD_CLASS =
  "rounded border border-[#e0e0e8] bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-black focus:border-black focus:outline-none";

type BriefFieldName = Extract<
  keyof ReviewQuestionFields,
  | "roleRelevance"
  | "expectedDepth"
  | "evidenceToListenFor"
  | "followUpTriggers"
  | "timeBudgetMinutes"
  | "answerBudget"
  | "maxFollowUps"
  | "stopWhen"
>;

const BRIEF_FIELDS: Array<{
  name: BriefFieldName;
  testId: string;
  label: string;
  area: boolean;
}> = [
  {
    name: "roleRelevance",
    testId: "question-role-relevance",
    label: QUESTIONS_PAGE.roleRelevanceLabel,
    area: true,
  },
  {
    name: "expectedDepth",
    testId: "question-expected-depth",
    label: QUESTIONS_PAGE.expectedDepthLabel,
    area: true,
  },
  {
    name: "evidenceToListenFor",
    testId: "question-evidence",
    label: QUESTIONS_PAGE.evidenceLabel,
    area: true,
  },
  {
    name: "followUpTriggers",
    testId: "question-triggers",
    label: QUESTIONS_PAGE.triggersLabel,
    area: true,
  },
  {
    name: "timeBudgetMinutes",
    testId: "question-time-budget",
    label: QUESTIONS_PAGE.timeBudgetLabel,
    area: false,
  },
  {
    name: "answerBudget",
    testId: "question-answer-budget",
    label: QUESTIONS_PAGE.answerBudgetLabel,
    area: false,
  },
  {
    name: "maxFollowUps",
    testId: "question-max-follow-ups",
    label: QUESTIONS_PAGE.maxFollowUpsLabel,
    area: false,
  },
  {
    name: "stopWhen",
    testId: "question-stop-when",
    label: QUESTIONS_PAGE.stopWhenLabel,
    area: true,
  },
];

function BriefControl({
  field,
  suffix,
  value,
  onChange,
}: {
  field: (typeof BRIEF_FIELDS)[number];
  suffix: string;
  value: string;
  onChange: (value: string) => void;
}): React.JSX.Element {
  const control = field.area ? (
    <textarea
      name={field.name}
      data-testid={`${field.testId}-${suffix}`}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      rows={3}
      className={FIELD_CLASS}
    />
  ) : (
    <input
      name={field.name}
      data-testid={`${field.testId}-${suffix}`}
      value={value}
      onChange={(event) => {
        onChange(event.target.value);
      }}
      className={FIELD_CLASS}
    />
  );
  return (
    <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f]">
      {field.label}
      {control}
    </label>
  );
}

export function BriefFields({
  index,
  question,
  onChange,
}: {
  index: number;
  question: ReviewQuestionFields;
  onChange: (question: ReviewQuestionFields) => void;
}): React.JSX.Element {
  const suffix = String(index);
  return (
    <div
      className="flex flex-col gap-3"
      data-testid={`question-brief-${suffix}`}
    >
      <p className="text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f]">
        {QUESTIONS_PAGE.briefSection}
      </p>
      {BRIEF_FIELDS.map((field) => (
        <BriefControl
          key={field.name}
          field={field}
          suffix={suffix}
          value={question[field.name]}
          onChange={(value) => {
            onChange({ ...question, [field.name]: value });
          }}
        />
      ))}
    </div>
  );
}
