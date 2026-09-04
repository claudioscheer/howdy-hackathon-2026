import { LOGIN_PAGE } from "./copy";

const CORNER_CLASS = [
  "top-0 left-0 border-t border-l",
  "top-0 right-0 border-t border-r",
  "bottom-0 left-0 border-b border-l",
  "bottom-0 right-0 border-b border-r",
] as const;

export const SHOWCASE_CASCADE = [
  {
    word: "Help",
    className:
      "text-[22px] font-medium uppercase tracking-[0.32em] text-white/70",
  },
  {
    word: "your",
    className:
      "max-w-full font-bold uppercase leading-[0.82] tracking-[0.14em] text-[clamp(1.85rem,calc((100cqw-5rem)/11.5),4rem)] text-white",
  },
  {
    word: "engineers",
    className:
      "mt-1 max-w-full font-bold uppercase leading-[0.82] tracking-[-0.02em] text-[clamp(2.35rem,calc((100cqw-5rem)/7.2),6.25rem)] text-white",
  },
  {
    word: "succeed.",
    className:
      "mt-0.5 max-w-full font-bold uppercase leading-[0.82] tracking-[-0.03em] text-[clamp(2.75rem,calc((100cqw-5rem)/5.6),7.5rem)] text-white",
  },
] as const;

function ShowcaseAtmosphere(): React.JSX.Element {
  return (
    <div className="pointer-events-none absolute inset-0" aria-hidden="true">
      <div
        data-testid="showcase-grid"
        className="absolute inset-0 opacity-70"
        style={{
          backgroundImage:
            "linear-gradient(#3a3a3f 1px, transparent 1px), linear-gradient(90deg, #3a3a3f 1px, transparent 1px)",
          backgroundSize: "52px 52px",
        }}
      />
      <div data-testid="showcase-frame" className="absolute inset-6 sm:inset-8">
        {CORNER_CLASS.map((corner) => (
          <span
            key={corner}
            className={`absolute h-7 w-7 border-[#8a8a90] ${corner}`}
          />
        ))}
      </div>
    </div>
  );
}

export function LoginShowcase(): React.JSX.Element {
  return (
    <div
      data-testid="login-showcase"
      className="@container relative flex h-full min-h-[520px] w-full flex-col overflow-hidden bg-black text-white select-none lg:min-h-full"
    >
      <ShowcaseAtmosphere />
      <div className="relative z-10 flex min-h-[520px] flex-1 flex-col justify-between px-7 py-12 sm:px-10 lg:min-h-full lg:px-12 lg:py-14">
        <div className="h-7" />
        <div className="relative">
          <div
            data-testid="showcase-scrim"
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-6 -inset-y-8 bg-black/80 blur-2xl"
          />
          <h2
            data-testid="showcase-headline"
            className="relative flex w-full min-w-0 flex-col items-start"
          >
            {SHOWCASE_CASCADE.map((item, index) => (
              <span key={item.word} className={item.className}>
                {index > 0 ? " " : null}
                {item.word}
              </span>
            ))}
          </h2>
        </div>
        <p
          data-testid="showcase-subline"
          className="relative max-w-[24rem] text-base font-normal leading-[1.65] tracking-[0.32px] text-white/70"
        >
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -inset-x-4 -inset-y-3 bg-black/80 blur-xl"
          />
          <span className="relative">{LOGIN_PAGE.showcaseSubline}</span>
        </p>
      </div>
    </div>
  );
}
