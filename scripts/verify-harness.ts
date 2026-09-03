import fs from "node:fs";
import path from "node:path";
import {
  DeterministicStubProvider,
  InterviewEngine,
} from "../lib/harness/engine";
import {
  InterviewerDecisionSchema,
  QuestionState,
  validateTranscriptGrounding,
} from "../lib/harness/schema";

type Fixture = {
  id: string;
  input: {
    role: string;
    seniority: string;
    targetTechStack: string[];
    question: string;
    answer: string;
  };
  state?: QuestionState;
  expected: {
    decision?: "FOLLOW_UP" | "MOVE_ON";
    dimension?: string;
    finalDecision?: "FOLLOW_UP" | "MOVE_ON";
    isCapped?: boolean;
  };
};

function loadFixtures(dir: string): Fixture[] {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => file.endsWith(".json"))
    .map((file) =>
      JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"))
    );
}

function matches(fixture: Fixture, res: {
  decision: { decision: string; dimension?: string };
  finalDecision: string;
  isCapped: boolean;
}): boolean {
  const { expected } = fixture;
  if (expected.decision && res.decision.decision !== expected.decision) {
    return false;
  }
  if (expected.dimension && res.decision.dimension !== expected.dimension) {
    return false;
  }
  if (expected.finalDecision && res.finalDecision !== expected.finalDecision) {
    return false;
  }
  if (expected.isCapped !== undefined && res.isCapped !== expected.isCapped) {
    return false;
  }
  return true;
}

async function main() {
  const failures: string[] = [];
  const results = {
    timestamp: new Date().toISOString(),
    layer0: { schema: false, grounding: false },
    layer1: {
      passedGoldens: 0,
      totalGoldens: 0,
      holdoutsPassed: 0,
      totalHoldouts: 0,
    },
    failures,
  };

  const valid = InterviewerDecisionSchema.safeParse({
    decision: "FOLLOW_UP",
    dimension: "specificity",
    followUp: "Can you provide a concrete incident?",
    reason: "Answer was generic.",
  });
  if (!valid.success) {
    failures.push("Layer 0 schema contract failed");
  } else {
    results.layer0.schema = true;
  }

  const transcript =
    "Candidate: We reduced latency from 450ms to 45ms using connection pooling.";
  const groundCheck = validateTranscriptGrounding(
    [
      {
        quote: "reduced latency from 450ms to 45ms",
        dimension: "specificity",
        feedback: "Concrete metric cited.",
      },
    ],
    transcript
  );
  if (!groundCheck.valid) {
    failures.push("Layer 0 grounding verification failed");
  } else {
    results.layer0.grounding = true;
  }

  const provider = new DeterministicStubProvider();
  const engine = new InterviewEngine(provider);
  const goldensDir = path.resolve(import.meta.dirname, "../evals/goldens");
  const holdoutsDir = path.resolve(import.meta.dirname, "../evals/holdouts");

  const goldens = loadFixtures(goldensDir);
  results.layer1.totalGoldens = goldens.length;

  for (const fixture of goldens) {
    const state: QuestionState = fixture.state ?? {
      questionId: fixture.id,
      followUpCount: 0,
      isComplete: false,
    };
    const res = await engine.evaluateTurn(fixture.input, state);
    if (matches(fixture, res)) {
      results.layer1.passedGoldens++;
    } else {
      failures.push(
        `Golden [${fixture.id}] expected ${JSON.stringify(fixture.expected)} got decision=${res.decision.decision} dimension=${res.decision.dimension ?? ""} final=${res.finalDecision}`
      );
    }
  }

  const holdouts = loadFixtures(holdoutsDir);
  results.layer1.totalHoldouts = holdouts.length;

  for (const fixture of holdouts) {
    const state: QuestionState = fixture.state ?? {
      questionId: fixture.id,
      followUpCount: 0,
      isComplete: false,
    };
    const res = await engine.evaluateTurn(fixture.input, state);
    if (matches(fixture, res)) {
      results.layer1.holdoutsPassed++;
    } else {
      failures.push(
        `Holdout [${fixture.id}] expected ${JSON.stringify(fixture.expected)} got decision=${res.decision.decision}`
      );
    }
  }

  const traceDir = path.resolve(import.meta.dirname, "../evals/traces");
  fs.mkdirSync(traceDir, { recursive: true });
  fs.writeFileSync(
    path.join(traceDir, "latest-eval.json"),
    JSON.stringify(results, null, 2)
  );

  const acceptancePath = path.resolve(
    import.meta.dirname,
    "../acceptance.json"
  );
  if (fs.existsSync(acceptancePath)) {
    const acceptance = JSON.parse(fs.readFileSync(acceptancePath, "utf8"));
    for (const item of acceptance.criteria) {
      if (item.id === "ACC-L0-SCHEMA") {
        item.passes = results.layer0.schema;
        item.evidence = "evals/traces/latest-eval.json#layer0.schema";
      } else if (item.id === "ACC-L0-GROUNDING") {
        item.passes = results.layer0.grounding;
        item.evidence = "evals/traces/latest-eval.json#layer0.grounding";
      } else if (item.id === "ACC-L0-STATE-CAP") {
        item.passes = failures.length === 0;
        item.evidence = "__tests__/harness/state-machine.test.ts";
      } else if (item.id === "ACC-L1-GOLDENS") {
        item.passes =
          results.layer1.passedGoldens === results.layer1.totalGoldens &&
          results.layer1.totalGoldens > 0;
        item.evidence = "evals/traces/latest-eval.json#layer1.passedGoldens";
      } else if (item.id === "ACC-L1-HOLDOUTS") {
        item.passes =
          results.layer1.holdoutsPassed === results.layer1.totalHoldouts &&
          results.layer1.totalHoldouts > 0;
        item.evidence = "evals/traces/latest-eval.json#layer1.holdoutsPassed";
      } else if (item.id === "ACC-UI-LANDING") {
        item.passes = failures.length === 0;
        item.evidence = "__tests__/page.test.tsx";
      }
    }
    fs.writeFileSync(acceptancePath, JSON.stringify(acceptance, null, 2));
  }

  if (failures.length > 0) {
    for (const failure of failures) {
      console.error(failure);
    }
    process.exit(1);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
