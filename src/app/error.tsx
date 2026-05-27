"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Une erreur est survenue</h1>
          <p className="mt-2 text-sm text-slate-600">{error.message}</p>
          <button
            onClick={reset}
            className="mt-6 rounded-lg bg-blue-600 px-4 py-2 text-white"
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
