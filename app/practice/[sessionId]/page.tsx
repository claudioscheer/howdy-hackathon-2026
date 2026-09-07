import { notFound } from "next/navigation";
import { SEEDED_SESSION_ID } from "@/lib/interview/seed";
import { PracticeClient } from "./practice-client";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<React.JSX.Element> {
  const { sessionId } = await params;

  if (sessionId !== SEEDED_SESSION_ID) {
    notFound();
  }

  return <PracticeClient sessionId={sessionId} />;
}
