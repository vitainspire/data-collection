export function pad(n: number, len = 3): string {
  return String(n).padStart(len, "0");
}

export function makeFieldId(state: string, district: string, numericId: number): string {
  return `${state}-${district}-${pad(numericId)}`;
}

export function uniqueId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}
