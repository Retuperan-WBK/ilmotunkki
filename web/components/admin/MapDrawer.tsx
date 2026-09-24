'use client';

import React, { useEffect } from 'react';
import { useAdminContext } from './AdminContext';

const MapDrawer = () => {
  const { 
    newSeat,
    setNewSeat,
    selectedSeat, 
    setSelectedSeat,
    updateSeat, 
    deleteSeat, 
    setMode, 
    currentMode, 
    itemTypes,
    sections,
    multiSelectedSeats, 
    setMultiSelectedSeats,
    updateMultipleSeats,
  } = useAdminContext();

  const isAddMode = currentMode === 'add-seat';
  const isEditMode = currentMode === 'edit-seat';
  const isMultiSelectMode = currentMode === 'multi-select';
  const inputClass = 'mt-1 w-full rounded-lg border border-white/15 bg-[#101a2b] px-3 py-2 text-sm text-white focus:border-sky-400 focus:outline-none';

  const handleTabChange = (mode: 'add-seat' | 'edit-seat' | 'multi-select') => {
    setMode(mode);
    if (mode === 'multi-select') {
      setSelectedSeat(null);
    }
    setMultiSelectedSeats([]);
  };


  const handleBulkUpdate = () => {
    if (!multiSelectedSeats.length) return;

    updateMultipleSeats(
      multiSelectedSeats.map((seat) => {
        return {
          id: seat.id,
          special: seat.attributes.special
        };
       })
    );

    setMultiSelectedSeats([]);
  };

  const handleUpdateSeat = () => {
    if (!selectedSeat) return;

    updateSeat(selectedSeat.id, {
      Row: selectedSeat.attributes.Row,
      Number: selectedSeat.attributes.Number,
      x_cord: selectedSeat.attributes.x_cord,
      y_cord: selectedSeat.attributes.y_cord,
      special: selectedSeat.attributes.special
    });

    setSelectedSeat(null);
  };

  const handleDeleteSeat = async () => {
    if (!selectedSeat) return;

    if (await deleteSeat(selectedSeat.id)) setSelectedSeat(null);
  };

  useEffect(() => {
    setMode("edit-seat");
  }, [setMode]);

  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <div className="shrink-0 border-b border-white/10 p-4">
        <h1 className="text-xl font-bold text-white">Kartan hallinta</h1>
      </div>
      <div className='min-h-0 flex-1 overflow-y-auto p-4'>
        <div className="rounded-xl border border-white/10 bg-[#223149] p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Istuinpaikat</h2>
          <p className="text-base mt-2">
            Istuimia yhteensä: {sections.reduce((acc, section) => acc + section.attributes.seats.data.length, 0)}
          </p>
          <p className="text-sm flex flex-col ml-4">
            {sections.map((section) => (
              <span key={section.id}>
                {section.attributes.Name}: {section.attributes.seats.data.length}{' '}
              </span>
            ))}
          </p>

          <h2 className="mt-4 text-sm font-semibold uppercase tracking-wide text-slate-300">Lippuluokat</h2>
          <div className="text-base flex flex-col ml-4">
            {itemTypes.map((item) => (
              <span key={item.id} className='flex flex-col'>
                {item.attributes.slug}: {sections.reduce((acc, section) => acc + section.attributes.seats.data.filter(seat => seat.attributes.item_type.data?.id === item.id).length, 0)}{' '}
                  <div className='text-xs ml-8'>
                    {sections.map((section) => (
                      <span  key={section.id}>
                        {section.attributes.Name}: {section.attributes.seats.data.filter(seat => seat.attributes.item_type.data?.id === item.id).length}{' '}
                      </span>
                    ))}
                  </div>
              </span>
            ))}
          </div>
        </div>

        {/* Tab Buttons */}
        <div className="mt-4 flex flex-wrap gap-1 rounded-xl bg-[#101a2b] p-1">
          <button
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${isAddMode ? 'bg-sky-500/20 text-sky-100' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            onClick={() => handleTabChange('add-seat')}
          >
            Lisää istuin
          </button>

          <button
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${isEditMode ? 'bg-sky-500/20 text-sky-100' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            onClick={() => handleTabChange('edit-seat')}
          >
            Muokkaa istuimia
          </button>
          <button
            className={`rounded-lg px-3 py-2 text-xs font-semibold ${isMultiSelectMode ? 'bg-sky-500/20 text-sky-100' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}
            onClick={() => handleTabChange('multi-select')}
          >
            Useita istuimia
          </button>
        </div>

        {isAddMode && (
          <div className="mt-3 flex flex-col rounded-xl border border-white/10 bg-[#223149] p-4">
            <h2 className="text-lg font-bold">Lisää istuin</h2>

            <p className='mt-1 text-sm text-slate-300'>Valitse luokka, pidä Shift pohjassa ja klikkaa karttaa.</p>

            <label className="mt-2 text-sm">Rivi</label>
            <input
              type="text"
              value={newSeat.row}
              onChange={(e) => setNewSeat({ ...newSeat, row: e.target.value })}
              className={inputClass}
            />

            <label className="mt-2 text-sm">Numero</label>
            <input
              type="text"
              value={newSeat.seatNumber}
              onChange={(e) => setNewSeat({ ...newSeat, seatNumber: e.target.value })}
              className={inputClass}
            />

            <label className="mt-2 text-sm">Lisähuomio</label>
            <input
              type="text"
              value={newSeat.special}
              onChange={(e) => setNewSeat({ ...newSeat, special: e.target.value })}
              className={inputClass}
            />
            <label className="mt-2 text-sm">Lippuluokka</label>
            <select
              value={newSeat.itemType}
              onChange={(e) => setNewSeat({ ...newSeat, itemType: parseInt(e.target.value) })}
              className={inputClass}
            >
              <option value={0} disabled>Valitse luokka</option>
              {itemTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.attributes.slug}
                </option>
              ))}
            </select>
          </div>
        )}

        {isEditMode && (
          selectedSeat ? (

          <div className="mt-3 flex flex-col rounded-xl border border-white/10 bg-[#223149] p-4">
            <h2 className="text-lg font-bold">Muokkaa istuinta</h2>

            <label className="mt-2 text-sm">Rivi</label>
            <input
              type="text"
              value={selectedSeat.attributes.Row}
              onChange={(e) => 
                setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, Row: e.target.value }})
              }
              className={inputClass}
            />

            <label className="mt-2 text-sm">Numero</label>
            <input
              type="text"
              value={selectedSeat.attributes.Number}
              onChange={(e) => 
                setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, Number: e.target.value }})
              }
              className={inputClass}
            />

            <label className="mt-2 text-sm">X-koordinaatti</label>
            <input
              type="number"
              value={selectedSeat.attributes.x_cord}
              step={0.1}
              onChange={(e) => 
                setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, x_cord: parseFloat(e.target.value) }})
              }
              className={inputClass}
            />

            <label className="mt-2 text-sm">Y-koordinaatti</label>
            <input
              type="number"
              value={selectedSeat.attributes.y_cord}
              step={0.1}
              onChange={(e) => 
                setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, y_cord: parseFloat(e.target.value) }})
              }
              className={inputClass}
            />

            <label className="mt-2 text-sm">Lisähuomio</label>
            <input
              type="text"
              value={selectedSeat.attributes.special || ''}
              onChange={(e) => 
                setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, special: e.target.value }})
              }
              className={inputClass}
            />
            <label className="mt-2 text-sm">Lippuluokka</label>
            <select
              value={selectedSeat.itemTypeId ?? selectedSeat.attributes.item_type.data?.id ?? ''}
              onChange={(e) => setSelectedSeat({...selectedSeat, itemTypeId: e.target.value ? Number(e.target.value) : 0})}
              className={inputClass}
            >
              <option value={""}>Ei valittu</option>
              {itemTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.attributes.slug}
                </option>
              ))}
            </select>
            <button
              className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#102134] hover:bg-emerald-400"
              onClick={() => handleUpdateSeat()}
            >
              Päivitä istuin
            </button>

            <button
              className="mt-2 rounded-lg border border-rose-400/30 bg-rose-500/15 px-4 py-2 text-sm font-semibold text-rose-200 hover:bg-rose-500/25"
              onClick={() => handleDeleteSeat()}
            >
              Poista istuin
            </button>
          </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-white/15 bg-[#223149] p-4">
              <h2 className="text-sm font-semibold">Valitse istuin kartalta muokataksesi sitä.</h2>
            </div>
          )
        )}

        {isMultiSelectMode && (
          <div className="mt-3 flex flex-col rounded-xl border border-white/10 bg-[#223149] p-4">
            <h2 className="text-lg font-bold">Valitut Istuimet</h2>
            
            <p>{multiSelectedSeats.length} paikkaa valittu</p>

            <label className="mt-2 text-sm">Lippuluokka</label>
            <select
              value={newSeat.itemType|| ""}
              onChange={(e) => setNewSeat({...newSeat, itemType: parseInt(e.target.value)})}
              className={inputClass}
            >
              <option value={""}>Ei valittu</option>
              {itemTypes.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.attributes.slug}
                </option>
              ))}
            </select>

            <button
              disabled={!multiSelectedSeats.length || !newSeat.itemType}
              className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-[#102134] hover:bg-emerald-400 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={handleBulkUpdate}
            >
              Päivitä Lippuluokat
            </button>
          </div>
        )}
      </div> 
    </div>
  );
};

export default MapDrawer;
