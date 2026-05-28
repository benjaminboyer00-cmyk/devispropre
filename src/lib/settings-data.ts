import type { AccountContext } from "@/lib/account-context";
import { prisma } from "@/lib/db";
import { logoApiPath } from "@/lib/logo-storage";

export interface SettingsPayload {
  profile: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    plan: string;
  } | null;
  company: {
    id: string;
    raisonSociale: string;
    siret: string;
    adresse: string;
    codePostal: string;
    ville: string;
    tvaIntracom: string | null;
    telephone: string | null;
    email: string | null;
    capitalSocial: string | null;
    rcs: string | null;
    assurances: string | null;
    assuranceDecennaleAssureur: string | null;
    assuranceDecennaleContrat: string | null;
    assuranceDecennaleCouverture: string | null;
    activiteBtp: boolean;
    tvaApplicable: boolean;
    logoUrl: string | null;
  } | null;
  isTeamMember: boolean;
  hasStripeCustomer: boolean;
}

export async function loadSettingsPayload(
  userId: string,
  account: Pick<AccountContext, "workspaceUserId" | "plan" | "isTeamMember">
): Promise<SettingsPayload> {
  const [profile, company, billingOwner] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, phone: true, plan: true },
    }),
    prisma.company.findUnique({
      where: { userId: account.workspaceUserId },
      select: {
        id: true,
        raisonSociale: true,
        siret: true,
        adresse: true,
        codePostal: true,
        ville: true,
        tvaIntracom: true,
        telephone: true,
        email: true,
        capitalSocial: true,
        rcs: true,
        assurances: true,
        assuranceDecennaleAssureur: true,
        assuranceDecennaleContrat: true,
        assuranceDecennaleCouverture: true,
        activiteBtp: true,
        tvaApplicable: true,
        logoUrl: true,
      },
    }),
    prisma.user.findUnique({
      where: { id: account.workspaceUserId },
      select: { stripeCustomerId: true },
    }),
  ]);

  return {
    profile: profile ? { ...profile, plan: account.plan } : null,
    company: company
      ? {
          ...company,
          logoUrl: company.logoUrl?.startsWith("data:image")
            ? logoApiPath(account.workspaceUserId)
            : company.logoUrl,
        }
      : null,
    isTeamMember: account.isTeamMember,
    hasStripeCustomer: !!billingOwner?.stripeCustomerId,
  };
}
