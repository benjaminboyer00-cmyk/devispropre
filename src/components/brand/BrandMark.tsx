import Image from "next/image";

interface BrandMarkProps {
  size?: "sm" | "md" | "lg";
  className?: string;
  showWordmark?: boolean;
}

const sizes = {
  sm: { icon: 32, word: "text-lg" },
  md: { icon: 40, word: "text-xl" },
  lg: { icon: 56, word: "text-2xl" },
} as const;

export function BrandMark({ size = "md", className = "", showWordmark = true }: BrandMarkProps) {
  const cfg = sizes[size];

  return (
    <div className={`inline-flex flex-col items-center gap-3 ${className}`.trim()}>
      <Image
        src="/icon.png"
        alt=""
        width={cfg.icon}
        height={cfg.icon}
        className="rounded-xl shadow-sm"
        priority
      />
      {showWordmark ? (
        <p className={`font-bold leading-none ${cfg.word}`}>
          <span className="text-brand">Devis</span>
          <span className="text-[var(--accent)]">Propre</span>
        </p>
      ) : null}
    </div>
  );
}
