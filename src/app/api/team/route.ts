import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  getRequestMeta,
  getTrustedClientIpOrUnknown,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { sendTeamInviteEmail } from "@/lib/email";
import { assertProFeature } from "@/lib/plan-features";
import { ForbiddenError } from "@/lib/errors";
import { ensureProTeam } from "@/lib/account-context";
import { checkRateLimit, teamInviteKey } from "@/lib/rate-limit";

const inviteSchema = z.object({
  email: z.string().email(),
});

export async function GET() {
  const auth = await requireAuth({ skipSubscriptionCheck: true });
  if (auth.error) return auth.error;

  if (!hasPro(auth.plan)) {
    return Response.json({ members: [], maxMembers: 0, canManage: false });
  }

  const team = await prisma.team.findUnique({
    where: { ownerId: auth.workspaceUserId },
    include: {
      members: {
        orderBy: { invitedAt: "asc" },
        include: { user: { select: { id: true, name: true, email: true } } },
      },
    },
  });

  if (!team) {
    return Response.json({
      members: [],
      maxMembers: 5,
      canManage: !auth.isTeamMember && hasPro(auth.plan),
    });
  }

  return Response.json({
    maxMembers: team.maxMembers,
    canManage: !auth.isTeamMember,
    members: team.members.map((m) => ({
      id: m.id,
      email: m.email,
      status: m.status,
      role: m.role,
      name: m.user?.name ?? null,
      invitedAt: m.invitedAt,
      acceptedAt: m.acceptedAt,
    })),
  });
}

function hasPro(plan: string) {
  return plan === "PRO";
}

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    assertProFeature(auth.plan, "Multi-utilisateurs");

    if (auth.isTeamMember) {
      throw new ForbiddenError("Seul le propriétaire du compte Pro peut inviter des membres.");
    }

    await checkRateLimit(teamInviteKey(auth.workspaceUserId), {
      maxAttempts: 20,
      windowMs: 60 * 60 * 1000,
    });

    const { email } = inviteSchema.parse(await request.json());
    const normalized = email.toLowerCase();

    if (normalized === auth.user.email.toLowerCase()) {
      return apiError("Vous ne pouvez pas vous inviter vous-même.");
    }

    const team = await ensureProTeam(auth.user.id);
    const activeCount = await prisma.teamMember.count({
      where: { teamId: team.id, status: { in: ["PENDING", "ACTIVE"] } },
    });

    if (activeCount >= team.maxMembers) {
      return apiError(`Limite de ${team.maxMembers} utilisateurs atteinte.`, 402);
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalized } });
    if (existingUser) {
      const already = await prisma.teamMember.findFirst({
        where: { teamId: team.id, userId: existingUser.id },
      });
      if (already) return apiError("Cet utilisateur fait déjà partie de l'équipe.");
    }

    const member = await prisma.teamMember.upsert({
      where: { teamId_email: { teamId: team.id, email: normalized } },
      create: {
        teamId: team.id,
        email: normalized,
        userId: existingUser?.id ?? null,
        status: existingUser ? "ACTIVE" : "PENDING",
        acceptedAt: existingUser ? new Date() : null,
      },
      update: {},
    });

    if (existingUser && member.status !== "ACTIVE") {
      await prisma.teamMember.update({
        where: { id: member.id },
        data: { userId: existingUser.id, status: "ACTIVE", acceptedAt: new Date() },
      });
    }

    const company = await prisma.company.findUnique({
      where: { userId: auth.user.id },
      select: { raisonSociale: true },
    });

    await sendTeamInviteEmail({
      inviteEmail: normalized,
      ownerName: auth.user.name,
      companyName: company?.raisonSociale ?? auth.user.name,
    });

    await logAudit(
      { userId: auth.workspaceUserId, actorUserId: auth.user.id, ...getRequestMeta(request) },
      {
        action: "CREATE",
        entityType: "team_member",
        entityId: member.id,
        metadata: { email: normalized },
      }
    );

    return Response.json({ ok: true }, { status: 201 });
  } catch (e) {
    return handleServiceError(e);
  }
}

export async function DELETE(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth();
  if (auth.error) return auth.error;

  try {
    assertProFeature(auth.plan, "Multi-utilisateurs");

    if (auth.isTeamMember) {
      throw new ForbiddenError("Seul le propriétaire peut retirer un membre.");
    }

    const memberId = new URL(request.url).searchParams.get("memberId");
    if (!memberId) return apiError("memberId requis");

    const team = await ensureProTeam(auth.user.id);
    const member = await prisma.teamMember.findFirst({
      where: { id: memberId, teamId: team.id },
    });

    if (!member) return apiError("Membre introuvable", 404);

    await prisma.teamMember.delete({ where: { id: memberId } });

    return Response.json({ ok: true });
  } catch (e) {
    return handleServiceError(e);
  }
}
