"use client";

import { useState } from "react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/field";

type FieldType = "TEXT" | "NUMBER" | "SELECT";

function FieldInput({
  cardId,
  fieldDefinitionId,
  fieldType,
  options,
  savedValue,
  onSave,
}: {
  cardId: string;
  fieldDefinitionId: string;
  fieldType: FieldType;
  options: string[];
  savedValue: string | null;
  onSave: (value: string | null) => void;
}) {
  // "Adjust state during render" (not useEffect) to re-sync the draft
  // when we're now looking at a different card's value for this same
  // field definition — keyed on cardId too, since def.id alone doesn't
  // change when switching between two cards of the same card type (this
  // component instance gets reused, not remounted).
  const [draft, setDraft] = useState(savedValue ?? "");
  const [syncedKey, setSyncedKey] = useState(`${cardId}:${fieldDefinitionId}`);
  const key = `${cardId}:${fieldDefinitionId}`;
  if (key !== syncedKey) {
    setSyncedKey(key);
    setDraft(savedValue ?? "");
  }

  if (fieldType === "SELECT") {
    return (
      <Select
        value={draft}
        onChange={(e) => {
          setDraft(e.target.value);
          onSave(e.target.value || null);
        }}
      >
        <option value="">—</option>
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {opt}
          </option>
        ))}
      </Select>
    );
  }

  return (
    <Input
      type={fieldType === "NUMBER" ? "number" : "text"}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== (savedValue ?? "")) onSave(draft || null);
      }}
    />
  );
}

export function CustomFieldsSection({ cardId, cardTypeId }: { cardId: string; cardTypeId: string | null }) {
  const utils = trpc.useUtils();
  const { data: definitions } = trpc.customField.listDefinitions.useQuery(
    { cardTypeId: cardTypeId ?? "" },
    { enabled: !!cardTypeId },
  );
  const { data: values } = trpc.customField.listValues.useQuery({ cardId });
  const setValue = trpc.customField.setValue.useMutation({
    onSuccess: () => utils.customField.listValues.invalidate({ cardId }),
  });

  // Wait for values to actually load before rendering — otherwise the
  // draft below would sync against a momentary "no values yet" read for
  // a card whose real values just haven't arrived, not one that truly
  // has none.
  if (!cardTypeId || !definitions || definitions.length === 0 || !values) return null;

  const valueByDefinitionId = new Map((values ?? []).map((v) => [v.fieldDefinitionId, v.value]));

  return (
    <div className="grid grid-cols-2 gap-3 text-sm">
      {definitions.map((def) => (
        <div key={def.id} className={def.fieldType === "SELECT" ? "" : "col-span-2"}>
          <Label>{def.name}</Label>
          <FieldInput
            cardId={cardId}
            fieldDefinitionId={def.id}
            fieldType={def.fieldType as FieldType}
            options={Array.isArray(def.options) ? (def.options as string[]) : []}
            savedValue={valueByDefinitionId.get(def.id) ?? null}
            onSave={(value) => setValue.mutate({ cardId, fieldDefinitionId: def.id, value })}
          />
        </div>
      ))}
    </div>
  );
}
