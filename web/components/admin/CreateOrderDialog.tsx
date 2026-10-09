'use client';

import { FormEvent, useEffect, useId, useRef, useState } from 'react';
import { useTranslation } from '@/context/useTranslation';
import { AdminOrderInput } from '@/utils/models';
import { useAdminContext } from './AdminContext';

const inputClass = 'mt-1 w-full rounded-lg border border-white/15 bg-[#101a2b] px-3 py-2 text-sm text-white focus:border-white/40 focus:outline-none';
const euros = new Intl.NumberFormat('fi-FI', { style: 'currency', currency: 'EUR' });
const formatPrice = (cents: number) => euros.format(cents / 100);

export default function CreateOrderDialog({ onClose }: { onClose: () => void }) {
  const { itemTypes, createOrder } = useAdminContext();
  const { translation } = useTranslation('fi');
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submittingRef = useRef(false);
  const titleId = useId();
  const descriptionId = useId();
  const [quantities, setQuantities] = useState<Record<number, string>>({});
  const [invited, setInvited] = useState(false);
  const [status, setStatus] = useState<AdminOrderInput['status']>('admin-new');
  const [sendConfirmation, setSendConfirmation] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const total = itemTypes.reduce((sum, itemType) => sum + (Number(quantities[itemType.id]) || 0), 0);
  const totalPrice = itemTypes.reduce((sum, itemType) => sum + (Number(quantities[itemType.id]) || 0) * itemType.attributes.price, 0);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (dialog && !dialog.open) dialog.showModal();
    return () => { if (dialog?.open) dialog.close(); };
  }, []);

  const close = () => { if (!submittingRef.current) onClose(); };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (submittingRef.current) return;
    const form = new FormData(event.currentTarget);
    const customer: AdminOrderInput['customer'] = {
      firstName: String(form.get('firstName') || ''),
      lastName: String(form.get('lastName') || ''),
      email: String(form.get('email') || ''),
      special_arragements: String(form.get('special_arragements') || ''),
      locale: form.get('locale') === 'en' ? 'en' : 'fi',
    };
    const tickets = itemTypes
      .map(itemType => ({ itemTypeId: itemType.id, quantity: Number(quantities[itemType.id]) || 0 }))
      .filter(ticket => ticket.quantity > 0);

    submittingRef.current = true;
    setSubmitting(true);
    setError('');
    try {
      await createOrder({ customer, kutsuvieras: invited, status: invited ? 'ok' : status, tickets, sendConfirmation });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Tilauksen luominen epäonnistui.');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <dialog ref={dialogRef} aria-labelledby={titleId} aria-describedby={descriptionId}
      onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      className="admin-confirm-dialog max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border border-white/15 bg-[#242424] p-0 text-white shadow-2xl">
      <div className="border-b border-white/10 px-5 py-4">
        <h2 id={titleId} className="text-lg font-bold">Uusi tilaus</h2>
        <p id={descriptionId} className="mt-1 text-sm text-slate-400">Luo asiakas, tilaus ja liput kerralla. Paikat valitaan tämän jälkeen kartalta.</p>
      </div>
      <form onSubmit={handleSubmit} aria-busy={submitting}>
        <fieldset disabled={submitting} className="space-y-5 px-5 py-4 disabled:opacity-60">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">Etunimi *
              <input autoFocus required name="firstName" autoComplete="given-name" maxLength={255} className={inputClass} />
            </label>
            <label className="text-sm">Sukunimi *
              <input required name="lastName" autoComplete="family-name" maxLength={255} className={inputClass} />
            </label>
            <label className="text-sm">Sähköposti {sendConfirmation ? '*' : '(valinnainen)'}
              <input type="email" name="email" required={sendConfirmation} autoComplete="email" maxLength={255} className={inputClass} />
            </label>
            <label className="text-sm">Asiakkaan kieli
              <select name="locale" className={inputClass} defaultValue="fi">
                <option value="fi">Suomi</option>
                <option value="en">Englanti</option>
              </select>
            </label>
            <label className="text-sm">Tilauksen tila
              <select value={invited ? 'ok' : status} disabled={invited} onChange={event => setStatus(event.target.value as AdminOrderInput['status'])} className={inputClass}>
                <option value="admin-new">Odottaa verkkomaksua</option>
                <option value="ok">Maksettu / laskutetaan erikseen</option>
              </select>
            </label>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input type="checkbox" checked={invited} onChange={event => setInvited(event.target.checked)} className="h-4 w-4 accent-sky-400" />
            Kutsuvieras (ei verkkomaksua)
          </label>
          <label className="block text-sm">Erikoisjärjestelyt
            <textarea name="special_arragements" rows={2} maxLength={10000} className={inputClass} />
          </label>
          <div className="rounded-lg border border-white/10 p-3">
            <h3 className="mb-2 text-sm font-semibold">Liput</h3>
            {itemTypes.map(itemType => (
              <label key={itemType.id} className="flex items-center justify-between gap-3 border-b border-white/5 py-2 text-sm last:border-0">
                <span>
                  <span className="block">{translation[itemType.attributes.slug] || itemType.attributes.slug}</span>
                  <span className="text-xs text-slate-400">{formatPrice(itemType.attributes.price)} / lippu</span>
                </span>
                <input type="number" min={0} max={1000} step={1} placeholder="0" aria-label={`${translation[itemType.attributes.slug] || itemType.attributes.slug}: lippujen määrä`}
                  value={quantities[itemType.id] ?? ''} onChange={event => setQuantities(current => ({ ...current, [itemType.id]: event.target.value }))}
                  className="w-24 rounded-lg border border-white/15 bg-[#101a2b] px-3 py-2 text-right text-sm text-white focus:outline-none" />
              </label>
            ))}
            {!itemTypes.length && <p className="text-sm text-slate-400">Lipputyyppejä ei ole ladattu. Sulje lomake ja päivitä näkymä.</p>}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm font-semibold" aria-live="polite" aria-atomic="true">
              <span>Yhteensä {total} lippua</span>
              <span className="text-base tabular-nums">{formatPrice(totalPrice)}</span>
            </div>
            {total > 1000 && <p className="mt-1 text-sm text-rose-300">Tilauksessa voi olla enintään 1000 lippua.</p>}
          </div>
          <div>
            <label className="flex cursor-pointer items-center gap-2 text-sm">
              <input type="checkbox" checked={sendConfirmation} onChange={event => setSendConfirmation(event.target.checked)} className="h-4 w-4 accent-sky-400" />
              Lähetä tilausvahvistus sähköpostitse
            </label>
            <p className="mt-1 text-xs text-slate-400">Käyttää normaalia tilausvahvistusta asiakkaan valitsemalla kielellä.</p>
          </div>
          <p className="text-xs text-slate-400">Verkkomaksua odottavan tilauksen asiakas voi maksaa muokkauslinkin kautta. Kutsuvierailta ei peritä verkkomaksua.</p>
        </fieldset>
        {error && <p role="alert" className="mx-5 mb-4 rounded-lg bg-rose-500/10 p-3 text-sm text-rose-300">{error}</p>}
        <div className="flex flex-wrap justify-end gap-2 border-t border-white/10 px-5 py-4">
          <button type="button" disabled={submitting} onClick={close} className="rounded-lg border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 hover:bg-white/10 disabled:opacity-50">Peruuta</button>
          <button type="submit" disabled={submitting || total < 1 || total > 1000} className="rounded-lg bg-[#ee2725] px-4 py-2 text-sm font-semibold text-white hover:bg-[#d4201e] disabled:cursor-not-allowed disabled:opacity-50">
            {submitting ? 'Luodaan…' : 'Luo tilaus'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
