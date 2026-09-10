"use client";

import Link from "next/link";
import { useState } from "react";
import type { OpportunityItem } from "@/lib/db/opportunity-item";
import { practicePath } from "@/lib/db/opportunity-item";
import { MAX_SESSION_ATTEMPTS } from "@/lib/interview/session";
import { DASHBOARD_PAGE } from "@/lib/ui/copy";

const ACTION_CLASS =
  "inline-flex cursor-pointer items-center justify-center rounded-full border border-black bg-white px-4 py-2 text-xs font-bold uppercase tracking-wider text-black transition-colors hover:bg-black hover:text-white";

function questionsLabel(item: OpportunityItem): string {
  if (item.questionPrepStatus === "generating") {
    return DASHBOARD_PAGE.preparingQuestionsButton;
  }
  if (item.questionCount > 0 || item.questionPrepStatus === "ready") {
    return DASHBOARD_PAGE.reviewQuestionsButton;
  }
  return DASHBOARD_PAGE.generateQuestionsButton;
}

export function canOpenPractice(item: OpportunityItem): boolean {
  return (
    item.status === "Active" &&
    item.questionPrepStatus === "ready" &&
    item.questionCount > 0 &&
    item.attemptsUsed < MAX_SESSION_ATTEMPTS
  );
}

export function CopyPracticeLinkButton({
  item,
}: {
  item: OpportunityItem;
}): React.JSX.Element {
  const [copied, setCopied] = useState(false);

  async function copyLink(): Promise<void> {
    const url = `${window.location.origin}${practicePath(item)}`;
    await navigator.clipboard.writeText(url);
    setCopied(true);
  }

  return (
    <button
      type="button"
      data-testid={`copy-link-${item.id}`}
      onClick={() => {
        void copyLink();
      }}
      className={ACTION_CLASS}
    >
      {copied ? DASHBOARD_PAGE.copiedLinkButton : DASHBOARD_PAGE.copyLinkButton}
    </button>
  );
}

export function OpportunityActions({
  item,
}: {
  item: OpportunityItem;
}): React.JSX.Element {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/dashboard/${item.id}/edit`}
        data-testid={`edit-opportunity-${item.id}`}
        className={ACTION_CLASS}
      >
        {DASHBOARD_PAGE.editButton}
      </Link>
      {canOpenPractice(item) ? (
        <>
          <CopyPracticeLinkButton item={item} />
          <Link
            href={practicePath(item)}
            data-testid={`open-practice-${item.id}`}
            className={ACTION_CLASS}
          >
            Open practice
          </Link>
        </>
      ) : null}
      <Link
        href={`/dashboard/${item.id}/questions`}
        data-testid={`questions-opportunity-${item.id}`}
        className={ACTION_CLASS}
      >
        {questionsLabel(item)}
      </Link>
    </div>
  );
}
