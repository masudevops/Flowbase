"use client";

import { useState } from "react";
import { UserPlus, Trash2 } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Contact = {
  id: string;
  organizationId: string;
  name: string;
  email: string | null;
  phone: string | null;
  createdAt: Date;
};

export function ContactsManager({
  organizationId,
  initialContacts,
}: {
  organizationId: string;
  initialContacts: Contact[];
}) {
  const utils = trpc.useUtils();
  const { data: contacts } = trpc.contact.list.useQuery(
    { organizationId },
    { initialData: initialContacts },
  );

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  function refresh() {
    utils.contact.list.invalidate({ organizationId });
  }

  const createContact = trpc.contact.create.useMutation({
    onSuccess: () => {
      setName("");
      setEmail("");
      setPhone("");
      refresh();
    },
  });
  const updateContact = trpc.contact.update.useMutation({ onSuccess: refresh });
  const deleteContact = trpc.contact.delete.useMutation({ onSuccess: refresh });

  return (
    <div>
      <h2 className="mb-1 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">
        External contacts
      </h2>
      <p className="mb-3 text-sm text-[#55707D] dark:text-[#8FA8B3]">
        People who can be assigned cards without a Kelbara account — subcontractors, clients,
        vendors.
      </p>

      <div className="rounded-lg border border-[#D3DBD8] bg-white p-4 dark:border-[#23414F] dark:bg-[#0F2A3D]">
        <h3 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">
          <UserPlus className="h-4 w-4" />
          Add a contact
        </h3>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createContact.mutate({
              organizationId,
              name,
              email: email.trim() || null,
              phone: phone.trim() || null,
            });
          }}
          className="flex flex-wrap items-center gap-2"
        >
          <Input
            required
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="max-w-[180px]"
          />
          <Input
            type="email"
            placeholder="Email (optional)"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="max-w-[200px]"
          />
          <Input
            placeholder="Phone (optional)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="max-w-[160px]"
          />
          <Button type="submit" className="w-auto" disabled={createContact.isPending}>
            {createContact.isPending ? "Adding..." : "Add"}
          </Button>
        </form>
        {createContact.error && (
          <p className="mt-2 text-sm text-[#C1440E] dark:text-[#E8703A]">
            {createContact.error.message}
          </p>
        )}
      </div>

      {contacts && contacts.length > 0 && (
        <div className="mt-3 divide-y divide-[#D3DBD8] rounded-lg border border-[#D3DBD8] bg-white dark:divide-[#23414F] dark:border-[#23414F] dark:bg-[#0F2A3D]">
          {contacts.map((c) => (
            <div key={c.id} className="flex items-center gap-2 px-4 py-2.5">
              <input
                defaultValue={c.name}
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value && value !== c.name) {
                    updateContact.mutate({ contactId: c.id, name: value });
                  }
                }}
                className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm font-medium text-[#14242E] hover:border-[#D3DBD8] focus:border-[#D3DBD8] focus:bg-white focus:outline-none dark:text-[#E7EEF0] dark:hover:border-[#23414F] dark:focus:border-[#23414F] dark:focus:bg-[#0B1F2E]"
              />
              <input
                defaultValue={c.email ?? ""}
                placeholder="email"
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value !== (c.email ?? "")) {
                    updateContact.mutate({ contactId: c.id, email: value || null });
                  }
                }}
                className="min-w-0 flex-1 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm text-[#55707D] hover:border-[#D3DBD8] focus:border-[#D3DBD8] focus:bg-white focus:outline-none dark:text-[#8FA8B3] dark:hover:border-[#23414F] dark:focus:border-[#23414F] dark:focus:bg-[#0B1F2E]"
              />
              <input
                defaultValue={c.phone ?? ""}
                placeholder="phone"
                onBlur={(e) => {
                  const value = e.target.value.trim();
                  if (value !== (c.phone ?? "")) {
                    updateContact.mutate({ contactId: c.id, phone: value || null });
                  }
                }}
                className="w-32 shrink-0 rounded-md border border-transparent bg-transparent px-1.5 py-1 text-sm text-[#55707D] hover:border-[#D3DBD8] focus:border-[#D3DBD8] focus:bg-white focus:outline-none dark:text-[#8FA8B3] dark:hover:border-[#23414F] dark:focus:border-[#23414F] dark:focus:bg-[#0B1F2E]"
              />
              <button
                onClick={() => {
                  if (confirm(`Remove ${c.name}?`)) {
                    deleteContact.mutate({ contactId: c.id });
                  }
                }}
                className="shrink-0 rounded p-1.5 text-[#55707D] hover:bg-[#EEF2F0] hover:text-[#C1440E] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E] dark:hover:text-[#E8703A]"
                aria-label="Remove contact"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
