import { LOGIN_PAGE } from "./copy";

const SOUNDWAVE_HEIGHTS = [
  "h-6",
  "h-12",
  "h-20",
  "h-16",
  "h-28",
  "h-14",
  "h-24",
  "h-8",
  "h-20",
  "h-10",
  "h-16",
  "h-6",
] as const;

const TELEMETRY_DIMENSIONS = [
  { label: "RELEVANCE", status: "GROUNDED" },
  { label: "SPECIFICITY", status: "PROBING" },
  { label: "STRUCTURE", status: "STAR EVAL" },
  { label: "FUNDAMENTALS", status: "LOCKED" },
] as const;

function SoundwaveVisualizer(): React.JSX.Element {
  return (
    <div
      data-testid="soundwave-container"
      className="flex h-24 items-center justify-center gap-2"
    >
      {SOUNDWAVE_HEIGHTS.map((heightClass, index) => (
        <span
          key={index}
          data-testid="soundwave-bar"
          className={`w-1.5 rounded-full bg-white transition-all duration-300 animate-pulse ${heightClass}`}
          style={{ animationDelay: `${(index % 4) * 150}ms` }}
        />
      ))}
    </div>
  );
}

function TelemetryGrid(): React.JSX.Element {
  return (
    <div className="grid w-full grid-cols-2 gap-2.5 border-t border-zinc-800/80 pt-4">
      {TELEMETRY_DIMENSIONS.map((dim) => (
        <div
          key={dim.label}
          data-testid="telemetry-node"
          className="flex flex-col rounded border border-zinc-800 bg-black/60 p-2.5"
        >
          <span className="text-[10px] font-bold uppercase tracking-[1px] text-zinc-400">
            {dim.label}
          </span>
          <span className="text-xs font-semibold tracking-wide text-white">
            {dim.status}
          </span>
        </div>
      ))}
    </div>
  );
}

export function LoginShowcase(): React.JSX.Element {
  return (
    <div
      data-testid="login-showcase"
      className="relative flex h-full min-h-[600px] w-full flex-col items-center justify-center overflow-hidden bg-black p-8 text-white select-none lg:min-h-screen lg:p-16"
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div
          data-testid="radar-ring"
          className="absolute h-[320px] w-[320px] rounded-full border border-zinc-800/80 animate-ping"
          style={{ animationDuration: "4s" }}
        />
        <div className="absolute h-[480px] w-[480px] rounded-full border border-zinc-900" />
        <div className="absolute h-[640px] w-[640px] rounded-full border border-zinc-900/50" />
      </div>

      <div className="relative z-10 flex w-full max-w-lg flex-col gap-8">
        <div className="flex flex-col gap-4 text-center lg:text-left">
          <span
            data-testid="showcase-badge"
            className="inline-flex w-fit items-center self-center rounded-full border border-zinc-800 bg-zinc-950 px-3 py-1 text-[11px] font-bold uppercase tracking-[1.6px] text-zinc-400 lg:self-start"
          >
            INTERVIEW INTELLIGENCE // 2026
          </span>
          <h2
            data-testid="showcase-headline"
            className="text-4xl font-bold uppercase leading-[0.95] tracking-[1.6px] text-white sm:text-5xl xl:text-6xl"
          >
            {LOGIN_PAGE.showcaseHeadline}
          </h2>
          <p
            data-testid="showcase-subline"
            className="text-sm font-normal uppercase leading-relaxed tracking-[1.2px] text-zinc-400"
          >
            {LOGIN_PAGE.showcaseSubline}
          </p>
        </div>

        <div className="flex w-full flex-col items-center gap-6 rounded-2xl border border-zinc-800 bg-[#0a0a0a]/90 p-6 backdrop-blur-sm">
          <div className="flex w-full items-center justify-between border-b border-zinc-800/80 pb-3">
            <span className="text-[11px] font-bold uppercase tracking-[1.6px] text-zinc-400">
              HOWDY ADAPTIVE ENGINE
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-300">
              <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              LIVE PROBING
            </span>
          </div>

          <SoundwaveVisualizer />
          <TelemetryGrid />
        </div>
      </div>
    </div>
  );
}
