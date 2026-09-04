import { LANDING } from "@/lib/ui/copy";
import { QuestionCycle } from "@/lib/ui/question-cycle";

function LandingAtmosphere(): React.JSX.Element {
  return (
    <div
      data-testid="landing-grid-bg"
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      <div className="absolute top-[46%] left-1/2 h-[26rem] w-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#f0f0fa] opacity-80 blur-3xl" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#e0e0e8_1px,transparent_1px),linear-gradient(to_bottom,#e0e0e8_1px,transparent_1px)] bg-[size:5.5rem_5.5rem] opacity-[0.22] [mask-image:radial-gradient(ellipse_at_center,transparent_18%,black_72%)] [-webkit-mask-image:radial-gradient(ellipse_at_center,transparent_18%,black_72%)]" />
    </div>
  );
}

export default function Home(): React.JSX.Element {
  return (
    <div className="relative flex min-h-screen flex-1 flex-col bg-white font-sans text-black">
      <LandingAtmosphere />
      <span
        data-testid="app-badge"
        aria-hidden="true"
        className="sr-only uppercase"
      >
        {LANDING.badge}
      </span>
      <header className="relative z-10 flex items-center justify-between gap-6 px-8 py-8 sm:px-16 lg:px-20">
        <p
          data-testid="product-wordmark"
          className="text-[13px] font-bold uppercase leading-[0.94] tracking-[1.17px] text-black sm:whitespace-nowrap"
        >
          {LANDING.product}
        </p>
        <a
          data-testid="start-practice"
          href="/login"
          className="inline-flex items-center justify-center rounded-full border border-black bg-white px-6 py-[18px] text-[13px] font-bold uppercase leading-[0.94] tracking-[1.17px] text-black transition-colors hover:bg-black hover:text-white"
        >
          {LANDING.startPractice}
        </a>
      </header>

      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-8 pb-24 sm:px-16 lg:px-20">
        <p
          data-testid="hero-description"
          className="mb-8 max-w-xl text-base font-normal leading-[1.7] tracking-[0.32px] text-[#5a5a5f]"
        >
          {LANDING.description}
        </p>
        <h1
          data-testid="hero-title"
          className="relative max-w-4xl text-balance text-4xl font-bold uppercase leading-[0.95] tracking-[1.6px] text-black sm:text-6xl lg:text-[80px]"
        >
          <QuestionCycle />
        </h1>
      </main>
    </div>
  );
}
