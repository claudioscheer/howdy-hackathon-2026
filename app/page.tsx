import { LANDING } from "@/lib/ui/copy";

function LandingBackground(): React.JSX.Element {
  return (
    <div
      data-testid="landing-grid-bg"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 select-none overflow-hidden"
    >
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e0e8_1px,transparent_1px),linear-gradient(to_bottom,#e0e0e8_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-25" />

      <div className="absolute top-1/2 left-1/2 h-[380px] w-[580px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white/75 blur-3xl" />

      <span className="absolute top-8 left-8 text-xs font-mono text-[#5a5a5f]/40">
        +
      </span>
      <span className="absolute top-8 right-8 text-xs font-mono text-[#5a5a5f]/40">
        +
      </span>
      <span className="absolute bottom-8 left-8 text-xs font-mono text-[#5a5a5f]/40">
        +
      </span>
      <span className="absolute bottom-8 right-8 text-xs font-mono text-[#5a5a5f]/40">
        +
      </span>

      <div className="absolute top-8 left-14 hidden rounded border border-[#e0e0e8]/70 bg-white/80 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[2px] text-[#5a5a5f] backdrop-blur-sm sm:block">
        SYS.LOC // 28.5721° N 80.6480° W
      </div>

      <div
        data-testid="telemetry-signal-meter"
        className="absolute top-8 right-14 hidden items-center gap-2 rounded border border-[#e0e0e8]/70 bg-white/80 px-2.5 py-1 backdrop-blur-sm sm:flex"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-black animate-pulse" />
        <div className="flex items-end gap-0.5">
          <span className="h-1.5 w-0.5 bg-black/70" />
          <span className="h-3 w-0.5 bg-black/70" />
          <span className="h-2 w-0.5 bg-black/70" />
          <span className="h-4 w-0.5 bg-black/70" />
        </div>
      </div>

      <div
        data-testid="precision-axis-scale"
        className="absolute bottom-8 left-14 hidden items-center gap-1.5 rounded border border-[#e0e0e8]/70 bg-white/80 px-2 py-0.5 backdrop-blur-sm sm:flex"
      >
        <div className="flex items-center gap-1 font-mono text-[10px] text-[#5a5a5f]/60">
          <span>[</span>
          <div className="flex items-center gap-0.5">
            <span className="h-2 w-[1px] bg-[#5a5a5f]/50" />
            <span className="h-1 w-[1px] bg-[#5a5a5f]/30" />
            <span className="h-1.5 w-[1px] bg-[#5a5a5f]/50" />
            <span className="h-1 w-[1px] bg-[#5a5a5f]/30" />
            <span className="h-2.5 w-[1px] bg-black/70" />
          </div>
          <span>]</span>
        </div>
      </div>

      <div className="absolute bottom-8 right-14 hidden rounded border border-[#e0e0e8]/70 bg-white/80 px-2 py-0.5 text-[10px] font-mono uppercase tracking-[2px] text-[#5a5a5f] backdrop-blur-sm sm:block">
        PROTOCOL // 2-TRIAL EXPIRING SEAMS
      </div>
    </div>
  );
}

export default function Home(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-white font-sans text-black">
      <LandingBackground />

      <main className="relative z-10 flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-8 py-24 sm:items-start sm:px-16">
        <span
          data-testid="app-badge"
          className="inline-flex items-center rounded-full border border-[#e0e0e8] bg-white px-4 py-1 text-xs font-normal uppercase tracking-[0.96px] text-[#5a5a5f]"
        >
          {LANDING.badge}
        </span>
        <div className="flex flex-col items-center gap-6 text-center sm:items-start sm:text-left">
          <h1
            data-testid="hero-title"
            className="text-4xl font-bold uppercase leading-[0.95] tracking-[1.6px] text-black sm:text-6xl lg:text-[80px]"
          >
            {LANDING.title}
          </h1>
          <p
            data-testid="hero-description"
            className="max-w-xl text-base font-normal leading-[1.7] tracking-[0.32px] text-[#5a5a5f]"
          >
            {LANDING.description}
          </p>
        </div>
        <div className="flex flex-col items-center gap-4 sm:items-start">
          <a
            data-testid="start-practice"
            href="/login"
            className="inline-flex items-center justify-center rounded-full border border-black bg-white px-6 py-[18px] text-[13px] font-bold uppercase leading-[0.94] tracking-[1.17px] text-black transition-colors hover:bg-black hover:text-white"
          >
            {LANDING.startPractice}
          </a>
        </div>
      </main>
    </div>
  );
}
