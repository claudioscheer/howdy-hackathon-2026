import { z } from "zod";

const MessageContentSchema = z.union([
  z.string(),
  z.null(),
  z.array(z.unknown()),
]);

const ChatCompletionSchema = z.object({
  choices: z
    .array(
      z.object({
        finish_reason: z.string().optional(),
        message: z
          .object({
            content: MessageContentSchema.optional(),
            reasoning_content: MessageContentSchema.optional(),
          })
          .passthrough(),
      }),
    )
    .min(1),
});

function textFromContent(content: unknown): string {
  if (typeof content === "string") {
    return content.trim();
  }
  if (!Array.isArray(content)) {
    return "";
  }
  return content
    .map((part) => {
      if (typeof part === "string") {
        return part;
      }
      if (
        typeof part === "object" &&
        part !== null &&
        "text" in part &&
        typeof part.text === "string"
      ) {
        return part.text;
      }
      return "";
    })
    .join("")
    .trim();
}

function containsJsonObject(text: string): boolean {
  return text.includes("{") && text.includes("}");
}

export function completionText(payload: unknown): string {
  const parsed = ChatCompletionSchema.safeParse(payload);
  const choice = parsed.success ? parsed.data.choices[0] : undefined;
  const message = choice?.message;
  const content = textFromContent(message?.content);
  const reasoning = textFromContent(message?.reasoning_content);
  if (containsJsonObject(content)) {
    return content;
  }
  if (containsJsonObject(reasoning)) {
    return reasoning;
  }
  if (content.length > 0) {
    return content;
  }
  if (reasoning.length > 0) {
    return reasoning;
  }
  const finish = choice?.finish_reason;
  if (finish !== undefined && finish.length > 0) {
    throw new Error(
      `OpenCode returned an empty completion (finish_reason=${finish}).`,
    );
  }
  throw new Error("OpenCode returned an empty completion.");
}
