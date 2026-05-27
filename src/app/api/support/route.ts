import { NextRequest } from "next/server";
import { z } from "zod";
import {
  apiError,
  assertMutationSecurity,
  getRequestMeta,
  handleServiceError,
  requireAuth,
} from "@/lib/api-helpers";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { sendSupportTicketEmail } from "@/lib/email";
import { assertProFeature } from "@/lib/plan-features";

const ticketSchema = z.object({
  subject: z.string().min(3).max(120),
  message: z.string().min(10).max(5000),
});

export async function GET() {
  const auth = await requireAuth({ skipSubscriptionCheck: true });
  if (auth.error) return auth.error;

  try {
    assertProFeature(auth.plan, "Support prioritaire");

    const tickets = await prisma.supportTicket.findMany({
      where: { userId: auth.user.id },
      orderBy: { createdAt: "desc" },
      take: 20,
      select: {
        id: true,
        subject: true,
        status: true,
        priority: true,
        createdAt: true,
      },
    });

    return Response.json({ tickets });
  } catch (e) {
    return handleServiceError(e);
  }
}

export async function POST(request: NextRequest) {
  assertMutationSecurity(request);

  const auth = await requireAuth({ skipSubscriptionCheck: true });
  if (auth.error) return auth.error;

  try {
    assertProFeature(auth.plan, "Support prioritaire");

    const body = ticketSchema.parse(await request.json());

    const ticket = await prisma.supportTicket.create({
      data: {
        userId: auth.user.id,
        subject: body.subject,
        message: body.message,
        priority: true,
      },
    });

    const emailResult = await sendSupportTicketEmail({
      userEmail: auth.user.email,
      userName: auth.user.name,
      plan: auth.plan,
      subject: body.subject,
      message: body.message,
      priority: true,
      ticketId: ticket.id,
    });

    await logAudit(
      {
        userId: auth.workspaceUserId,
        actorUserId: auth.user.id,
        ...getRequestMeta(request),
      },
      {
        action: "CREATE",
        entityType: "support_ticket",
        entityId: ticket.id,
        metadata: { emailSent: emailResult.sent, emailReason: emailResult.reason },
      }
    );

    return Response.json(
      {
        ticket: {
          id: ticket.id,
          subject: ticket.subject,
          status: ticket.status,
        },
        emailSent: emailResult.sent,
      },
      { status: 201 }
    );
  } catch (e) {
    if (e instanceof z.ZodError) return apiError(e.message);
    return handleServiceError(e);
  }
}
