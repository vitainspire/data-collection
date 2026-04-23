export function pad(n: number, len = 3): string {
  return String(n).padStart(len, "0");
}

export function generateFieldId(state: string, district: string, existingIds: string[]): string {
  const prefix = `${state}-${district}-F`;
  const seqs = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${pad(next)}`;
}

export function todayStamp(): string {
  const d = new Date();
  return `${d.getFullYear()}${pad(d.getMonth() + 1, 2)}${pad(d.getDate(), 2)}`;
}

export function generateSampleId(fieldId: string, existingIds: string[]): string {
  const stamp = todayStamp();
  const prefix = `${fieldId}-${stamp}-S`;
  const seqs = existingIds
    .filter((id) => id.startsWith(prefix))
    .map((id) => parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n));
  const next = (seqs.length ? Math.max(...seqs) : 0) + 1;
  return `${prefix}${pad(next, 2)}`;
}

export function uniqueId(): string {
  return Date.now().toString() + Math.random().toString(36).slice(2, 9);
}
