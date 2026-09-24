'use client';

import { useEffect, useRef, useState } from 'react';

type Props = {
  email?: string | null;
  className?: string;
};

const CopyableEmail = ({ email, className = '' }: Props) => {
  const [copied, setCopied] = useState(false);
  const timeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (timeout.current) clearTimeout(timeout.current);
  }, []);

  if (!email) return null;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
      setCopied(true);
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy email to clipboard', error);
    }
  };

  return (
    <p className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-300 ${className}`}>
      <span className="shrink-0">Email:</span>
      <button
        type="button"
        onClick={copy}
        title="Kopioi sähköposti"
        className="min-w-0 cursor-pointer break-all text-left hover:text-sky-200 hover:underline focus-visible:underline"
      >
        {email}
      </button>
      <span
        role="status"
        aria-live="polite"
        className={`shrink-0 rounded-full bg-emerald-500/20 px-2 py-0.5 text-xs text-emerald-200 transition-opacity duration-200 ${copied ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        {copied ? 'Kopioitu!' : ''}
      </span>
    </p>
  );
};

export default CopyableEmail;