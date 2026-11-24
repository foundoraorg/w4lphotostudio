import { describe, expect, it } from "vitest";
import { DEFAULT_PRICING_CONFIG } from "./config";
import { calcEstimate, getPeopleBand, normaliseEdits, type EstimateInput } from "./pricing";

const cfg = DEFAULT_PRICING_CONFIG;

/** A plain Studio Portrait: 7,500 KES, 1 h, ten edits included. */
const baseInput: EstimateInput = {
  basePrice: 7500,
  includedEdits: 10,
  durationId: "base",
  people: 1,
  edits: 10,
  addOnIds: [],
  locationId: "studio",
  rush: false,
};

const price = (patch: Partial<EstimateInput> = {}) => calcEstimate({ ...baseInput, ...patch }, cfg);

describe("calcEstimate — base price", () => {
  it("returns the base price with no multipliers or extras", () => {
    const estimate = price();
    expect(estimate.subtotal).toBe(7500);
    expect(estimate.total).toBe(7500);
    expect(estimate.deposit).toBe(2250);
    expect(estimate.lines).toEqual([{ id: "base", label: "Session base", amount: 7500 }]);
  });

  it("always deposits 30% of the total, rounded", () => {
    // 7,500 x 1.25 = 9,375; 30% = 2,812.5 -> 2,813
    const estimate = price({ durationId: "plus30" });
    expect(estimate.total).toBe(9375);
    expect(estimate.deposit).toBe(2813);
  });

  it("rounds the deposit once, from the rounded total", () => {
    const estimate = price({ locationId: "beach", edits: 20 });
    // 7,500 + 3,500 travel + 10 x 300 = 14,000
    expect(estimate.total).toBe(14000);
    expect(estimate.deposit).toBe(4200);
  });
});

describe("calcEstimate — duration factors", () => {
  it("applies +30 min (1.25), +1 h (1.5), half day (2.5) and full day (4.0)", () => {
    expect(price({ durationId: "plus30" }).total).toBe(9375);
    expect(price({ durationId: "plus60" }).total).toBe(11250);
    expect(price({ durationId: "halfDay" }).total).toBe(18750);
    expect(price({ durationId: "fullDay" }).total).toBe(30000);
  });

  it("falls back to the base duration for an unknown id", () => {
    const estimate = price({ durationId: "nonsense" });
    expect(estimate.duration.id).toBe("base");
    expect(estimate.total).toBe(7500);
  });
});

describe("calcEstimate — people factors", () => {
  it("applies 1.0, 1.1, 1.25, 1.5 and 1.8 by band", () => {
    expect(price({ people: 1 }).total).toBe(7500);
    expect(price({ people: 2 }).total).toBe(8250);
    expect(price({ people: 3 }).total).toBe(9375);
    expect(price({ people: 5 }).total).toBe(9375);
    expect(price({ people: 6 }).total).toBe(11250);
    expect(price({ people: 10 }).total).toBe(11250);
    expect(price({ people: 11 }).total).toBe(13500);
    expect(price({ people: 40 }).total).toBe(13500);
  });

  it("maps bands inclusively and clamps bad input to one person", () => {
    expect(getPeopleBand(0, cfg).id).toBe("one");
    expect(getPeopleBand(-3, cfg).id).toBe("one");
    expect(getPeopleBand(Number.NaN, cfg).id).toBe("one");
    expect(getPeopleBand(2, cfg).id).toBe("two");
    expect(getPeopleBand(4, cfg).factor).toBe(1.25);
  });

  it("combines duration and people factors multiplicatively", () => {
    // 7,500 x 1.5 x 1.1 = 12,375
    const estimate = price({ durationId: "plus60", people: 2 });
    expect(estimate.total).toBe(12375);
    expect(estimate.lines.find((l) => l.id === "duration")?.amount).toBe(3750);
    expect(estimate.lines.find((l) => l.id === "people")?.amount).toBe(1125);
  });
});

describe("calcEstimate — edits", () => {
  it("charges 300 KES per edit beyond the ten included", () => {
    expect(price({ edits: 10 }).subtotal).toBe(7500);
    expect(price({ edits: 20 }).subtotal).toBe(10500);
    expect(price({ edits: 30 }).subtotal).toBe(13500);
    expect(price({ edits: 50 }).subtotal).toBe(19500);
  });

  it("never credits edits below the included amount", () => {
    expect(price({ edits: 0 }).subtotal).toBe(7500);
    expect(price({ edits: 4 }).subtotal).toBe(7500);
    expect(price({ edits: -10 }).subtotal).toBe(7500);
  });

  it("respects a session-specific included amount", () => {
    const estimate = price({ edits: 20, includedEdits: 20 });
    expect(estimate.subtotal).toBe(7500);
    expect(estimate.extraEdits).toBe(0);
  });
});

describe("calcEstimate — add-ons and location", () => {
  it("sums every selected add-on once", () => {
    const estimate = price({ addOnIds: ["hmua", "reel"] });
    expect(estimate.subtotal).toBe(7500 + 6000 + 10000);
    expect(estimate.addOns).toHaveLength(2);
    // duplicates are ignored
    expect(price({ addOnIds: ["hmua", "hmua"] }).subtotal).toBe(13500);
  });

  it("ignores unknown add-on ids", () => {
    expect(price({ addOnIds: ["not-real"] }).total).toBe(7500);
  });

  it("adds the exact location fee, with studio at zero", () => {
    expect(price({ locationId: "studio" }).subtotal).toBe(7500);
    expect(price({ locationId: "watamu" }).subtotal).toBe(10500);
    expect(price({ locationId: "kilifi" }).subtotal).toBe(11500);
    expect(price({ locationId: "malindi" }).subtotal).toBe(12500);
    expect(price({ locationId: "mombasa" }).subtotal).toBe(13500);
    expect(price({ locationId: "beach" }).subtotal).toBe(11000);
  });

  it("falls back to the studio for an unknown location", () => {
    const estimate = price({ locationId: "atlantis" });
    expect(estimate.location.id).toBe("studio");
    expect(estimate.lines.some((l) => l.id === "location")).toBe(false);
  });
});

describe("calcEstimate — rush", () => {
  it("multiplies the subtotal by 1.25 when rush is on", () => {
    const estimate = price({ rush: true });
    expect(estimate.subtotal).toBe(7500);
    expect(estimate.rushAmount).toBe(1875);
    expect(estimate.total).toBe(9375);
    expect(estimate.deposit).toBe(2813);
  });

  it("applies rush after extras are added", () => {
    // 7,500 + 10 extra edits (3,000) + 6,000 + 8,000 + 3,500 travel = 28,000
    // 28,000 x 1.25 = 35,000; 30% deposit = 10,500
    const estimate = price({ rush: true, addOnIds: ["hmua", "prints"], locationId: "beach", edits: 20 });
    expect(estimate.subtotal).toBe(28000);
    expect(estimate.total).toBe(35000);
    expect(estimate.deposit).toBe(10500);
  });
});

describe("calcEstimate — full breakdown", () => {
  it("keeps lines summing to the subtotal and deposit at 30% of total", () => {
    const estimate = price({
      durationId: "plus60",
      people: 2,
      edits: 50,
      addOnIds: ["hmua", "backdrop"],
      locationId: "beach",
      rush: true,
    });
    expect(estimate.lines.reduce((n, l) => n + l.amount, 0)).toBe(estimate.subtotal);
    expect(estimate.subtotal).toBe(35375);
    expect(estimate.total).toBe(44219);
    expect(estimate.deposit).toBe(13266);
  });

  it("honours an edited deposit percent and usd rate from config", () => {
    const estimate = calcEstimate(baseInput, { ...cfg, depositPercent: 0.5, usdRate: 150 });
    expect(estimate.deposit).toBe(3750);
  });
});

describe("normaliseEdits", () => {
  it("keeps catalogue options and snaps everything else to the nearest", () => {
    expect(normaliseEdits(20, cfg)).toBe(20);
    expect(normaliseEdits(11, cfg)).toBe(10);
    expect(normaliseEdits(48, cfg)).toBe(50);
    expect(normaliseEdits(999, cfg)).toBe(50);
    expect(normaliseEdits(-5, cfg)).toBe(10);
  });
});
