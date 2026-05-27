import { GuestDevisPreview } from "@/components/devis/GuestDevisPreview";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata({
  title: "Aperçu de votre devis",
  description: "Votre devis est prêt. Créez un compte DevisPropre pour le conserver et obtenir le lien client.",
  path: "/creer-devis/apercu",
  keywords: [],
  noindex: true,
});

export default function CreerDevisApercuPage() {
  return <GuestDevisPreview />;
}
