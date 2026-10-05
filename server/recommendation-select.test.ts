import { describe, expect, it } from "vitest";
import {
  selectRecommendations,
  type FamilyRecommendation,
} from "./recommendation-select.js";
import type { Recommendation } from "./types.js";

function rec(
  category: Recommendation["category"],
  priority: Recommendation["priority"],
  title: string,
  family?: string,
): FamilyRecommendation {
  return {
    category,
    priority,
    title,
    description: `${title} description`,
    family,
  };
}

describe("selectRecommendations", () => {
  it("keeps at most two entries per category", () => {
    const selected = selectRecommendations([
      rec("recovery", "high", "Erholungsphase beachten"),
      rec("recovery", "high", "Niedrige Trainingsbereitschaft"),
      rec("recovery", "high", "Hohe Belastungssteigerung"),
      rec("recovery", "high", "Schlaf verbessern"),
      rec("training", "medium", "Kilometerziel unter Plan"),
      rec("general", "medium", "Protein unter Bedarf"),
    ]);

    expect(selected).toHaveLength(4);
    expect(
      selected.filter((entry) => entry.category === "recovery"),
    ).toHaveLength(2);
    expect(selected.some((entry) => entry.category === "training")).toBe(true);
    expect(selected.some((entry) => entry.category === "general")).toBe(true);
  });

  it("still prefers high priority inside a category", () => {
    const selected = selectRecommendations([
      rec("recovery", "low", "Leichter Hinweis"),
      rec("recovery", "high", "Dringender Hinweis"),
    ]);

    expect(selected[0]?.title).toBe("Dringender Hinweis");
  });

  it("drops duplicates that differ only in punctuation or case", () => {
    const selected = selectRecommendations([
      rec("training", "high", "Lauf-HF senken"),
      rec("training", "medium", "Lauf HF senken!"),
    ]);

    expect(selected).toHaveLength(1);
  });

  it("fills the remaining slots when the quota leaves the list short", () => {
    const selected = selectRecommendations([
      rec("recovery", "high", "A"),
      rec("recovery", "high", "B"),
      rec("recovery", "medium", "C"),
      rec("recovery", "low", "D"),
    ]);

    expect(selected).toHaveLength(4);
    expect(selected.map((entry) => entry.title)).toEqual(["A", "B", "C", "D"]);
  });

  it("keeps only the first entry of a signal family", () => {
    const selected = selectRecommendations([
      rec("recovery", "high", "Belastungssprung erkannt", "acute-fatigue"),
      rec(
        "recovery",
        "high",
        "Niedrige Trainingsbereitschaft",
        "acute-fatigue",
      ),
      rec("recovery", "high", "Schlaf verbessern", "sleep"),
    ]);

    expect(selected.map((entry) => entry.title)).toEqual([
      "Belastungssprung erkannt",
      "Schlaf verbessern",
    ]);
  });

  it("spreads the slots across domains before doubling up on one", () => {
    const selected = selectRecommendations([
      rec("recovery", "high", "Belastungssprung erkannt", "acute-fatigue"),
      rec("recovery", "high", "Schlaf verbessern", "sleep"),
      rec("training", "high", "Trainingsmonotonie hoch", "monotony"),
      rec("training", "high", "Kein Ruhetag", "rest"),
      rec("general", "high", "Protein unter Bedarf", "protein"),
    ]);

    // One per category first, then the second round fills the last slot.
    expect(selected.slice(0, 3).map((entry) => entry.category)).toEqual([
      "recovery",
      "training",
      "general",
    ]);
    expect(selected).toHaveLength(4);
    expect(new Set(selected.map((entry) => entry.category)).size).toBe(3);
  });

  it("does not let a lower priority jump ahead of a higher one", () => {
    const selected = selectRecommendations(
      [
        rec("general", "low", "Nebensache", "a"),
        rec("recovery", "high", "Dringend", "b"),
      ],
      { limit: 1 },
    );

    expect(selected.map((entry) => entry.title)).toEqual(["Dringend"]);
  });

  it("strips the internal family field from the result", () => {
    const [selected] = selectRecommendations([
      rec("training", "high", "T", "monotony"),
    ]);

    expect(selected).toEqual({
      category: "training",
      priority: "high",
      title: "T",
      description: "T description",
    });
  });

  it("respects an explicit limit", () => {
    const selected = selectRecommendations(
      [
        rec("recovery", "high", "A"),
        rec("training", "high", "B"),
        rec("general", "high", "C"),
      ],
      { limit: 2 },
    );

    expect(selected).toHaveLength(2);
  });
});
