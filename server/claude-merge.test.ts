import { describe, expect, it } from "vitest";
import { selectRecommendations } from "./recommendation-select.js";
import type { Recommendation } from "./types.js";

/**
 * Mirrors mergeClaudeWithLocal in analysis.ts: Claude's wording wins, but a local
 * high-priority finding in a category Claude ignored entirely is added back.
 * Kept as a separate spec because the merge rule is the part that can silently
 * drop a proven finding.
 */
function merge(claude: Recommendation[], local: Recommendation[]) {
  const covered = new Set(claude.map((rec) => rec.category));
  const gaps = local.filter(
    (rec) => rec.priority === "high" && !covered.has(rec.category),
  );
  return selectRecommendations([...claude, ...gaps], { limit: 4 });
}

function rec(
  category: Recommendation["category"],
  priority: Recommendation["priority"],
  title: string,
): Recommendation {
  return { category, priority, title, description: `${title} description` };
}

describe("merging Claude output with local rules", () => {
  it("adds back a high-priority finding from a category Claude ignored", () => {
    const claude = [
      rec("recovery", "high", "Belastung zurückfahren"),
      rec("training", "medium", "Lockere Einheiten einplanen"),
    ];
    const local = [
      rec("general", "high", "Protein unter Bedarf"),
      rec("recovery", "high", "Niedrige Trainingsbereitschaft"),
    ];

    const merged = merge(claude, local);

    expect(merged.some((entry) => entry.title === "Protein unter Bedarf")).toBe(
      true,
    );
    // Recovery was already covered by Claude – no second opinion on the same topic.
    expect(
      merged.some((entry) => entry.title === "Niedrige Trainingsbereitschaft"),
    ).toBe(false);
  });

  it("leaves Claude alone when every domain is covered", () => {
    const claude = [
      rec("recovery", "high", "A"),
      rec("training", "high", "B"),
      rec("general", "high", "C"),
    ];
    const local = [rec("general", "high", "Protein unter Bedarf")];

    const merged = merge(claude, local);

    expect(merged.map((entry) => entry.title)).toEqual(["A", "B", "C"]);
  });

  it("ignores local medium and low findings", () => {
    const claude = [rec("recovery", "high", "A")];
    const local = [
      rec("recovery", "medium", "Flüssigkeit auffüllen"),
      rec("performance", "low", "VO₂max steigern"),
    ];

    expect(merge(claude, local).map((entry) => entry.title)).toEqual(["A"]);
  });

  it("keeps the result within the four-slot limit", () => {
    const claude = [
      rec("recovery", "high", "A"),
      rec("recovery", "medium", "B"),
      rec("training", "medium", "C"),
      rec("performance", "low", "D"),
    ];
    const local = [rec("general", "high", "Protein unter Bedarf")];

    const merged = merge(claude, local);

    expect(merged).toHaveLength(4);
    expect(merged.some((entry) => entry.title === "Protein unter Bedarf")).toBe(
      true,
    );
  });
});
