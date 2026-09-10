import type { InterviewQuestion, TranscriptTurn } from "./contracts";
import type { SessionState } from "./session";

export type QuestionAskInput = {
  role: string;
  planned: InterviewQuestion;
  history: TranscriptTurn[];
  opportunityId: string;
  attemptNumber: number;
};

export interface QuestionSpeaker {
  speak(input: QuestionAskInput): Promise<string>;
}

export class PlannedQuestionSpeaker implements QuestionSpeaker {
  async speak(input: QuestionAskInput): Promise<string> {
    return input.planned.prompt;
  }
}

export async function speakNewQuestion(
  state: SessionState,
  speaker: QuestionSpeaker,
): Promise<SessionState> {
  const last = state.history.at(-1);
  const planned = state.questions[state.questionIndex];
  if (
    last === undefined ||
    last.kind !== "question" ||
    last.speaker !== "interviewer" ||
    planned === undefined
  ) {
    return state;
  }
  try {
    const ask = (
      await speaker.speak({
        role: state.opportunity.role,
        planned,
        history: state.history,
        opportunityId: state.opportunity.id,
        attemptNumber: state.attemptNumber,
      })
    ).trim();
    if (ask.length === 0 || ask === last.content) {
      return state;
    }
    return {
      ...state,
      history: [...state.history.slice(0, -1), { ...last, content: ask }],
    };
  } catch {
    return state;
  }
}
