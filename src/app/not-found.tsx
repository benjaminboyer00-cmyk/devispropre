import Link from "next/link";

export default function NotFound() {
  return (
    <div className="page-shell max-w-lg py-24 text-center">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold text-foreground">Page introuvable</h1>
      <p className="mt-2 text-muted-foreground">Ce devis a peut-être expiré, ou la page n&apos;existe pas.</p>
      <Link href="/" className="btn-primary mt-8 inline-block px-6 py-3">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
