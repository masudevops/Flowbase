"use client";

import { useState } from "react";
import { Trash2, Plus } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";

type CardTypeOption = {
  id: string;
  organizationId: string;
  boardId: string;
  name: string;
  color: string;
  icon: string | null;
  isDefault: boolean;
  createdAt: Date;
};
type FieldType = "TEXT" | "NUMBER" | "SELECT";

const FIELD_TYPE_LABEL: Record<FieldType, string> = {
  TEXT: "Text",
  NUMBER: "Number",
  SELECT: "Select",
};

function NewFieldForm({
  organizationId,
  cardTypeId,
  onCreated,
}: {
  organizationId: string;
  cardTypeId: string;
  onCreated: () => void;
}) {
  const createDefinition = trpc.customField.createDefinition.useMutation({
    onSuccess: () => {
      setName("");
      setOptionsText("");
      onCreated();
    },
  });

  const [name, setName] = useState("");
  const [type, setType] = useState<FieldType>("TEXT");
  const [optionsText, setOptionsText] = useState("");

  return (
    <form
      className="mt-2 flex flex-wrap items-center gap-2"
      onSubmit={(e) => {
        e.preventDefault();
        if (!name.trim()) return;
        const options =
          type === "SELECT"
            ? optionsText
                .split(",")
                .map((o) => o.trim())
                .filter(Boolean)
            : undefined;
        if (type === "SELECT" && (!options || options.length === 0)) return;
        createDefinition.mutate({ organizationId, cardTypeId, name: name.trim(), fieldType: type, options });
      }}
    >
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Field name"
        className="w-40"
      />
      <Select value={type} onChange={(e) => setType(e.target.value as FieldType)} className="w-auto">
        {(Object.keys(FIELD_TYPE_LABEL) as FieldType[]).map((t) => (
          <option key={t} value={t}>
            {FIELD_TYPE_LABEL[t]}
          </option>
        ))}
      </Select>
      {type === "SELECT" && (
        <Input
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
          placeholder="Options, comma-separated"
          className="w-56"
        />
      )}
      <Button type="submit" className="flex w-auto items-center gap-1.5" disabled={createDefinition.isPending}>
        <Plus className="h-4 w-4" />
        Add field
      </Button>
      {createDefinition.error && (
        <p className="w-full text-sm text-[#C1440E] dark:text-[#E8703A]">{createDefinition.error.message}</p>
      )}
    </form>
  );
}

function CardTypeFields({ organizationId, cardType }: { organizationId: string; cardType: CardTypeOption }) {
  const utils = trpc.useUtils();
  const { data: definitions } = trpc.customField.listDefinitions.useQuery({ cardTypeId: cardType.id });

  const deleteDefinition = trpc.customField.deleteDefinition.useMutation({
    onSuccess: () => utils.customField.listDefinitions.invalidate({ cardTypeId: cardType.id }),
  });

  return (
    <div className="rounded-md border border-[#D3DBD8] p-3 dark:border-[#23414F]">
      <div className="flex items-center gap-2">
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: cardType.color }} />
        <h3 className="text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">{cardType.name}</h3>
      </div>

      {definitions && definitions.length > 0 && (
        <ul className="mt-2 divide-y divide-[#D3DBD8] dark:divide-[#23414F]">
          {definitions.map((def) => (
            <li key={def.id} className="flex items-center gap-3 py-2 text-sm">
              <span className="flex-1 text-[#14242E] dark:text-[#E7EEF0]">{def.name}</span>
              <span className="text-xs text-[#55707D] dark:text-[#8FA8B3]">
                {FIELD_TYPE_LABEL[def.fieldType as FieldType]}
                {def.fieldType === "SELECT" &&
                  Array.isArray(def.options) &&
                  ` (${(def.options as string[]).join(", ")})`}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (confirm(`Delete "${def.name}"? Any values saved on cards will be lost.`)) {
                    deleteDefinition.mutate({ fieldDefinitionId: def.id });
                  }
                }}
                aria-label={`Delete field ${def.name}`}
                className="text-[#55707D] hover:text-[#C1440E] dark:text-[#8FA8B3] dark:hover:text-[#E8703A]"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
      {definitions && definitions.length === 0 && (
        <p className="mt-2 text-xs text-[#55707D] dark:text-[#8FA8B3]">No custom fields on this type yet.</p>
      )}

      <NewFieldForm
        organizationId={organizationId}
        cardTypeId={cardType.id}
        onCreated={() => utils.customField.listDefinitions.invalidate({ cardTypeId: cardType.id })}
      />
    </div>
  );
}

export function CustomFieldsManager({
  organizationId,
  boardId,
  initialCardTypes,
}: {
  organizationId: string;
  boardId: string;
  initialCardTypes: CardTypeOption[];
}) {
  // Live query (not just the server-rendered prop) so a card type added
  // moments ago in the section right above this one shows up here
  // immediately, instead of needing a page reload.
  const { data: cardTypes } = trpc.cardType.list.useQuery({ boardId }, { initialData: initialCardTypes });

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">Custom fields</h2>
      <p className="mb-3 text-sm text-[#55707D] dark:text-[#8FA8B3]">
        Defined per card type — a field added to one type doesn&apos;t show up on another.
      </p>

      {cardTypes.length === 0 ? (
        <p className="text-sm text-[#55707D] dark:text-[#8FA8B3]">Add a card type first to define fields on it.</p>
      ) : (
        <div className="space-y-3">
          {cardTypes.map((type) => (
            <CardTypeFields key={type.id} organizationId={organizationId} cardType={type} />
          ))}
        </div>
      )}
    </div>
  );
}
