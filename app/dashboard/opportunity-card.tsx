import Link from "next/link";
import { SEEDED_SESSION_ID } from "@/lib/interview/seed";

export interface OpportunityItem {
  id: string;
  role: string;
  track: string;
  attemptsLimit: number;
  attemptsUsed: number;
  status: "Active" | "Expired" | "Draft";
  token: string;
  practiceSessionId?: string;
}

export const OPPORTUNITIES: OpportunityItem[] = [
  {
    id: "opp-1",
    role: "Senior Distributed Systems Engineer",
    track: "Architecture & Incident Response",
    attemptsLimit: 2,
    attemptsUsed: 2,
    status: "Expired",
    token: "sys-9f82a",
  },
  {
    id: "opp-2",
    role: "Fullstack Product Engineer",
    track: "React, Node.js & API Design",
    attemptsLimit: 2,
    attemptsUsed: 0,
    status: "Active",
    token: "fs-3b17c",
    practiceSessionId: SEEDED_SESSION_ID,
  },
  {
    id: "opp-3",
    role: "Staff Infrastructure Engineer",
    track: "Kubernetes & High Availability",
    attemptsLimit: 2,
    attemptsUsed: 1,
    status: "Active",
    token: "infra-48d0e",
  },
];

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
  const practiceHref = item.practiceSessionId
    ? `/practice/${item.practiceSessionId}`
    : undefined;
  return (
    <div
      data-testid={`opportunity-card-${item.id}`}
      className="flex flex-col justify-between gap-4 rounded border border-[#e0e0e8] bg-white p-5 md:flex-row md:items-center"
    >
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-black uppercase tracking-tight">
            {item.role}
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
        <p className="text-sm text-[#5a5a5f]">{item.track}</p>
        <div className="mt-1 flex items-center gap-3 text-xs text-[#5a5a5f]">
          <span>
            Attempts: {item.attemptsUsed} / {item.attemptsLimit} used
          </span>
          <span>•</span>
          <span className="font-mono text-[11px] text-black">
            {practiceHref ?? `Seed: ${item.token}`}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {practiceHref ? (
          <Link
            href={practiceHref}
            data-testid={`action-link-${item.id}`}
            className="inline-flex cursor-pointer items-center justify-center rounded-full border border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white"
          >
            Open Practice Interview
          </Link>
        ) : (
          <button
            type="button"
            data-testid={`action-link-${item.id}`}
            disabled
            className="inline-flex cursor-not-allowed items-center justify-center rounded-full border border-[#e0e0e8] px-4 py-2 text-xs font-bold uppercase tracking-wider text-[#5a5a5f] opacity-50"
          >
            {isExpired ? "Link Expired" : "Practice Unavailable"}
          </button>
        )}
      </div>
    </div>
  );
}
