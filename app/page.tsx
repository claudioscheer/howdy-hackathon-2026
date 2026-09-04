import { LANDING } from "@/lib/ui/copy";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-1 flex-col items-center justify-center bg-white font-sans text-black">
      <main className="flex w-full max-w-4xl flex-1 flex-col items-center justify-center gap-10 px-8 py-24 sm:items-start sm:px-16">
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
