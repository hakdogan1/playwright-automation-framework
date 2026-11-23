import type { Request } from '@playwright/test';
import type { tc } from '../../fixtures';
import { SEEDED_BUGS } from '../../data/bug-playground.data';

type Annotation = ReturnType<typeof tc>;

/**
 * Test details for a seeded defect. IDs are written literally in each spec
 * (`reproduce(tc('TC-BUG-001'), bug('BUG-BP-01'))`) so the static TC/Bug
 * validators can see them; this helper checks the pair against the catalog.
 * Both tests of a defect share the TC-ID and the Bug-ID:
 *   reproduce — passes while the defect exists (proves it is reproducible),
 *   expected  — asserts correct behaviour; declared with test.fail() because the
 *               defect is known. If the defect is fixed, the expected test passes,
 *               test.fail() turns it red, and a human updates the bug catalog.
 *   control   — keeps the oracle honest (the non-defective path still works).
 */
function details(kind: '@bug-repro' | '@known-bug' | '@control', tcId: Annotation, bugId: Annotation) {
  const known = SEEDED_BUGS.find((b) => b.tcId === tcId.description && b.bugId === bugId.description);
  if (!known) throw new Error(`${tcId.description ?? '?'} / ${bugId.description ?? '?'} is not a seeded-bug pair in bug-playground.data.ts`);
  return { tag: ['@bug-playground', kind], annotation: [tcId, bugId] };
}

export const reproduce = (tcId: Annotation, bugId: Annotation) => details('@bug-repro', tcId, bugId);
export const expected = (tcId: Annotation, bugId: Annotation) => details('@known-bug', tcId, bugId);
export const control = (tcId: Annotation, bugId: Annotation) => details('@control', tcId, bugId);

/**
 * A request that could carry catalog data: fetch/XHR to the application's own
 * origin, excluding Next.js route prefetches (RSC) and static assets. Third-party
 * calls (analytics, the Supabase bug-progress sync) are not catalog data.
 */
export function isCatalogRequest(request: Request, appOrigin: string): boolean {
  const url = new URL(request.url());
  return ['fetch', 'xhr'].includes(request.resourceType()) && url.origin === appOrigin && !/[?&]_rsc=|^\/_next\//.test(`${url.pathname}${url.search}`);
}
