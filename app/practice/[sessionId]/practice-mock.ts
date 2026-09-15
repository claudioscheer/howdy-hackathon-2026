export function isPracticeMockQuery(
  value: string | string[] | undefined,
): boolean {
  const raw = Array.isArray(value) ? value.at(-1) : value;
  return raw === "true";
}
