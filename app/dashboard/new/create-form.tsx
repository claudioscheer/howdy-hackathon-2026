"use client";

import { useActionState } from "react";
import { CREATE_OPPORTUNITY_PAGE } from "@/lib/ui/copy";
import {
  INITIAL_CREATE_OPPORTUNITY_STATE,
  type CreateOpportunityInput,
  type CreateOpportunityState,
} from "@/lib/db/opportunity-input";
import { ROLE_OPTIONS, SENIORITY_OPTIONS } from "@/lib/db/opportunity-options";
import { createOpportunityAction } from "../actions";
import {
  FieldError,
  InterviewTypeField,
  SelectField,
  TextAreaField,
  TextField,
} from "./create-fields";

function OpportunityFormFields({
  errors,
  defaults,
}: {
  errors: CreateOpportunityState["errors"];
  defaults?: CreateOpportunityInput;
}): React.JSX.Element {
  return (
    <>
      <TextField
        id="candidateDisplayName"
        label={CREATE_OPPORTUNITY_PAGE.candidateLabel}
        required
        defaultValue={defaults?.candidateDisplayName}
      />
      <FieldError errors={errors} field="candidateDisplayName" />
      <SelectField
        id="role"
        label={CREATE_OPPORTUNITY_PAGE.roleLabel}
        hint={CREATE_OPPORTUNITY_PAGE.roleHint}
        defaultValue={defaults?.role ?? "fullstack"}
        options={ROLE_OPTIONS}
        required
      />
      <FieldError errors={errors} field="role" />
      <SelectField
        id="seniority"
        label={CREATE_OPPORTUNITY_PAGE.seniorityLabel}
        defaultValue={defaults?.seniority ?? "senior"}
        options={SENIORITY_OPTIONS}
        required
      />
      <FieldError errors={errors} field="seniority" />
      <TextField
        id="targetTechStack"
        label={CREATE_OPPORTUNITY_PAGE.techStackLabel}
        hint={CREATE_OPPORTUNITY_PAGE.techStackHint}
        defaultValue={defaults?.targetTechStack.join(", ")}
      />
      <FieldError errors={errors} field="targetTechStack" />
      <InterviewTypeField defaultValue={defaults?.interviewType} />
      <FieldError errors={errors} field="interviewType" />
      <TextAreaField
        id="jobDescription"
        label={CREATE_OPPORTUNITY_PAGE.jobDescriptionLabel}
        hint={CREATE_OPPORTUNITY_PAGE.jobDescriptionHint}
        required
        defaultValue={defaults?.jobDescription}
      />
      <FieldError errors={errors} field="jobDescription" />
      <TextAreaField
        id="curriculum"
        label={CREATE_OPPORTUNITY_PAGE.curriculumLabel}
        hint={CREATE_OPPORTUNITY_PAGE.curriculumHint}
        required
        defaultValue={defaults?.curriculum}
      />
      <FieldError errors={errors} field="curriculum" />
      <FieldError errors={errors} field="form" />
    </>
  );
}

export function CreateOpportunityForm({
  action = createOpportunityAction,
  defaults,
  opportunityId,
  submitLabel = CREATE_OPPORTUNITY_PAGE.submitButton,
}: {
  action?: (
    prev: CreateOpportunityState,
    formData: FormData,
  ) => Promise<CreateOpportunityState>;
  defaults?: CreateOpportunityInput;
  opportunityId?: string;
  submitLabel?: string;
}): React.JSX.Element {
  const [state, formAction, pending] = useActionState(
    action,
    INITIAL_CREATE_OPPORTUNITY_STATE,
  );

  return (
    <form
      data-testid="create-opportunity-form"
      action={formAction}
      className="flex w-full max-w-xl flex-col gap-6"
    >
      {opportunityId ? (
        <input type="hidden" name="opportunityId" value={opportunityId} />
      ) : null}
      <OpportunityFormFields errors={state.errors} defaults={defaults} />
      <button
        type="submit"
        data-testid="create-opportunity-submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-full border border-black bg-white px-6 py-[14px] text-[13px] font-bold uppercase leading-[0.94] tracking-[1.17px] text-black transition-colors hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {pending ? CREATE_OPPORTUNITY_PAGE.pendingButton : submitLabel}
      </button>
    </form>
  );
}
