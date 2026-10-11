import { describe, expect, it } from "vitest";
import { extractVariables, fillVariables } from "@/lib/variables";

describe("extractVariables", () => {
  it("returns unique names in order of first appearance", () => {
    expect(extractVariables("Write in {{jezyk}} about {{temat}} in {{jezyk}}")).toEqual([
      "jezyk",
      "temat",
    ]);
  });

  it("supports spaces inside braces and unicode letters", () => {
    expect(extractVariables("{{ ton }} i {{długość}}")).toEqual(["ton", "długość"]);
  });

  it("ignores malformed placeholders", () => {
    expect(extractVariables("{single} {{}} {{ two words }}")).toEqual([]);
  });
});

describe("fillVariables", () => {
  it("replaces every occurrence of a variable", () => {
    expect(fillVariables("{{a}} and {{a}}", { a: "x" })).toBe("x and x");
  });

  it("keeps placeholders without a value", () => {
    expect(fillVariables("{{a}} {{b}}", { a: "x", b: "" })).toBe("x {{b}}");
  });

  it("does not interpret replacement patterns in values", () => {
    expect(fillVariables("{{a}}", { a: "$& $1" })).toBe("$& $1");
  });
});
