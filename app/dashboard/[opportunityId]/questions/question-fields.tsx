import {
  QuestionImportanceSchema,
  type QuestionImportance,
} from "@/lib/interview/brief";
import { QUESTIONS_PAGE } from "@/lib/ui/copy";
import { BriefFields } from "./brief-fields";
import {
  emptyReviewQuestion,
  questionLegend,
  type ReviewQuestionFields,
} from "./review-model";

export { emptyReviewQuestion, questionLegend, type ReviewQuestionFields };
export type { QuestionImportance };

const FIELD_CLASS =
  "rounded border border-[#e0e0e8] bg-white px-4 py-3 text-base font-normal normal-case tracking-normal text-black focus:border-black focus:outline-none";

export function QuestionFields({
  index,
  total,
  question,
  onChange,
}: {
  index: number;
  total: number;
  question: ReviewQuestionFields;
  onChange: (question: ReviewQuestionFields) => void;
}): React.JSX.Element {
  const suffix = String(index);
  return (
    <fieldset
      data-testid={`question-fields-${suffix}`}
      className="flex flex-col gap-3 rounded border border-[#e0e0e8] p-4"
    >
      <legend
        data-testid={`question-legend-${suffix}`}
        className="px-1 text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f]"
      >
        {questionLegend(index, total, question)}
      </legend>
      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f]">
        {QUESTIONS_PAGE.competencyLabel}
        <input
          name="competency"
          data-testid={`question-competency-${suffix}`}
          value={question.competency}
          onChange={(event) => {
            onChange({ ...question, competency: event.target.value });
          }}
          className={FIELD_CLASS}
        />
      </label>
      <label className="flex flex-col gap-1 text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f]">
        {QUESTIONS_PAGE.importanceLabel}
        <select
          name="importance"
          data-testid={`question-importance-${suffix}`}
          value={question.importance}
          onChange={(event) => {
            const parsed = QuestionImportanceSchema.safeParse(
              event.target.value,
            );
            onChange({
              ...question,
              importance: parsed.success ? parsed.data : "",
            });
          }}
          className={FIELD_CLASS}
        >
          <option value="">{QUESTIONS_PAGE.importanceUnset}</option>
          <option value="core">{QUESTIONS_PAGE.importanceCore}</option>
          <option value="supporting">
            {QUESTIONS_PAGE.importanceSupporting}
          </option>
          <option value="optional">{QUESTIONS_PAGE.importanceOptional}</option>
        </select>
      </label>
      <textarea
        name="prompt"
        data-testid={`question-prompt-${suffix}`}
        value={question.prompt}
        onChange={(event) => {
          onChange({ ...question, prompt: event.target.value });
        }}
        rows={4}
        className={FIELD_CLASS}
      />
      <input
        type="hidden"
        name="primaryDimension"
        value={question.primaryDimension}
      />
      <BriefFields index={index} question={question} onChange={onChange} />
    </fieldset>
  );
}
