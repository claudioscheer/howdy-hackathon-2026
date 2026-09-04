import { LANDING } from "@/lib/ui/copy";

export default function Home(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col items-center justify-center overflow-hidden bg-white font-sans text-black">
      <div
        data-testid="landing-grid-bg"
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 select-none overflow-hidden"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e0e8_1px,transparent_1px),linear-gradient(to_bottom,#e0e0e8_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-40" />

        <div className="absolute -top-32 -right-32 h-[500px] w-[500px] rounded-full border border-[#e0e0e8] opacity-60" />
        <div className="absolute -top-16 -right-16 h-[380px] w-[380px] rounded-full border border-[#e0e0e8]/80 opacity-40" />
        <div className="absolute -bottom-40 -left-40 h-[600px] w-[600px] rounded-full border border-[#e0e0e8] opacity-50" />
        <div className="absolute -bottom-24 -left-24 h-[440px] w-[440px] rounded-full border border-[#e0e0e8]/80 opacity-30" />

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

        <div className="absolute top-8 left-14 hidden text-[10px] font-mono uppercase tracking-[2px] text-[#5a5a5f]/50 sm:block">
          SYS.LOC // 28.5721° N 80.6480° W
        </div>
        <div className="absolute top-8 right-14 hidden text-[10px] font-mono uppercase tracking-[2px] text-[#5a5a5f]/50 sm:block">
          STATUS // ADAPTIVE COACH ONLINE
        </div>
        <div className="absolute bottom-8 left-14 hidden text-[10px] font-mono uppercase tracking-[2px] text-[#5a5a5f]/50 sm:block">
          TELEMETRY // TRANSCRIPT GROUNDED
        </div>
        <div className="absolute bottom-8 right-14 hidden text-[10px] font-mono uppercase tracking-[2px] text-[#5a5a5f]/50 sm:block">
          PROTOCOL // 2-TRIAL EXPIRING SEAMS
        </div>
      </div>

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
