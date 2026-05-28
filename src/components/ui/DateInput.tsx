"use client";

import { useEffect, useState } from "react";
import { formatDateInputValue } from "@/lib/devis-defaults";

interface DateInputProps {
  id?: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  required?: boolean;
  hint?: string;
  min?: string;
  invalid?: boolean;
  /** Valeur initiale côté client uniquement (évite mismatch SSR). */
  defaultValue?: string;
}

/**
 * Champ date contrôlé — initialisation client pour que le calendrier natif
 * enregistre bien la sélection (fix bug toISOString UTC + hydratation).
 */
export function DateInput({
  id,
  label,
  value,
  onChange,
  onBlur,
  required,
  hint,
  min,
  invalid,
  defaultValue,
}: DateInputProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (defaultValue) onChange(defaultValue);
    setReady(true);
  }, [defaultValue, onChange]);

  const todayMin = min ?? formatDateInputValue(new Date());

  return (
    <div>
      <label htmlFor={id} className="ui-label text-xs">
        {label}
      </label>
      <input
        id={id}
        type="date"
        required={required}
        min={todayMin}
        value={ready ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        onBlur={onBlur}
        className={`ui-input ui-input-date mt-1 text-base ${invalid ? "ui-input-invalid" : ""}`}
        aria-invalid={invalid || undefined}
      />
      {hint && <p className="text-subtle mt-1 text-xs">{hint}</p>}
    </div>
  );
}
