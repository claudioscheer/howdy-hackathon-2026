import { describe, expect, it } from "vitest";
import { completionText } from "./completion-text";

describe("completionText", () => {
  it("reads string content and joined text parts", () => {
    expect(
      completionText({ choices: [{ message: { content: "  hello  " } }] }),
    ).toBe("hello");
    expect(
      completionText({
        choices: [
          {
            message: {
              content: [
                { type: "text", text: "{" },
                { text: '"ok":true}' },
                { type: "ignore" },
                " ",
              ],
            },
          },
        ],
      }),
    ).toBe('{"ok":true}');
  });

  it("prefers JSON in reasoning when the visible content is prose", () => {
    expect(
      completionText({
        choices: [
          {
            message: {
              content: "I will draft a plan next.",
              reasoning_content: '{"ok":true}',
            },
          },
        ],
      }),
    ).toBe('{"ok":true}');
  });

  it("falls back to reasoning content when the visible content is empty", () => {
    expect(
      completionText({
        choices: [
          {
            finish_reason: "stop",
            message: {
              content: "",
              reasoning_content: ' {"ok":true} ',
            },
          },
        ],
      }),
    ).toBe('{"ok":true}');
  });

  it("names the finish reason when both content fields are empty", () => {
    expect(() =>
      completionText({
        choices: [{ finish_reason: "length", message: { content: null } }],
      }),
    ).toThrow("OpenCode returned an empty completion (finish_reason=length).");
    expect(() => completionText({ choices: [] })).toThrow(
      "OpenCode returned an empty completion.",
    );
  });
});
