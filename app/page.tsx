import { LANDING } from "@/lib/ui/copy";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 px-16 py-32 sm:items-start">
        <span
          data-testid="app-badge"
          className="rounded-full bg-blue-100 px-3 py-1 text-xs font-semibold text-blue-700 dark:bg-blue-950 dark:text-blue-300"
        >
          {LANDING.badge}
        </span>
        <div className="flex flex-col items-center gap-4 text-center sm:items-start sm:text-left">
          <h1
            data-testid="hero-title"
            className="max-w-md text-3xl font-semibold leading-10 tracking-tight text-black dark:text-zinc-50"
          >
            {LANDING.title}
          </h1>
          <p
            data-testid="hero-description"
            className="max-w-md text-lg leading-8 text-zinc-600 dark:text-zinc-400"
          >
            {LANDING.description}
          </p>
        </div>
        <div className="flex flex-col items-center gap-3 sm:items-start">
          <a
            data-testid="start-practice"
            href="#practice"
            className="flex h-12 items-center justify-center rounded-full bg-foreground px-6 text-sm font-medium text-background transition-colors hover:bg-[#383838] dark:hover:bg-[#ccc]"
          >
            {LANDING.startPractice}
          </a>
          <p
            data-testid="harness-hint"
            className="text-sm text-zinc-500 dark:text-zinc-500"
          >
            {LANDING.harnessHint}
          </p>
        </div>
      </main>
    </div>
  );
}
