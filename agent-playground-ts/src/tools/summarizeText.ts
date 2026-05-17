export function summarizeText(input: string): string {
  const normalized = input.trim();

  if (!normalized) {
    return 'Empty input.';
  }

  if (normalized.length <= 80) {
    return normalized;
  }

  return `${normalized.slice(0, 77)}...`;
}
