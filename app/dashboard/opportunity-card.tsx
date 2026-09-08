import type { OpportunityItem } from "@/lib/db/opportunity-item";
import { opportunityHeading } from "@/lib/db/opportunity-options";
import { CREATE_OPPORTUNITY_PAGE } from "@/lib/ui/copy";
import { OpportunityActions } from "./opportunity-actions";

export type { OpportunityItem };

export function StatCard({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId: string;
}): React.JSX.Element {
  return (
    <div
      data-testid={testId}
      className="flex flex-col gap-1 rounded border border-[#e0e0e8] bg-white p-5"
    >
      <span className="text-xs font-bold uppercase tracking-[0.96px] text-[#5a5a5f]">
        {label}
      </span>
      <span className="text-2xl font-bold uppercase tracking-tight text-black">
        {value}
      </span>
    </div>
  );
}

export function OpportunityCard({
  item,
}: {
  item: OpportunityItem;
}): React.JSX.Element {
  const isExpired = item.status === "Expired";
  return (
    <div
      data-testid={`opportunity-card-${item.id}`}
      className="flex flex-col justify-between gap-4 rounded border border-[#e0e0e8] bg-white p-5 md:flex-row md:items-center"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-black uppercase tracking-tight">
            {opportunityHeading(item.role, item.seniority)}
          </h3>
          <span
            data-testid={`status-badge-${item.id}`}
            className={`rounded px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider ${
              isExpired ? "bg-[#e0e0e8] text-[#5a5a5f]" : "bg-black text-white"
            }`}
          >
            {item.status}
          </span>
        </div>
        {item.track ? (
          <p className="text-sm text-[#5a5a5f]">{item.track}</p>
        ) : null}
        {item.candidateName ? (
          <p
            data-testid={`candidate-name-${item.id}`}
            className="text-sm text-[#5a5a5f]"
          >
            Candidate: {item.candidateName}
          </p>
        ) : null}
        {item.hasBriefing ? (
          <p
            data-testid={`briefing-${item.id}`}
            className="text-sm text-[#5a5a5f]"
          >
            {CREATE_OPPORTUNITY_PAGE.briefingOnFile}
          </p>
        ) : null}
        <div className="mt-1 flex items-center gap-3 text-xs text-[#5a5a5f]">
          <span>
            Attempts: {item.attemptsUsed} / {item.attemptsLimit} used
          </span>
        </div>
      </div>

      <OpportunityActions item={item} />
    </div>
  );
}
