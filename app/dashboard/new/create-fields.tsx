import { CREATE_OPPORTUNITY_PAGE } from "@/lib/ui/copy";
import type { FieldErrorMap } from "@/lib/db/opportunity-input";
import { INTERVIEW_TYPE_OPTIONS } from "@/lib/db/opportunity-options";

export function FieldError({
  errors,
  field,
}: {
  errors: FieldErrorMap;
  field: keyof FieldErrorMap;
}): React.JSX.Element | null {
  const message = errors[field];
  if (!message) {
    return null;
  }
  return (
    <p data-testid={`field-error-${field}`} className="text-xs text-black">
      {message}
    </p>
  );
}

function FieldLabel({
  id,
  label,
  required,
}: {
  id: string;
  label: string;
  required?: boolean;
}): React.JSX.Element {
  return (
    <label
      htmlFor={id}
      className="text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f]"
    >
      {label}
      {required ? (
        <span data-testid={`${id}-required`} className="ml-1 text-black">
          *
        </span>
      ) : null}
    </label>
  );
}

export function TextField({
  id,
  label,
  hint,
  required,
  defaultValue,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel id={id} label={label} required={required} />
      <input
        id={id}
        name={id}
        data-testid={`${id}-input`}
        type="text"
        required={required}
        aria-required={required}
        defaultValue={defaultValue}
        className="rounded border border-[#e0e0e8] bg-white px-4 py-3 text-base text-black transition-colors focus:border-black focus:outline-none"
      />
      {hint ? <p className="text-xs text-[#5a5a5f]">{hint}</p> : null}
    </div>
  );
}

export function TextAreaField({
  id,
  label,
  hint,
  required,
  defaultValue,
}: {
  id: string;
  label: string;
  hint?: string;
  required?: boolean;
  defaultValue?: string;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel id={id} label={label} required={required} />
      <textarea
        id={id}
        name={id}
        data-testid={`${id}-input`}
        rows={8}
        required={required}
        aria-required={required}
        defaultValue={defaultValue}
        className="min-h-40 rounded border border-[#e0e0e8] bg-white px-4 py-3 text-base text-black transition-colors focus:border-black focus:outline-none"
      />
      {hint ? <p className="text-xs text-[#5a5a5f]">{hint}</p> : null}
    </div>
  );
}

function SelectChevron({ id }: { id: string }): React.JSX.Element {
  return (
    <span
      data-testid={`${id}-chevron`}
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-black"
    >
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <path
          d="M2.25 4.25 6 8l3.75-3.75"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="square"
        />
      </svg>
    </span>
  );
}

export function SelectField({
  id,
  label,
  defaultValue,
  options,
  hint,
  required,
}: {
  id: string;
  label: string;
  defaultValue: string;
  options: readonly { value: string; label: string }[];
  hint?: string;
  required?: boolean;
}): React.JSX.Element {
  return (
    <div className="flex flex-col gap-2">
      <FieldLabel id={id} label={label} required={required} />
      <div className="relative">
        <select
          id={id}
          name={id}
          data-testid={`${id}-input`}
          defaultValue={defaultValue}
          required={required}
          aria-required={required}
          className="w-full appearance-none rounded border border-[#e0e0e8] bg-white py-3 pr-10 pl-4 text-base text-black transition-colors focus:border-black focus:outline-none"
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <SelectChevron id={id} />
      </div>
      {hint ? <p className="text-xs text-[#5a5a5f]">{hint}</p> : null}
    </div>
  );
}

export function InterviewTypeField({
  defaultValue = "behavioral",
}: {
  defaultValue?: string;
}): React.JSX.Element {
  return (
    <SelectField
      id="interviewType"
      label={CREATE_OPPORTUNITY_PAGE.interviewTypeLabel}
      defaultValue={defaultValue}
      options={INTERVIEW_TYPE_OPTIONS}
      required
    />
  );
}
