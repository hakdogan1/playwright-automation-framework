/**
 * Traceability helpers. A test links to a manual test case with `tc()` and,
 * when it documents a known defect, to a bug with `bug()`.
 *
 *   test('…', { tag: ['@smoke'], annotation: [tc('TC-BTN-001')] }, async () => {});
 */
export const TC_ID_PATTERN = /^TC-[A-Z]{2,8}-\d{3}$/;
export const TC_ANNOTATION = 'tc';
export const BUG_ANNOTATION = 'bug';

export interface Annotation {
  type: string;
  description?: string;
}

export function tc(id: string): Annotation {
  if (!TC_ID_PATTERN.test(id)) {
    throw new Error(`Invalid TC-ID "${id}". Expected format TC-<AREA>-<NNN>, e.g. TC-BTN-001.`);
  }
  return { type: TC_ANNOTATION, description: id };
}

export function bug(id: string): Annotation {
  if (!/^(#\d+|[A-Z][A-Z0-9]+-\d+|BUG-[\w-]+)$/.test(id)) {
    throw new Error(`Invalid bug reference "${id}". Use #123, JIRA-123 or BUG-<slug>.`);
  }
  return { type: BUG_ANNOTATION, description: id };
}

export function tcIdsOf(annotations: readonly Annotation[]): string[] {
  return annotations.filter((a) => a.type === TC_ANNOTATION && a.description).map((a) => a.description as string);
}
