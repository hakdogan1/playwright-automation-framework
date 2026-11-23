/**
 * AI Guard baseline approval for the repository's root commit.
 *
 * The root commit has no parent, so every protected file in it is a finding. They can only pass
 * through a human approval that lives OUTSIDE the commit: a reference (exact commit SHA, manifest
 * hash, exact finding IDs) stored as a GitHub environment secret and released to the job only
 * after a required reviewer approved it. This module builds the deterministic manifest and checks
 * the reference; it never decides on its own that something is approved.
 *
 * Reference values are treated as sensitive: results carry reason codes and counts only.
 * Imports only node: modules, so it runs with plain `node`.
 */
import { createHash } from 'node:crypto';

export const MANIFEST_SCHEMA = 'pqf-ai-guard-manifest/1';

export interface ManifestFinding {
  /** sha256 over rule, file, detail and contentSha256. */
  id: string;
  rule: string;
  file: string;
  detail: string;
  /** sha256 of the file content the finding was computed from (null when the file is deleted). */
  contentSha256: string | null;
}

export interface FindingManifest {
  schema: typeof MANIFEST_SCHEMA;
  commit: string;
  base: 'empty-tree';
  findings: ManifestFinding[];
}

/** The trusted reference (from the protected environment secret). */
export interface BaselineReference {
  commit: string;
  manifestSha256: string;
  findingIds: string[];
}

export type BaselineFailure =
  | 'not-root-commit'
  | 'worktree-not-clean'
  | 'reference-missing'
  | 'reference-invalid'
  | 'sha-mismatch'
  | 'manifest-mismatch'
  | 'finding-set-mismatch';

export interface BaselineResult {
  ok: boolean;
  failures: BaselineFailure[];
  /** Counts only; no IDs and no reference values. */
  counts: { manifest: number; reference: number; missing: number; unexpected: number };
}

const sha256 = (text: string | Buffer) => createHash('sha256').update(text).digest('hex');
const HEX40 = /^[0-9a-f]{40}$/;
const HEX64 = /^[0-9a-f]{64}$/;

/** JSON with sorted object keys: the same data always gives the same bytes. */
export function canonicalJson(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(',')}]`;
  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalJson(v)}`).join(',')}}`;
  }
  return JSON.stringify(value);
}

export function findingId(f: Omit<ManifestFinding, 'id'>): string {
  return sha256(canonicalJson({ contentSha256: f.contentSha256, detail: f.detail, file: f.file, rule: f.rule }));
}

/** Deterministic manifest: findings sorted by ID, content fingerprints included, no file content. */
export function buildManifest(commit: string, findings: readonly { rule: string; file: string; detail: string }[], readContent: (file: string) => Buffer | null): FindingManifest {
  const items = findings.map((f) => {
    const content = readContent(f.file);
    const base = { rule: f.rule, file: f.file, detail: f.detail, contentSha256: content === null ? null : sha256(content) };
    return { id: findingId(base), ...base };
  });
  items.sort((a, b) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
  return { schema: MANIFEST_SCHEMA, commit, base: 'empty-tree', findings: items };
}

export function manifestSha256(manifest: FindingManifest): string {
  return sha256(canonicalJson(manifest));
}

/** Parses the reference strictly; anything unexpected is invalid (never "approved"). */
export function parseReference(raw: string | undefined): BaselineReference | 'missing' | 'invalid' {
  if (raw === undefined || raw.trim() === '') return 'missing';
  let value: unknown;
  try {
    value = JSON.parse(raw);
  } catch {
    return 'invalid';
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return 'invalid';
  const r = value as Record<string, unknown>;
  const keys = Object.keys(r).sort().join(',');
  if (keys !== 'commit,findingIds,manifestSha256') return 'invalid';
  if (typeof r.commit !== 'string' || !HEX40.test(r.commit)) return 'invalid';
  if (typeof r.manifestSha256 !== 'string' || !HEX64.test(r.manifestSha256)) return 'invalid';
  if (!Array.isArray(r.findingIds) || r.findingIds.length === 0) return 'invalid';
  if (!r.findingIds.every((id) => typeof id === 'string' && HEX64.test(id))) return 'invalid';
  if (new Set(r.findingIds).size !== r.findingIds.length) return 'invalid';
  return { commit: r.commit, manifestSha256: r.manifestSha256, findingIds: r.findingIds as string[] };
}

/**
 * All conditions must hold: root commit, clean work tree, a valid reference, the exact commit SHA,
 * the exact manifest hash and exactly the same finding IDs. Every check is evaluated (no early
 * success path), and the result is only ok when no failure was recorded.
 */
export function verifyBaseline(input: { head: string; isRoot: boolean; clean: boolean; manifest: FindingManifest; referenceRaw: string | undefined }): BaselineResult {
  const failures: BaselineFailure[] = [];
  const ids = input.manifest.findings.map((f) => f.id);
  const counts = { manifest: ids.length, reference: 0, missing: 0, unexpected: 0 };
  if (!input.isRoot) failures.push('not-root-commit');
  if (!input.clean) failures.push('worktree-not-clean');
  const ref = parseReference(input.referenceRaw);
  if (ref === 'missing') failures.push('reference-missing');
  else if (ref === 'invalid') failures.push('reference-invalid');
  else {
    counts.reference = ref.findingIds.length;
    if (ref.commit !== input.head || input.manifest.commit !== input.head) failures.push('sha-mismatch');
    if (ref.manifestSha256 !== manifestSha256(input.manifest)) failures.push('manifest-mismatch');
    const refIds = new Set(ref.findingIds);
    counts.missing = ids.filter((id) => !refIds.has(id)).length;
    counts.unexpected = ref.findingIds.filter((id) => !ids.includes(id)).length;
    if (counts.missing > 0 || counts.unexpected > 0 || ids.length !== ref.findingIds.length) failures.push('finding-set-mismatch');
  }
  return { ok: failures.length === 0, failures, counts };
}

// ---------- environment protection (checked inside the baseline job) ----------

export type EnvironmentFailure =
  | 'environment-unreadable'
  | 'environment-name'
  | 'admin-bypass-allowed'
  | 'required-reviewer-missing'
  | 'branch-policy-missing'
  | 'branch-policy-not-main-only';

/**
 * The baseline job must only run after a human approval. If the environment were missing (GitHub
 * would create it unprotected), had no required reviewer, or let admins bypass, the job could run
 * without that approval. This check reads the environment through the GitHub REST API
 * (GET /repos/{repo}/environments/{name} and .../deployment-branch-policies) and fails closed.
 */
export function verifyEnvironmentProtection(input: { environmentJson: string; branchPoliciesJson: string; name: string; reviewer: string }): { ok: boolean; failures: EnvironmentFailure[] } {
  const failures: EnvironmentFailure[] = [];
  let env: Record<string, unknown>;
  let policies: Record<string, unknown>;
  try {
    env = JSON.parse(input.environmentJson) as Record<string, unknown>;
    policies = JSON.parse(input.branchPoliciesJson) as Record<string, unknown>;
  } catch {
    return { ok: false, failures: ['environment-unreadable'] };
  }
  if (!env || typeof env !== 'object' || !policies || typeof policies !== 'object') return { ok: false, failures: ['environment-unreadable'] };
  if (env.name !== input.name) failures.push('environment-name');
  if (env.can_admins_bypass !== false) failures.push('admin-bypass-allowed');

  const rules = Array.isArray(env.protection_rules) ? (env.protection_rules as Record<string, unknown>[]) : [];
  const reviewers = rules
    .filter((r) => r?.type === 'required_reviewers' && Array.isArray(r.reviewers))
    .flatMap((r) => r.reviewers as { type?: unknown; reviewer?: { login?: unknown } }[]);
  const hasReviewer = reviewers.some((r) => r?.type === 'User' && typeof r.reviewer?.login === 'string' && r.reviewer.login.toLowerCase() === input.reviewer.toLowerCase());
  if (!hasReviewer) failures.push('required-reviewer-missing');

  const policy = env.deployment_branch_policy as { protected_branches?: unknown; custom_branch_policies?: unknown } | null | undefined;
  if (!policy || typeof policy !== 'object') failures.push('branch-policy-missing');
  else {
    const list = Array.isArray(policies.branch_policies) ? (policies.branch_policies as { name?: unknown; type?: unknown }[]) : [];
    const mainOnly = policy.custom_branch_policies === true && policy.protected_branches === false && list.length === 1 && list[0]?.name === 'main' && (list[0]?.type ?? 'branch') === 'branch';
    if (!mainOnly) failures.push('branch-policy-not-main-only');
  }
  return { ok: failures.length === 0, failures };
}
