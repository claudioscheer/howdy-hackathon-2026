import { notFound } from "next/navigation";
import { loadPracticeSession } from "@/lib/interview/practice-session";
import { sessionReducer } from "@/lib/interview/reducer";
import { PracticeClient } from "./practice-client";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<React.JSX.Element> {
  const { sessionId } = await params;
  const planned = await loadPracticeSession(sessionId);
  if (planned === null) {
    notFound();
  }

  return (
    <PracticeClient
      initialState={sessionReducer(planned, { type: "START_SESSION" })}
    />
  );
}
