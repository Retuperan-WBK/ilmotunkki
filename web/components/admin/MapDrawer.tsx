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
    itemTypes
  } = useAdminContext();

  const isAddMode = currentMode === 'add-seat';
  const isEditMode = currentMode === 'edit-seat';

  const handleTabChange = (mode: 'add-seat' | 'edit-seat') => {
    setMode(mode);
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

  const handleDeleteSeat = () => {
    if (!selectedSeat) return;

    deleteSeat(selectedSeat.id);
    setSelectedSeat(null);
  };

  useEffect(() => {
    setMode("edit-seat");
  }, []);

  console.log(selectedSeat ? selectedSeat.attributes.item_type.data?.id : null);

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Kartta</h1>

      {/* Tab Buttons */}
      <div className="flex">
        <button
          className={`px-4 py-2 ${isAddMode ? 'bg-[#6d6d6d]' : 'bg-[#4f4f4f]'} text-white`}
          onClick={() => handleTabChange('add-seat')}
        >
          Lisää istuin
        </button>

        <button
          className={`px-4 py-2 ${isEditMode ? 'bg-[#5f5f5f]' : 'bg-[#4f4f4f]'} text-white`}
          onClick={() => handleTabChange('edit-seat')}
        >
          Muokkaa istuimia
        </button>
      </div>

      {isAddMode && (
        <div className="flex flex-col bg-[#545454] p-4 ">
          <h2 className="text-lg font-bold">Lisää istuin</h2>

          <label className="mt-2 text-sm">Rivi</label>
          <input
            type="text"
            value={newSeat.row}
            onChange={(e) => setNewSeat({ ...newSeat, row: e.target.value })}
            className="p-2 bg-[#868686] rounded-md"
          />

          <label className="mt-2 text-sm">Numero</label>
          <input
            type="text"
            value={newSeat.seatNumber}
            onChange={(e) => setNewSeat({ ...newSeat, seatNumber: e.target.value })}
            className="p-2 bg-[#868686] rounded-md"
          />

          <label className="mt-2 text-sm">Erikoislisä</label>
          <input
            type="text"
            value={newSeat.special}
            onChange={(e) => setNewSeat({ ...newSeat, special: e.target.value })}
            className="p-2 bg-[#868686] rounded-md"
          />
          <label className="mt-2 text-sm">Lippuluokka</label>
          <select
            value={newSeat.itemType}
            onChange={(e) => setNewSeat({ ...newSeat, itemType: parseInt(e.target.value) })}
            className="p-2 bg-[#868686] rounded-md"
          >
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

        <div className="flex flex-col bg-[#545454] p-4">
          <h2 className="text-lg font-bold">Muokkaa istuinta</h2>

          <label className="mt-2 text-sm">Rivi</label>
          <input
            type="text"
            value={selectedSeat.attributes.Row}
            onChange={(e) => 
              setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, Row: e.target.value }})
            }
            className="p-2 bg-[#868686] rounded-md"
          />

          <label className="mt-2 text-sm">Numero</label>
          <input
            type="text"
            value={selectedSeat.attributes.Number}
            onChange={(e) => 
              setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, Number: e.target.value }})
            }
            className="p-2 bg-[#868686] rounded-md"
          />

          <label className="mt-2 text-sm">X-koordinaatti</label>
          <input
            type="number"
            value={selectedSeat.attributes.x_cord}
            step={0.1}
            onChange={(e) => 
              setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, x_cord: parseFloat(e.target.value) }})
            }
            className="p-2 bg-[#868686] rounded-md"
          />

          <label className="mt-2 text-sm">Y-koordinaatti</label>
          <input
            type="number"
            value={selectedSeat.attributes.y_cord}
            step={0.1}
            onChange={(e) => 
              setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, y_cord: parseFloat(e.target.value) }})
            }
            className="p-2 bg-[#868686] rounded-md"
          />

          <label className="mt-2 text-sm">Erikoislisä</label>
          <input
            type="text"
            value={selectedSeat.attributes.special || ''}
            onChange={(e) => 
              setSelectedSeat({id: selectedSeat.id, attributes: { ...selectedSeat.attributes, special: e.target.value }})
            }
            className="p-2 bg-[#868686] rounded-md"
          />
          <label className="mt-2 text-sm">Lippuluokka</label>
          <select
            value={selectedSeat.attributes.item_type.data?.id || ""}
            onChange={(e) => setSelectedSeat({...selectedSeat, itemTypeId: parseInt(e.target.value)})}
            className="p-2 bg-[#868686] rounded-md"
          >
            <option value={""}>Ei valittu</option>
            {itemTypes.map((item) => (
              <option key={item.id} value={item.id}>
                {item.attributes.slug}
              </option>
            ))}
          </select>
          <button
            className="mt-4 px-4 py-2 bg-green-500 text-white rounded-md"
            onClick={() => handleUpdateSeat()}
          >
            Päivitä istuin
          </button>

          <button
            className="mt-2 px-4 py-2 bg-red-500 text-white rounded-md"
            onClick={() => handleDeleteSeat()}
          >
            Poista istuin
          </button>
        </div>
        ) : (
          <div className="flex flex-col bg-[#545454] p-4">
            <h2 className="text-lg font-bold">Valitse istuin</h2>
          </div>
        )
      )}
    </div>
  );
};

export default MapDrawer;
