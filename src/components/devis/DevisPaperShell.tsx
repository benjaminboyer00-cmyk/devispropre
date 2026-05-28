/** Fond « bureau » (s'adapte au dark mode) + feuille A4 blanche sanctuarisée (WYSIWYG PDF). */
export function DevisPaperShell({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex justify-center rounded-xl bg-gray-50 p-4 sm:p-8 dark:bg-gray-950 ${className}`}
    >
      <div className="w-full max-w-4xl overflow-hidden bg-white shadow-2xl ring-1 ring-gray-200 sm:rounded-md">
        {children}
      </div>
    </div>
  );
}
