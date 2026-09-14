import { PRACTICE_PAGE } from "@/lib/ui/copy";

export function PracticeEndDialog({
  isSubmitting,
  onCancel,
  onConfirm,
}: {
  isSubmitting: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}): React.JSX.Element {
  return (
    <div
      className="fixed inset-0 z-10 flex items-center justify-center bg-black/40 px-4"
      data-testid="end-interview-dialog"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="end-interview-title"
        className="w-full max-w-md rounded border border-[#e0e0e8] bg-white p-6"
      >
        <h2 id="end-interview-title" className="text-lg font-bold">
          {PRACTICE_PAGE.endConfirmTitle}
        </h2>
        <p className="mt-3 text-sm leading-6 text-[#5a5a5f]">
          {PRACTICE_PAGE.endConfirmBody}
        </p>
        <div className="mt-5 flex flex-wrap justify-end gap-3">
          <button
            type="button"
            data-testid="end-interview-cancel"
            onClick={onCancel}
            className="cursor-pointer rounded-full border border-black px-5 py-2 text-xs font-bold uppercase tracking-wider"
          >
            {PRACTICE_PAGE.endCancel}
          </button>
          <button
            type="button"
            data-testid="end-interview-confirm"
            onClick={onConfirm}
            disabled={isSubmitting}
            className="cursor-pointer rounded-full bg-black px-5 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:cursor-wait disabled:opacity-60"
          >
            {PRACTICE_PAGE.endConfirm}
          </button>
        </div>
      </div>
    </div>
  );
}
