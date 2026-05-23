export function countWords(input: string): number {
  return input.split(/\s+/).filter(Boolean).length;
}
