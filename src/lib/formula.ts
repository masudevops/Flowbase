export type FormulaOperator = "+" | "-" | "*" | "/";

export type FormulaOperand =
  | { type: "field"; fieldId: string }
  | { type: "constant"; value: number };

export type Formula = {
  leftFieldId: string;
  operator: FormulaOperator;
  right: FormulaOperand;
};

function toNumber(value: string | null | undefined): number | null {
  if (value === null || value === undefined || value.trim() === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

/// A formula field's value is computed here, at read time, from the
/// current values of the two fields (or field + constant) it
/// references — never cached in CustomFieldValue, so it can't go stale.
/// Deliberately a hand-written switch over 4 operators, not eval/
/// Function — formula definitions are admin-authored data evaluated on
/// every card read, so there's no code-injection surface even in
/// principle. Returns null (not 0) for a missing/non-numeric input or a
/// divide-by-zero, so an incomplete card shows "—" instead of a
/// misleading number.
export function evaluateFormula(
  formula: Formula,
  valuesByFieldId: Map<string, string | null>,
): number | null {
  const left = toNumber(valuesByFieldId.get(formula.leftFieldId));
  const right =
    formula.right.type === "constant" ? formula.right.value : toNumber(valuesByFieldId.get(formula.right.fieldId));

  if (left === null || right === null) return null;

  switch (formula.operator) {
    case "+":
      return left + right;
    case "-":
      return left - right;
    case "*":
      return left * right;
    case "/":
      return right === 0 ? null : left / right;
  }
}
