import Link from "next/link";
import { ResendVerificationButton } from "@/components/auth/ResendVerificationButton";
import { AuthEmailPanel, AuthMailIcon } from "@/components/auth/AuthEmailPanel";
import { ROUTES } from "@/lib/routes";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Confirmez votre email",
  description: "Un email de confirmation vient de vous être envoyé pour activer votre compte DevisPropre.",
  path: "/inscription/confirmation",
  noindex: true,
});

export default async function InscriptionConfirmationPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const params = await searchParams;
  const email = params.email?.trim() ?? "";

  return (
    <AuthEmailPanel
      title="Vérifiez votre boîte mail"
      subtitle="Un dernier clic pour activer votre compte et accéder à vos devis."
      icon={<AuthMailIcon />}
    >
      <p className="ui-alert-success">
        Votre compte est créé. Cliquez le lien dans l&apos;email que nous venons d&apos;envoyer
        {email ? (
          <>
            {" "}
            à <strong>{email}</strong>
          </>
        ) : null}{" "}
        pour activer votre compte et vous connecter automatiquement.
      </p>
      <ul className="text-body list-inside list-disc space-y-2 text-sm">
        <li>Le lien est valable 24 h.</li>
        <li>Vérifiez le dossier spam / courrier indésirable.</li>
        <li>Ne demandez pas de lien de connexion tant que vous n&apos;avez pas confirmé votre email.</li>
      </ul>
      {email ? <ResendVerificationButton email={email} /> : null}
      <p className="text-body text-center text-sm">
        Déjà confirmé ?{" "}
        <Link href={ROUTES.connexion} className="link-underline font-medium">
          Se connecter
        </Link>
      </p>
    </AuthEmailPanel>
  );
}
