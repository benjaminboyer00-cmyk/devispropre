import { Plan } from "@/generated/prisma/client";
import { prisma } from "./db";

export interface AccountContext {
  workspaceUserId: string;
  plan: Plan;
  isTeamMember: boolean;
  isTeamOwner: boolean;
  teamId: string | null;
}

export async function getAccountContext(userId: string): Promise<AccountContext> {
  const membership = await prisma.teamMember.findFirst({
    where: { userId, status: "ACTIVE" },
    include: {
      team: {
        include: {
          owner: { select: { id: true, plan: true } },
        },
      },
    },
  });

  if (membership) {
    return {
      workspaceUserId: membership.team.ownerId,
      plan: membership.team.owner.plan,
      isTeamMember: true,
      isTeamOwner: false,
      teamId: membership.teamId,
    };
  }

  const user = await prisma.user.findFirst({
    where: { id: userId, deletedAt: null },
    select: {
      id: true,
      plan: true,
      teamOwned: { select: { id: true } },
    },
  });

  if (!user) {
    throw new Error("Utilisateur introuvable");
  }

  return {
    workspaceUserId: user.id,
    plan: user.plan,
    isTeamMember: false,
    isTeamOwner: user.plan === Plan.PRO && !!user.teamOwned,
    teamId: user.teamOwned?.id ?? null,
  };
}

export async function ensureProTeam(ownerId: string) {
  const existing = await prisma.team.findUnique({ where: { ownerId } });
  if (existing) return existing;
  return prisma.team.create({ data: { ownerId, maxMembers: 5 } });
}

export async function acceptTeamInvites(email: string, userId: string) {
  const pending = await prisma.teamMember.findMany({
    where: {
      email: email.toLowerCase(),
      status: "PENDING",
      userId: null,
    },
    orderBy: { invitedAt: "asc" },
    take: 1,
  });

  if (pending.length === 0) return;

  const invite = pending[0]!;

  try {
    await prisma.teamMember.update({
      where: { id: invite.id },
      data: {
        userId,
        status: "ACTIVE",
        acceptedAt: new Date(),
      },
    });
  } catch {
    /* conflit userId unique — une autre équipe a déjà été acceptée */
  }
}
