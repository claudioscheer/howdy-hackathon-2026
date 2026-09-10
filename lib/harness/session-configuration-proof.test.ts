import { describe, expect, it } from "vitest";
import {
  buildSessionConfigurationProof,
  proveSessionConfiguration,
} from "./session-configuration-proof";

describe("session configuration proof", () => {
  it("opens stored candidate, opportunity, and question data through the product runtime", () => {
    expect(proveSessionConfiguration()).toMatchObject({
      pass: true,
      invalidConfigurationRejected: true,
      snapshot: {
        sessionId: "persisted-practice-proof",
        candidateId: "candidate-proof",
        opportunityId: "opportunity-proof",
        questionIds: ["question-proof-reliability", "question-proof-failover"],
        openingTurns: [
          "Describe a reliability incident you personally resolved.",
        ],
        sessionAnswerBudget: 6,
      },
    });
  });

  it("fails closed when valid-looking configuration cannot produce a session", () => {
    expect(buildSessionConfigurationProof(null, true)).toEqual({
      pass: false,
      evidence: "the product practice-session constructor rejected valid data",
      invalidConfigurationRejected: true,
    });
  });

  it("fails when invalid configuration is accepted", () => {
    expect(buildSessionConfigurationProof(null, false)).toMatchObject({
      pass: false,
      invalidConfigurationRejected: false,
    });
  });
});
