export type ReviewCaseRecord = {
  review_text?: string | null;
  approved_replies?: unknown;
  refund_wording?: string | null;
  replacement_wording?: string | null;
  timeline_wording?: string | null;
  status?: string | null;
};

export type ViolationKind =
  | "unapproved_wording"
  | "unapproved_refund"
  | "unapproved_replacement"
  | "unapproved_timeline"
  | "closed_case";

export type Violation = {
  kind: ViolationKind;
  detail: string;
  excerpt: string;
};

export type CheckResult = {
  verdict: "approved" | "rejected";
  matched_reply: string | null;
  violations: Violation[];
};

const QUALIFIERS = ["full", "partial", "complete", "entire", "new", "different", "expedited", "overnight", "express"] as const;

const REFUND_PATTERNS = [
  /\b(?:will|we'll|we will|can|shall)\s+(?:issue|process|give|send|provide|offer|grant|start)\s+((?:you\s+)?(?:a\s+|the\s+)?(?:full\s+|partial\s+|complete\s+|entire\s+)?refund(?:\s+(?:of|for)\s+[^.,!\n]{1,80})?)/gi,
  /\b(?:will|we'll|we will)\s+(refund(?:\s+you\b|\s+your\b|\s+(?:the|a)\s+[^.,!\n]{1,80})?)/gi,
  /\b(money back|reimburse you|reimbursement|(?:full|partial|complete|entire)\s+refund)\b/gi
];

const REFUND_DENIAL =
  /\b(?:no refunds?|no money back|without (?:a |any )?refund|not (?:eligible|entitled) (?:for|to) (?:a )?refund|(?:cannot|can't|can not|will not|won't|do not|don't|unable to|not able to)(?:\s+\w+){0,6}\s+(?:refunds?|money back|reimburse(?:ment)?)|refunds?\s+(?:is|are)\s+(?:not available|unavailable)|(?:isn't|aren't)\s+(?:eligible|available)\s+for\s+(?:a\s+)?refund)\b/i;

const REPLACEMENT_PATTERNS = [
  /\b(?:will|we'll|we will|can|shall)\s+(?:send|ship|issue|provide|offer)\s+((?:you\s+)?(?:a\s+|the\s+)?replacement(?:\s+(?:of|for)\s+[^.,!\n]{1,80})?)/gi,
  /\b(?:will|we'll|we will)\s+(replace(?:\s+(?:it|this|the item|the order|your order|your item))?)/gi,
  /\b(send you a new (?:one|item|unit|product|order))\b/gi,
  /\b(?:will|we'll|we will)\s+(exchange(?:\s+(?:it|this|the item|the order|your order))?)/gi
];

const REPLACEMENT_DENIAL =
  /\b(?:no replacements?|without (?:a |any )?replacement|(?:cannot|can't|can not|will not|won't|do not|don't|unable to|not able to)(?:\s+\w+){0,6}\s+replac(?:e|ement)|replacements?\s+(?:is|are)\s+(?:not available|unavailable))\b/i;

const WEEKDAY = "(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)";
const MONTH = "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

const TIMELINE_PATTERNS = [
  new RegExp(String.raw`\b((?:within|in)\s+\d+\s+(?:business\s+)?(?:hours?|days?|weeks?|months?))\b`, "gi"),
  new RegExp(String.raw`\b(\d+\s+business\s+days)\b`, "gi"),
  new RegExp(String.raw`\b(by\s+(?:the\s+)?end\s+of\s+(?:the\s+)?(?:day|week))\b`, "gi"),
  new RegExp(String.raw`\b(by\s+(?:tomorrow|today|tonight|(?:next\s+)?${WEEKDAY}|next\s+week|next\s+month))\b`, "gi"),
  new RegExp(String.raw`\b(by\s+\d{4}-\d{2}-\d{2})\b`, "gi"),
  new RegExp(String.raw`\b(by\s+\d{1,2}[/-]\d{1,2}(?:[/-]\d{2,4})?)\b`, "gi"),
  new RegExp(String.raw`\b(by\s+${MONTH}\s+\d{1,2}(?:,\s*\d{4})?)\b`, "gi"),
  /\b(tomorrow|next week|next month|as soon as possible|asap)\b/gi,
  /\b(in a few (?:hours|days|weeks))\b/gi
];

const TIMELINE_DENIAL =
  /\b(?:cannot|can't|can not|will not|won't|do not|don't|unable to|not able to|no)(?:\s+\w+){0,6}\s+(?:promise|guarantee|commit|timeline|date|within|by|tomorrow|next)\b/i;

export function normalizeWording(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function fold(value: string) {
  return normalizeWording(value).toLocaleLowerCase();
}

function sentences(text: string) {
  const parts = text.split(/(?<=[.!?])\s+|\n+/).map((part) => part.trim()).filter(Boolean);
  return parts.length ? parts : [text.trim()].filter(Boolean);
}

function excerpt(text: string, limit = 240) {
  const clean = text.replace(/\s+/g, " ").trim();
  return clean.length <= limit ? clean : `${clean.slice(0, limit - 1)}…`;
}

function approvedReplies(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string" && normalizeWording(item).length > 0);
}

function numbersIn(text: string) {
  return [...fold(text).matchAll(/\d+(?:\.\d+)?/g)].map((match) => match[0]);
}

function qualifiersIn(text: string) {
  return QUALIFIERS.filter((word) => new RegExp(`\\b${word}\\b`, "i").test(text));
}

function dedupe(values: string[]) {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const key = fold(value);
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(value);
  }
  return result;
}

function preferLonger(claims: string[]) {
  const folded = dedupe(claims).map((claim) => ({ claim, key: fold(claim) }));
  return folded
    .filter((item) => !folded.some((other) => other.key !== item.key && other.key.includes(item.key)))
    .map((item) => item.claim);
}

function collectClaims(sentence: string, patterns: RegExp[], denial: RegExp) {
  const found: Array<{ text: string; index: number }> = [];
  for (const pattern of patterns) {
    const flags = pattern.flags.includes("g") ? pattern.flags : `${pattern.flags}g`;
    const global = new RegExp(pattern.source, flags);
    for (const match of sentence.matchAll(global)) {
      const raw = match[1] ?? match[0];
      const text = normalizeWording(raw);
      if (!text || match.index == null) continue;
      const relative = match[1] != null ? match[0].toLowerCase().indexOf(match[1].toLowerCase()) : 0;
      found.push({ text, index: match.index + Math.max(relative, 0) });
    }
  }
  const denialMatch = new RegExp(denial.source, denial.flags.includes("i") ? "i" : denial.flags).exec(sentence);
  const pivot = sentence.search(/\bbut\b|\bhowever\b/i);
  return dedupe(
    found
      .filter((item) => {
        if (!denialMatch || denialMatch.index == null) return true;
        const start = denialMatch.index;
        const end = start + denialMatch[0].length;
        const inside = item.index >= start && item.index < end;
        if (!inside) return true;
        return pivot >= 0 && item.index > pivot && start < pivot;
      })
      .map((item) => item.text)
  );
}

function claimCovered(reply: string, saved: string | null | undefined, claim: string) {
  const savedNorm = normalizeWording(saved ?? "");
  if (!savedNorm) return false;
  const savedFold = fold(savedNorm);
  const claimFold = fold(claim);
  if (!savedFold.includes(claimFold)) return false;
  if (!fold(reply).includes(savedFold)) return false;
  if (qualifiersIn(claim).some((word) => !qualifiersIn(savedNorm).includes(word))) return false;
  const savedNumbers = new Set(numbersIn(savedNorm));
  return numbersIn(claim).every((number) => savedNumbers.has(number));
}

export function checkPublicReply(input: { reply: string; reviewCase: ReviewCaseRecord }): CheckResult {
  const reply = input.reply ?? "";
  const reviewCase = input.reviewCase ?? {};
  const replies = approvedReplies(reviewCase.approved_replies);
  const normalized = normalizeWording(reply);
  const matched = replies.find((item) => normalizeWording(item) === normalized) ?? null;
  const violations: Violation[] = [];
  const push = (violation: Violation) => {
    if (violations.some((existing) => existing.kind === violation.kind && existing.detail === violation.detail && existing.excerpt === violation.excerpt)) return;
    if (violations.length < 20) violations.push(violation);
  };

  if (reviewCase.status !== "OPEN") {
    push({
      kind: "closed_case",
      detail: "This case is closed, so it does not authorize a public reply.",
      excerpt: excerpt(normalized || reply)
    });
  }

  if (!matched) {
    push({
      kind: "unapproved_wording",
      detail: "Outgoing reply does not match a stored approved reply for this case.",
      excerpt: excerpt(normalized || reply)
    });
  }

  const refundClaims = preferLonger(sentences(reply).flatMap((sentence) => collectClaims(sentence, REFUND_PATTERNS, REFUND_DENIAL)));
  const replacementClaims = preferLonger(sentences(reply).flatMap((sentence) => collectClaims(sentence, REPLACEMENT_PATTERNS, REPLACEMENT_DENIAL)));
  const timelineClaims = preferLonger(sentences(reply).flatMap((sentence) => collectClaims(sentence, TIMELINE_PATTERNS, TIMELINE_DENIAL)));

  for (const claim of refundClaims) {
    if (claimCovered(reply, reviewCase.refund_wording, claim)) continue;
    push({
      kind: "unapproved_refund",
      detail: "Outgoing reply offers a refund that is not saved on this case.",
      excerpt: excerpt(claim)
    });
  }
  for (const claim of replacementClaims) {
    if (claimCovered(reply, reviewCase.replacement_wording, claim)) continue;
    push({
      kind: "unapproved_replacement",
      detail: "Outgoing reply offers a replacement that is not saved on this case.",
      excerpt: excerpt(claim)
    });
  }
  for (const claim of timelineClaims) {
    if (claimCovered(reply, reviewCase.timeline_wording, claim)) continue;
    push({
      kind: "unapproved_timeline",
      detail: "Outgoing reply states a timeline that is not saved on this case.",
      excerpt: excerpt(claim)
    });
  }

  return {
    verdict: violations.length ? "rejected" : "approved",
    matched_reply: matched,
    violations
  };
}
