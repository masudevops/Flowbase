import { generateKeyBetween, generateNKeysBetween } from "fractional-indexing";

/// Position for a single new item between two existing positions
/// (either bound may be null: null,null = first item in an empty list;
/// a,null = append after a; null,b = prepend before b).
export function positionBetween(a: string | null, b: string | null): string {
  return generateKeyBetween(a, b);
}

/// Positions for N new items between two existing positions, e.g. when
/// seeding a template's starter columns/card types in one batch.
export function positionsBetween(a: string | null, b: string | null, n: number): string[] {
  return generateNKeysBetween(a, b, n);
}
