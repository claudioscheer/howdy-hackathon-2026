import Link from "next/link";

export default function PracticeNotFound(): React.JSX.Element {
  return (
    <main className="flex min-h-screen items-center justify-center bg-white px-6 text-black">
      <section className="max-w-md rounded border border-[#e0e0e8] p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#5a5a5f]">
          Invalid practice session
        </p>
        <h1 className="mt-3 text-2xl font-bold uppercase tracking-tight">
          This seeded session is not available.
        </h1>
        <p className="mt-3 text-sm leading-6 text-[#5a5a5f]">
          Return to the demo dashboard and open the active Fullstack Product
          Engineer opportunity.
        </p>
        <Link
          href="/dashboard"
          className="mt-6 inline-flex rounded-full bg-black px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white"
        >
          Return to dashboard
        </Link>
      </section>
    </main>
  );
}
