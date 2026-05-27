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
      <body className="flex min-h-screen items-center justify-center bg-background p-4 text-foreground">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-bold">Une erreur est survenue</h1>
          <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
          <button onClick={reset} className="btn-primary mt-6">
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}
