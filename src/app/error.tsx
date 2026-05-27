"use client";

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="heading-section text-xl">Une erreur est survenue</h1>
      <p className="text-body mt-3 text-sm">
        {process.env.NODE_ENV === "development" ? error.message : "Réessayez dans un instant."}
      </p>
      <button type="button" onClick={reset} className="ui-btn-primary mt-8 px-6 py-3">
        Réessayer
      </button>
    </div>
  );
}
