import { notFound } from "next/navigation";
import { loadPracticePageData } from "@/lib/interview/practice-session";
import { PracticeClient } from "./practice-client";
import { isPracticeMockQuery } from "./practice-mock";

export const dynamic = "force-dynamic";

export default async function PracticePage({
  params,
  searchParams = Promise.resolve({}),
}: {
  params: Promise<{ sessionId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<React.JSX.Element> {
  const { sessionId } = await params;
  const query = await searchParams;
  const loaded = await loadPracticePageData(sessionId);
  if (loaded === null) {
    notFound();
  }

  return (
    <PracticeClient
      initialState={loaded.session}
      targetMinutes={loaded.targetMinutes}
      mock={isPracticeMockQuery(query.mock)}
    />
  );
}
