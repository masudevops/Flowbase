"use client";

import { useState } from "react";
import { Shield, UserPlus, X, LogOut, Trash2, Mail } from "lucide-react";
import { trpc } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

type Member = {
  id: string;
  userId: string;
  role: "ADMIN" | "MEMBER";
  email: string;
  fullName: string | null;
};

type Invite = {
  id: string;
  organizationId: string;
  email: string;
  role: "ADMIN" | "MEMBER";
  status: "INVITED" | "ACTIVE" | "SUSPENDED";
  invitedById: string;
  token: string;
  expiresAt: Date;
  createdAt: Date;
};

function initialOf(m: Member) {
  return (m.fullName ?? m.email).charAt(0).toUpperCase();
}

export function MembersManager({
  organizationId,
  currentUserId,
  currentUserRole,
  initialMembers,
  initialInvites,
}: {
  organizationId: string;
  currentUserId: string;
  currentUserRole: "ADMIN" | "MEMBER";
  initialMembers: Member[];
  initialInvites: Invite[];
}) {
  const utils = trpc.useUtils();
  const isAdmin = currentUserRole === "ADMIN";

  const { data: members } = trpc.membership.list.useQuery(
    { organizationId },
    { initialData: initialMembers },
  );
  const { data: invites } = trpc.membership.listInvites.useQuery(
    { organizationId },
    { initialData: initialInvites, enabled: isAdmin },
  );

  const [error, setError] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"ADMIN" | "MEMBER">("MEMBER");

  function refresh() {
    utils.membership.list.invalidate({ organizationId });
    utils.membership.listInvites.invalidate({ organizationId });
  }

  const invite = trpc.membership.invite.useMutation({
    onSuccess: () => {
      setInviteEmail("");
      setError(null);
      refresh();
    },
    onError: (err) => setError(err.message),
  });

  const cancelInvite = trpc.membership.cancelInvite.useMutation({ onSuccess: refresh });
  const updateRole = trpc.membership.updateRole.useMutation({
    onSuccess: refresh,
    onError: (err) => setError(err.message),
  });
  const removeMember = trpc.membership.remove.useMutation({
    onSuccess: refresh,
    onError: (err) => setError(err.message),
  });

  return (
    <div className="space-y-8">
      {isAdmin && (
        <div className="rounded-lg border border-[#D3DBD8] bg-white p-4 dark:border-[#23414F] dark:bg-[#0F2A3D]">
          <h2 className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">
            <UserPlus className="h-4 w-4" />
            Invite someone
          </h2>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              invite.mutate({ organizationId, email: inviteEmail, role: inviteRole });
            }}
            className="flex flex-wrap items-center gap-2"
          >
            <Input
              type="email"
              required
              placeholder="email@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="max-w-xs"
            />
            <Select
              value={inviteRole}
              onChange={(e) => setInviteRole(e.target.value as "ADMIN" | "MEMBER")}
              className="w-auto"
            >
              <option value="MEMBER">Team member</option>
              <option value="ADMIN">Admin / project manager</option>
            </Select>
            <Button type="submit" className="w-auto" disabled={invite.isPending}>
              {invite.isPending ? "Sending..." : "Send invite"}
            </Button>
          </form>
          {error && <p className="mt-2 text-sm text-[#C1440E] dark:text-[#E8703A]">{error}</p>}
        </div>
      )}

      {isAdmin && invites && invites.length > 0 && (
        <div>
          <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">
            <Mail className="h-4 w-4" />
            Pending invites
          </h2>
          <div className="divide-y divide-[#D3DBD8] rounded-lg border border-[#D3DBD8] bg-white dark:divide-[#23414F] dark:border-[#23414F] dark:bg-[#0F2A3D]">
            {invites.map((inv) => (
              <div key={inv.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                <div>
                  <span className="text-[#14242E] dark:text-[#E7EEF0]">{inv.email}</span>
                  <span className="ml-2 text-xs text-[#55707D] dark:text-[#8FA8B3]">
                    {inv.role === "ADMIN" ? "Admin / project manager" : "Team member"}
                  </span>
                </div>
                <button
                  onClick={() => cancelInvite.mutate({ organizationId, inviteId: inv.id })}
                  className="rounded p-1 text-[#55707D] hover:bg-[#EEF2F0] hover:text-[#C1440E] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E] dark:hover:text-[#E8703A]"
                  aria-label="Cancel invite"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="mb-2 text-sm font-semibold text-[#14242E] dark:text-[#E7EEF0]">
          Members ({members?.length ?? 0})
        </h2>
        <div className="divide-y divide-[#D3DBD8] rounded-lg border border-[#D3DBD8] bg-white dark:divide-[#23414F] dark:border-[#23414F] dark:bg-[#0F2A3D]">
          {members?.map((m) => {
            const isSelf = m.userId === currentUserId;
            return (
              <div key={m.id} className="flex flex-col gap-2.5 px-4 py-2.5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex min-w-0 items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#1D5C8A] text-xs font-medium text-white dark:bg-[#5FB4E0] dark:text-[#0B1F2E]">
                    {initialOf(m)}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-[#14242E] dark:text-[#E7EEF0]">
                      {m.fullName ?? m.email}
                      {isSelf && <span className="ml-1.5 text-xs text-[#55707D] dark:text-[#8FA8B3]">(you)</span>}
                    </p>
                    <p className="truncate text-xs text-[#55707D] dark:text-[#8FA8B3]">{m.email}</p>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2 pl-[38px] sm:pl-0">
                  {isAdmin ? (
                    <Select
                      value={m.role}
                      onChange={(e) =>
                        updateRole.mutate({
                          organizationId,
                          membershipId: m.id,
                          role: e.target.value as "ADMIN" | "MEMBER",
                        })
                      }
                      className="w-auto"
                    >
                      <option value="MEMBER">Team member</option>
                      <option value="ADMIN">Admin / PM</option>
                    </Select>
                  ) : (
                    <span className="flex items-center gap-1 text-xs text-[#55707D] dark:text-[#8FA8B3]">
                      {m.role === "ADMIN" && <Shield className="h-3 w-3" />}
                      {m.role === "ADMIN" ? "Admin / PM" : "Team member"}
                    </span>
                  )}

                  {(isAdmin || isSelf) && (
                    <button
                      onClick={() => {
                        if (confirm(isSelf ? "Leave this workspace?" : `Remove ${m.fullName ?? m.email}?`)) {
                          removeMember.mutate({ organizationId, membershipId: m.id });
                        }
                      }}
                      className="rounded p-1.5 text-[#55707D] hover:bg-[#EEF2F0] hover:text-[#C1440E] dark:text-[#8FA8B3] dark:hover:bg-[#0B1F2E] dark:hover:text-[#E8703A]"
                      aria-label={isSelf ? "Leave workspace" : "Remove member"}
                    >
                      {isSelf ? <LogOut className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
