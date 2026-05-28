import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  actionHref?: string;
}

export function EmptyState({ title, description, actionLabel, actionHref }: EmptyStateProps) {
  return (
    <div className="ui-card-padded mt-6 text-center">
      <p className="heading text-lg">{title}</p>
      <p className="text-body mx-auto mt-2 max-w-md text-sm">{description}</p>
      {actionLabel && actionHref && (
        <Link href={actionHref} className="ui-btn-primary mt-6 inline-flex px-6 py-3">
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
