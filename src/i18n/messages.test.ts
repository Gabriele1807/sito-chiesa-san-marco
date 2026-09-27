import { describe, it, expect } from "vitest";
import it_ from "../messages/it.json";
import ar from "../messages/ar.json";

type Tree = { [key: string]: string | Tree };

function flatten(tree: Tree, prefix = ""): Record<string, string> {
  return Object.entries(tree).reduce<Record<string, string>>((acc, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    return typeof value === "string"
      ? { ...acc, [path]: value }
      : { ...acc, ...flatten(value, path) };
  }, {});
}

const itMessages = flatten(it_ as Tree);
const arMessages = flatten(ar as Tree);

describe("messaggi i18n", () => {
  it("defines the same keys in Italian and Arabic", () => {
    const missingInAr = Object.keys(itMessages).filter((k) => !(k in arMessages));
    const missingInIt = Object.keys(arMessages).filter((k) => !(k in itMessages));
    expect({ missingInAr, missingInIt }).toEqual({ missingInAr: [], missingInIt: [] });
  });

  it("never puts a straight apostrophe right before a tag or placeholder (ICU would print it literally)", () => {
    const offending = Object.entries({ ...itMessages, ...arMessages })
      .filter(([, text]) => /'[<{]/.test(text))
      .map(([key]) => key);
    expect(offending).toEqual([]);
  });
});
