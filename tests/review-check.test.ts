import { describe, expect, it } from "vitest";
import { checkPublicReply, type ReviewCaseRecord } from "../src/lib/review-check.js";

function reviewCase(overrides: Partial<ReviewCaseRecord> = {}): ReviewCaseRecord {
  return {
    review_text: "The soup arrived cold.",
    approved_replies: ["Thank you for your review. We are sorry the soup arrived cold."],
    refund_wording: null,
    replacement_wording: null,
    timeline_wording: null,
    status: "OPEN",
    ...overrides
  };
}

const thanks = "Thank you for your review. We are sorry the soup arrived cold.";

describe("checkPublicReply", () => {
  it("approves a reply that matches stored wording and offers nothing extra", () => {
    const result = checkPublicReply({ reply: thanks, reviewCase: reviewCase() });
    expect(result.verdict).toBe("approved");
    expect(result.matched_reply).toBe(thanks);
    expect(result.violations).toEqual([]);
  });

  it("approves the same wording when only whitespace differs", () => {
    const result = checkPublicReply({
      reply: "Thank you for your review.\nWe are sorry the soup arrived cold.",
      reviewCase: reviewCase()
    });
    expect(result.verdict).toBe("approved");
  });

  it("rejects a paraphrase that does not match a stored reply", () => {
    const result = checkPublicReply({
      reply: "Thanks for writing in. Sorry about the cold soup.",
      reviewCase: reviewCase()
    });
    expect(result.verdict).toBe("rejected");
    expect(result.violations.map((item) => item.kind)).toEqual(["unapproved_wording"]);
  });

  it("rejects an added sentence even when the stored reply is included", () => {
    const result = checkPublicReply({
      reply: `${thanks} We hope you visit again.`,
      reviewCase: reviewCase()
    });
    expect(result.violations.map((item) => item.kind)).toContain("unapproved_wording");
  });

  it("rejects a refund that is not saved on the case", () => {
    const reply = "Thank you for your review. We will issue a refund of the soup.";
    const result = checkPublicReply({
      reply,
      reviewCase: reviewCase({ approved_replies: [reply] })
    });
    expect(result.verdict).toBe("rejected");
    expect(result.violations.map((item) => item.kind)).toEqual(["unapproved_refund"]);
  });

  it("approves a refund only when the saved wording is the offer in the reply", () => {
    const reply = "Thank you for your review. We will issue a refund of the soup.";
    const result = checkPublicReply({
      reply,
      reviewCase: reviewCase({
        approved_replies: [reply],
        refund_wording: "a refund of the soup"
      })
    });
    expect(result.verdict).toBe("approved");
  });

  it("rejects a stronger refund than the wording saved on the case", () => {
    const reply = "Thank you for your review. We will issue a full refund.";
    const result = checkPublicReply({
      reply,
      reviewCase: reviewCase({
        approved_replies: [reply],
        refund_wording: "a refund of the soup"
      })
    });
    expect(result.violations.map((item) => item.kind)).toContain("unapproved_refund");
  });

  it("does not treat a denial as a refund offer", () => {
    const reply = "Thank you for your review. We cannot issue a refund for this order.";
    const result = checkPublicReply({
      reply,
      reviewCase: reviewCase({ approved_replies: [reply] })
    });
    expect(result.verdict).toBe("approved");
  });

  it("rejects a replacement that is not saved on the case", () => {
    const reply = "Thank you for your review. We will send a replacement.";
    const result = checkPublicReply({
      reply,
      reviewCase: reviewCase({ approved_replies: [reply] })
    });
    expect(result.violations.map((item) => item.kind)).toEqual(["unapproved_replacement"]);
  });

  it("approves a replacement when that wording is saved on the case", () => {
    const reply = "Thank you for your review. We will send a replacement of the same item.";
    const result = checkPublicReply({
      reply,
      reviewCase: reviewCase({
        approved_replies: [reply],
        replacement_wording: "a replacement of the same item"
      })
    });
    expect(result.verdict).toBe("approved");
  });

  it("rejects a timeline that is not saved on the case", () => {
    const reply = "Thank you for your review. We will follow up within 5 business days.";
    const result = checkPublicReply({
      reply,
      reviewCase: reviewCase({ approved_replies: [reply] })
    });
    expect(result.violations.map((item) => item.kind)).toEqual(["unapproved_timeline"]);
  });

  it("approves a timeline only when the saved wording covers it", () => {
    const reply = "Thank you for your review. We will follow up within 5 business days.";
    const approved = checkPublicReply({
      reply,
      reviewCase: reviewCase({
        approved_replies: [reply],
        timeline_wording: "within 5 business days"
      })
    });
    expect(approved.verdict).toBe("approved");

    const different = "Thank you for your review. We will follow up within 2 days.";
    const rejected = checkPublicReply({
      reply: different,
      reviewCase: reviewCase({
        approved_replies: [different],
        timeline_wording: "within 5 business days"
      })
    });
    expect(rejected.violations.map((item) => item.kind)).toContain("unapproved_timeline");
  });

  it("rejects tomorrow when the saved timeline is a different phrase", () => {
    const reply = "Thank you for your review. We will reply by tomorrow.";
    const result = checkPublicReply({
      reply,
      reviewCase: reviewCase({
        approved_replies: [reply],
        timeline_wording: "within 5 business days"
      })
    });
    expect(result.violations.map((item) => item.kind)).toContain("unapproved_timeline");
  });

  it("rejects a reply that offers an unsaved refund and an unsaved timeline together", () => {
    const reply = "We will issue a refund of the soup and reply within 2 days.";
    const result = checkPublicReply({
      reply,
      reviewCase: reviewCase({ approved_replies: [reply] })
    });
    expect(result.violations.map((item) => item.kind).sort()).toEqual(["unapproved_refund", "unapproved_timeline"]);
  });

  it("refuses a closed case even when the wording matches", () => {
    const result = checkPublicReply({
      reply: thanks,
      reviewCase: reviewCase({ status: "CLOSED" })
    });
    expect(result.verdict).toBe("rejected");
    expect(result.violations.map((item) => item.kind)).toEqual(["closed_case"]);
  });

  it("rejects a reply when the case has no stored approved reply", () => {
    const result = checkPublicReply({
      reply: thanks,
      reviewCase: reviewCase({ approved_replies: [] })
    });
    expect(result.violations.map((item) => item.kind)).toEqual(["unapproved_wording"]);
  });

  it("matches a later stored reply and ignores another case's wording", () => {
    const second = "Thank you for telling us. We appreciate the note.";
    const result = checkPublicReply({
      reply: second,
      reviewCase: reviewCase({ approved_replies: [thanks, second] })
    });
    expect(result.verdict).toBe("approved");
    expect(result.matched_reply).toBe(second);
  });

  it("does not use the word in violation details that public pages avoid", () => {
    const result = checkPublicReply({
      reply: "We will issue a full refund tomorrow and send a replacement.",
      reviewCase: reviewCase({ approved_replies: [] })
    });
    const details = result.violations.map((item) => item.detail).join(" ");
    expect(details.toLowerCase()).not.toMatch(/\bfree\b/);
    expect(details).not.toMatch(/[$€£]\s*\d/);
  });
});
