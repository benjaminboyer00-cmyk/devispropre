import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-lg px-4 py-24 text-center">
      <p className="text-6xl font-bold text-blue-600">404</p>
      <h1 className="mt-4 text-2xl font-bold">Page introuvable</h1>
      <p className="mt-2 text-slate-600">Ce devis a peut-être expiré, ou la page n&apos;existe pas.</p>
      <Link href="/" className="mt-8 inline-block rounded-lg bg-blue-600 px-6 py-3 text-white">
        Retour à l&apos;accueil
      </Link>
    </div>
  );
}
