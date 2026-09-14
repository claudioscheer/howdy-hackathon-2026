"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { OpportunityItem } from "@/lib/db/opportunity-item";
import { practicePath } from "@/lib/db/opportunity-item";
import { DASHBOARD_PAGE } from "@/lib/ui/copy";
import { canOpenPractice } from "./practice-eligibility";

const COPY_RESET_MS = 2000;

type CopyState = "idle" | "copied" | "failed";

const COPY_LABELS: Record<CopyState, string> = {
  idle: DASHBOARD_PAGE.copyLinkButton,
  copied: DASHBOARD_PAGE.copiedLinkButton,
  failed: DASHBOARD_PAGE.copyFailedButton,
};

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

async function writeToClipboard(text: string): Promise<CopyState> {
  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

export function CopyPracticeLinkButton({
  item,
}: {
  item: OpportunityItem;
}): React.JSX.Element {
  const [copyState, setCopyState] = useState<CopyState>("idle");
  const resetTimer = useRef<number | undefined>(undefined);

  useEffect(() => {
    const timer = resetTimer;
    return () => window.clearTimeout(timer.current);
  }, []);

  async function copyLink(): Promise<void> {
    const url = `${window.location.origin}${practicePath(item)}`;
    setCopyState(await writeToClipboard(url));
    window.clearTimeout(resetTimer.current);
    resetTimer.current = window.setTimeout(() => {
      setCopyState("idle");
    }, COPY_RESET_MS);
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
      {COPY_LABELS[copyState]}
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
