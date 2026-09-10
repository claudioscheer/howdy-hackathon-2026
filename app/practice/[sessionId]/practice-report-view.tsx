import type { ReportDimension, SessionReport } from "@/lib/interview/contracts";
import { PRACTICE_PAGE } from "@/lib/ui/copy";

const DIMENSION_LABELS = {
  relevance: "Relevance",
  specificity: "Specificity under follow-up",
  fundamentals: "Fundamentals",
  structure: "Communication structure",
} as const;

function dimensionText(dimension: ReportDimension): string {
  if (dimension.status === "scored") {
    return `${dimension.score} / 5 — ${dimension.summary}`;
  }
  return `Insufficient evidence — ${dimension.summary}`;
}

export function PracticeReportView({
  report,
}: {
  report: SessionReport;
}): React.JSX.Element {
  function exportReport(): void {
    const blob = new Blob([JSON.stringify(report, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `practice-scorecard-attempt-${report.attemptNumber}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="mt-6" data-testid="practice-report">
      <h2 className="text-xl font-bold uppercase tracking-tight">
        {PRACTICE_PAGE.reportTitle}
      </h2>
      <p className="mt-3 text-sm leading-6">{report.summary}</p>
      <ul className="mt-4 flex flex-col gap-3">
        {(
          Object.keys(DIMENSION_LABELS) as Array<keyof typeof DIMENSION_LABELS>
        ).map((key) => {
          const dimension = report.dimensions[key];
          return (
            <li
              key={key}
              className="rounded border border-[#e0e0e8] p-4"
              data-testid={`report-dimension-${key}`}
            >
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5a5a5f]">
                {DIMENSION_LABELS[key]}
              </p>
              <p className="mt-2 text-sm leading-6">
                {dimensionText(dimension)}
              </p>
              {dimension.remainingUnknown ? (
                <p className="mt-2 text-sm text-[#5a5a5f]">
                  {dimension.remainingUnknown}
                </p>
              ) : null}
              {dimension.evidence.map((item) => (
                <blockquote
                  key={`${item.questionId}-${item.quote}`}
                  className="mt-2 border-l-2 border-black pl-3 text-sm leading-6"
                >
                  “{item.quote}”
                </blockquote>
              ))}
            </li>
          );
        })}
      </ul>
      <button
        type="button"
        data-testid="export-report-button"
        onClick={exportReport}
        className="mt-5 inline-flex cursor-pointer rounded-full border border-black px-6 py-3 text-xs font-bold uppercase tracking-wider"
      >
        {PRACTICE_PAGE.reportExport}
      </button>
    </section>
  );
}
