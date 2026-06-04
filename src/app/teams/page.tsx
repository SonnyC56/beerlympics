"use client";

import Link from "next/link";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { useIdentity } from "@/lib/identity";
import {
  EmptyState,
  Sheet,
  Spinner,
  useAction,
} from "@/components/primitives";
import { TeamCard, type TeamCardTeam } from "@/components/TeamCard";
import { ColorPicker, EmojiPicker } from "@/components/EmojiColorPicker";
import { Icon, Mascot } from "@/components/Icon";
import { COLOR_TOKENS, colorHex } from "@/lib/teamColors";

export default function TeamsPage() {
  const identity = useIdentity();
  const teams = useQuery(api.teams.list, {}) as TeamCardTeam[] | undefined;
  const event = useQuery(api.events.get, {});
  const mine = useQuery(
    api.rsvp.mine,
    identity.deviceId ? { deviceId: identity.deviceId } : "skip",
  );
  const run = useAction();

  const leave = useMutation(api.teams.leave);
  const join = useMutation(api.teams.join);

  const [createOpen, setCreateOpen] = useState(false);
  const [editTeam, setEditTeam] = useState<TeamCardTeam | null>(null);

  if (teams === undefined) return <Spinner label="Loading the squads…" />;

  // Max players per team (counts the captain); host-set, defaults to 3.
  const cap = event?.settings?.maxTeamSize ?? 3;

  // `mine` is undefined while loading, null if no RSVP/event.
  const hasRsvp = !!mine?.player;
  const myUserId = identity.userId;
  const myTeamId: Id<"teams"> | null = mine?.player?.teamId ?? null;

  // Resolve my team either from rsvp.mine or by scanning rosters (fallback).
  const myTeam =
    teams.find((t) => t._id === myTeamId) ??
    (myUserId
      ? teams.find((t) => t.members.some((m) => m.userId === myUserId))
      : undefined) ??
    null;

  const otherTeams = teams.filter((t) => t._id !== myTeam?._id);
  const amCaptainOfMine =
    !!myTeam && !!myUserId &&
    myTeam.members.some((m) => m.userId === myUserId && m.role === "captain");
  const canEditMine = amCaptainOfMine || identity.isHost;

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl text-medal">Teams</h1>
          <p className="mt-1 text-sm text-white/55">
            {teams.length} {teams.length === 1 ? "squad" : "squads"} in the arena
          </p>
        </div>
        <Icon name="flag" size={36} className="text-medal" />
      </div>

      {/* Create / RSVP CTA */}
      {hasRsvp ? (
        !myTeam ? (
          <button
            className="btn btn-gold flex w-full items-center justify-center gap-2 py-4 text-base"
            onClick={() => setCreateOpen(true)}
          >
            <Icon name="plus" size={16} />
            Create a team
          </button>
        ) : null
      ) : (
        <div className="panel-tight flex items-center justify-between gap-3 p-4">
          <div className="text-sm text-white/70">
            RSVP to create or join a team.
          </div>
          <Link
            href="/rsvp"
            className="btn btn-gold flex shrink-0 items-center gap-1.5 px-4 py-2 text-sm"
          >
            RSVP
            <Icon name="arrowRight" size={14} />
          </Link>
        </div>
      )}

      {/* Your team — pinned */}
      {myTeam && (
        <section className="space-y-2">
          <h2 className="px-1 font-display text-lg text-white/70">Your Team</h2>
          <TeamCard
            team={myTeam}
            highlight
            cap={cap}
            pinnedLabel="Your team"
            action={
              <>
                {canEditMine && (
                  <button
                    className="btn btn-ghost flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm"
                    onClick={() => setEditTeam(myTeam)}
                  >
                    <Icon name="edit" size={14} />
                    Edit
                  </button>
                )}
                <button
                  className="btn btn-ghost flex flex-1 items-center justify-center gap-1.5 px-3 py-2 text-sm text-[var(--color-loss)]"
                  onClick={() =>
                    run(
                      () => leave({ deviceId: identity.deviceId! }),
                      "Left the team.",
                    )
                  }
                  disabled={!identity.deviceId}
                >
                  <Icon name="arrowLeft" size={14} />
                  Leave team
                </button>
              </>
            }
          />
        </section>
      )}

      {/* All other teams */}
      <section className="space-y-3">
        {myTeam && otherTeams.length > 0 && (
          <h2 className="px-1 font-display text-lg text-white/70">
            Other Teams
          </h2>
        )}

        {teams.length === 0 ? (
          <div className="panel">
            <EmptyState
              icon="flag"
              title="No teams yet"
              subtitle={
                hasRsvp
                  ? "Be the first to plant a flag. Create your squad and rally your crew."
                  : "RSVP first, then create the very first team."
              }
              action={
                hasRsvp ? (
                  <button
                    className="btn btn-gold flex items-center justify-center gap-2"
                    onClick={() => setCreateOpen(true)}
                  >
                    <Icon name="plus" size={16} />
                    Create the first team
                  </button>
                ) : (
                  <Link
                    href="/rsvp"
                    className="btn btn-gold flex items-center justify-center gap-2"
                  >
                    <Icon name="beer" size={16} />
                    RSVP
                  </Link>
                )
              }
            />
          </div>
        ) : (
          <div className="grid gap-4">
            {otherTeams.map((team) => (
              <TeamCard
                key={team._id}
                team={team}
                cap={cap}
                action={
                  // Only show Join when the user has RSVP'd and has no team.
                  hasRsvp && !myTeam ? (
                    <button
                      className="btn btn-gold flex w-full items-center justify-center gap-2 px-3 py-2 text-sm"
                      onClick={() =>
                        run(
                          () =>
                            join({
                              deviceId: identity.deviceId!,
                              teamId: team._id,
                            }),
                          `Joined ${team.name}!`,
                        )
                      }
                      disabled={!identity.deviceId || team.members.length >= cap}
                    >
                      {team.members.length >= cap ? (
                        <>Team full ({team.members.length}/{cap})</>
                      ) : (
                        <>
                          <Icon name="plus" size={14} />
                          Join this team
                        </>
                      )}
                    </button>
                  ) : !hasRsvp ? (
                    <Link
                      href="/rsvp"
                      className="btn btn-ghost w-full px-3 py-2 text-sm"
                    >
                      RSVP to join
                    </Link>
                  ) : null
                }
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer hint when on a team already */}
      {myTeam && teams.length > 1 && (
        <p className="px-1 text-center text-xs text-white/35">
          Leave your team to switch to another squad.
        </p>
      )}

      <TeamFormSheet
        open={createOpen}
        mode="create"
        onClose={() => setCreateOpen(false)}
      />
      {editTeam && (
        <TeamFormSheet
          open={!!editTeam}
          mode="edit"
          team={editTeam}
          onClose={() => setEditTeam(null)}
        />
      )}
    </div>
  );
}

// ── Create / edit team sheet ──────────────────────────────────────────────────
function TeamFormSheet({
  open,
  mode,
  team,
  onClose,
}: {
  open: boolean;
  mode: "create" | "edit";
  team?: TeamCardTeam;
  onClose: () => void;
}) {
  const identity = useIdentity();
  const run = useAction();
  const create = useMutation(api.teams.create);
  const update = useMutation(api.teams.update);

  const [name, setName] = useState(team?.name ?? "");
  const [theme, setTheme] = useState(team?.theme ?? "");
  const [motto, setMotto] = useState(team?.motto ?? "");
  const [color, setColor] = useState(team?.color ?? COLOR_TOKENS[0]);
  const [emoji, setEmoji] = useState(team?.emoji ?? "lion");

  const valid = name.trim().length > 0;

  async function submit() {
    if (!identity.deviceId || !valid) return;
    if (mode === "create") {
      const ok = await run(
        () =>
          create({
            deviceId: identity.deviceId!,
            name: name.trim(),
            theme: theme.trim() || undefined,
            motto: motto.trim() || undefined,
            color,
            emoji,
          }),
        `${name.trim()} entered the arena!`,
      );
      if (ok) onClose();
    } else if (team) {
      const ok = await run(
        () =>
          update({
            deviceId: identity.deviceId!,
            teamId: team._id,
            patch: {
              name: name.trim(),
              theme: theme.trim(),
              motto: motto.trim(),
              color,
              emoji,
            },
          }),
        "Team updated!",
      );
      if (ok) onClose();
    }
  }

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={mode === "create" ? "Create a Team" : "Edit Team"}
    >
      <div className="space-y-5">
        {/* Live preview */}
        <div className="flex items-center gap-3 rounded-2xl bg-white/4 p-3">
          <span
            className="flex h-12 w-12 items-center justify-center rounded-xl"
            style={{
              background: `${colorHex(color)}1f`,
              border: `1px solid ${colorHex(color)}66`,
            }}
          >
            <Mascot name={emoji} size={26} />
          </span>
          <div className="min-w-0">
            <div className="truncate font-display text-xl text-white">
              {name.trim() || "Team name"}
            </div>
            {(theme || motto) && (
              <div className="truncate text-xs text-white/55">
                {theme}
                {theme && motto ? " · " : ""}
                {motto ? `“${motto}”` : ""}
              </div>
            )}
          </div>
        </div>

        <FormField label="Team name">
          <input
            className="field"
            placeholder="The Hop Stars"
            value={name}
            maxLength={28}
            onChange={(e) => setName(e.target.value)}
            autoFocus
          />
        </FormField>

        <div className="grid grid-cols-1 gap-4">
          <FormField label="Theme (optional)">
            <input
              className="field"
              placeholder="Pirates, neon, retro…"
              value={theme}
              maxLength={32}
              onChange={(e) => setTheme(e.target.value)}
            />
          </FormField>
          <FormField label="Motto (optional)">
            <input
              className="field"
              placeholder="Sip happens."
              value={motto}
              maxLength={48}
              onChange={(e) => setMotto(e.target.value)}
            />
          </FormField>
        </div>

        <FormField label={`Color`}>
          <ColorPicker value={color} onChange={setColor} />
        </FormField>

        <FormField label="Team mascot">
          <EmojiPicker value={emoji} onChange={setEmoji} />
        </FormField>

        <button
          className="btn btn-gold w-full"
          disabled={!valid || !identity.deviceId}
          onClick={submit}
        >
          <span className="flex items-center justify-center gap-2">
            <Icon name={mode === "create" ? "flag" : "save"} size={16} />
            {mode === "create" ? "Create team" : "Save changes"}
          </span>
        </button>
      </div>
    </Sheet>
  );
}

function FormField({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-white/70">
        {label}
      </label>
      {children}
    </div>
  );
}
