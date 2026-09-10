import { notFound } from "next/navigation";
import { loadPracticePageData } from "@/lib/interview/practice-session";
import { PracticeClient } from "./practice-client";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}): Promise<React.JSX.Element> {
  const { sessionId } = await params;
  const loaded = await loadPracticePageData(sessionId);
  if (loaded === null) {
    notFound();
  }

  return (
    <PracticeClient
      initialState={loaded.session}
      targetMinutes={loaded.targetMinutes}
    />
  );
}
