'use client';

import { useEffect, useId, useRef } from 'react';

export type ConfirmOptions = {
  title: string;
  message: string;
  details?: string;
  confirmLabel?: string;
  tone?: 'default' | 'danger';
};

export default function ConfirmDialog({ options, resolve }: {
  options: ConfirmOptions;
  resolve: (confirmed: boolean) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); resolve(false); }}
      onClick={event => { if (event.target === event.currentTarget) resolve(false); }}
      className="admin-confirm-dialog w-[calc(100%-2rem)] max-w-md max-h-[calc(100vh-2rem)] overflow-y-auto rounded-xl border border-white/15 bg-[#242424] p-0 text-white shadow-2xl">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 id={titleId} className="text-lg font-bold">{options.title}</h2>
      </div>
      <div id={descriptionId} className="space-y-3 px-5 py-4 text-sm text-slate-200">
        <p>{options.message}</p>
        {options.details && <p className="whitespace-pre-wrap break-words rounded-lg bg-white/5 p-3 text-slate-300">{options.details}</p>}
      </div>
      <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4">
        <button type="button" autoFocus onClick={() => resolve(false)}
          className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400">
          Peruuta
        </button>
        <button type="button" onClick={() => resolve(true)}
          className={`rounded-lg px-4 py-2 text-sm font-semibold focus-visible:outline focus-visible:outline-2 focus-visible:outline-red-400 ${options.tone === 'danger' ? 'bg-[#961816] text-white hover:bg-[#b91c1a]' : 'bg-[#ee2725] text-white hover:bg-[#d4201e]'}`}>
          {options.confirmLabel || 'Vahvista'}
        </button>
      </div>
    </dialog>
  );
}
