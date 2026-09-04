"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { LANDING } from "@/lib/ui/copy";
import {
  delayFor,
  initialCycleState,
  longestQuestion,
  pickStartIndex,
  tickCycle,
  type CycleState,
} from "@/lib/ui/question-cycle-state";

function Caret({ blink }: { blink: boolean }): React.JSX.Element {
  return (
    <span
      aria-hidden="true"
      data-testid="hero-caret"
      className={`ml-1 inline-block h-[0.86em] w-[2px] translate-y-[0.06em] bg-black align-baseline ${blink ? "landing-caret" : ""}`}
    />
  );
}

function useCycleEngine(
  questions: readonly string[],
  random: () => number,
): {
  state: CycleState;
  paused: boolean;
  reduce: boolean;
  setPaused: (paused: boolean) => void;
} {
  const started = useRef(false);
  const [state, setState] = useState<CycleState>(() =>
    initialCycleState(questions),
  );
  const [paused, setPaused] = useState(false);
  const [reduce, setReduce] = useState(true);

  useLayoutEffect(() => {
    if (started.current) {
      return;
    }
    started.current = true;
    setState(
      initialCycleState(questions, pickStartIndex(questions.length, random)),
    );
  }, [questions, random]);

  useEffect(() => {
    if (typeof globalThis.matchMedia !== "function") {
      return;
    }
    const media = globalThis.matchMedia("(prefers-reduced-motion: reduce)");
    function sync(): void {
      setReduce(media.matches);
    }
    sync();
    media.addEventListener("change", sync);
    return () => {
      media.removeEventListener("change", sync);
    };
  }, []);

  useEffect(() => {
    function onVisibility(): void {
      setPaused(document.hidden);
    }
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  useEffect(() => {
    if (reduce || paused) {
      return;
    }
    const id = setTimeout(() => {
      setState((current) => tickCycle(current, questions));
    }, delayFor(state.phase));
    return () => {
      clearTimeout(id);
    };
  }, [paused, questions, reduce, state]);

  return { state, paused, reduce, setPaused };
}

export function QuestionCycle({
  questions = LANDING.questions,
  random = Math.random,
}: {
  questions?: readonly string[];
  random?: () => number;
}): React.JSX.Element {
  const first = questions[0] ?? "";
  const sizer = longestQuestion(questions);
  const { state, reduce, setPaused } = useCycleEngine(questions, random);
  const spoken = questions[state.index] ?? first;
  const blink = reduce || state.phase === "holding";

  return (
    <div
      data-testid="question-cycle"
      data-reduced={reduce ? "true" : "false"}
      data-phase={state.phase}
      suppressHydrationWarning
      onMouseEnter={() => {
        setPaused(true);
      }}
      onMouseLeave={() => {
        setPaused(document.hidden);
      }}
    >
      <span className="sr-only">{spoken}</span>
      <span aria-hidden="true" className="invisible">
        {sizer}
      </span>
      <span
        aria-hidden="true"
        className="absolute inset-0"
        data-testid="hero-question-typed"
        suppressHydrationWarning
      >
        {state.displayed}
        <Caret blink={blink} />
      </span>
    </div>
  );
}
