'use client';

import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { PointerEvent as ReactPointerEvent, KeyboardEvent as ReactKeyboardEvent } from 'react';
import type { Seat, Section, Order, AdminGroup } from '@/utils/models';
import { useAdminContext } from './AdminContext';
import { getRowSeats, isIdentityTransform, transformRowSeats } from './seatTransforms';

const MAP_SIZE = 1000;
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 8;

type View = { x: number; y: number; width: number; height: number; fitWidth: number; fitHeight: number };

const colors: Record<string, string> = {
  deluxe: '#f5b74f',
  iluokka: '#e0645c',
  iiluokka: '#d58ad8',
  opiskelija: '#db9368',
};

const Seats = memo(function Seats({ section, scale, filter, selectedSeat, selectedGroup, selectedOrder, selectedIds, overrides, suppressClickRef, onSeatClick, onSeatPointerDown, onSeatPointerMove, onSeatPointerUp }: {
  section: Section | null;
  scale: number;
  filter: { filter: 'show-class' | 'show-itemtype' | 'highlight-group' | 'highlight-order' | 'special' | null; showReserved: boolean };
  selectedSeat: Seat | null;
  selectedGroup: AdminGroup | null;
  selectedOrder: Order | null;
  selectedIds: number[];
  overrides: Record<number, { x_cord: number; y_cord: number }>;
  suppressClickRef: { current: boolean };
  onSeatClick: (seat: Seat) => void;
  onSeatPointerDown: (seat: Seat, event: ReactPointerEvent<SVGGElement>) => void;
  onSeatPointerMove: (event: ReactPointerEvent<SVGGElement>) => void;
  onSeatPointerUp: (event: ReactPointerEvent<SVGGElement>) => void;
}) {
  const selected = new Set(selectedIds);
  return <>
    {section?.attributes.seats.data.map(seat => {
      const assigned = seat.attributes.item.data;
      const order = assigned?.attributes.order.data;
      let fill = '#292929';
      if (filter.filter === 'show-class') fill = colors[seat.attributes.item_type.data?.attributes.slug || ''] || fill;
      if (filter.filter === 'show-itemtype' && assigned) fill = colors[assigned.attributes.itemType.data?.attributes.slug || ''] || fill;
      if (filter.filter === 'highlight-group' && order?.attributes.group.data) fill = `hsl(${order.attributes.group.data.id * 137.508 % 360}, 72%, 52%)`;
      if (filter.filter === 'highlight-order' && order) fill = `hsl(${order.id * 137.508 % 360}, 72%, 52%)`;
      if (filter.filter === 'special' && seat.attributes.special) fill = '#9b2d29';
      if ((selectedGroup && selectedGroup.id === order?.attributes.group.data?.id) ||
        (selectedOrder && selectedOrder.id === order?.id)) fill = '#facc15';
      if (selectedSeat?.id === seat.id || selected.has(seat.id)) fill = '#ee2725';
      const stroke = !filter.showReserved ? '#181818' : !assigned ? '#19b77c' : order?.attributes.tickets_sent ? '#8754dc' : '#ee2725';
      const textColor = fill === colors.deluxe || fill === '#facc15' ? '#211d1d' : '#ffffff';
      const override = overrides[seat.id];
      const x = (override?.x_cord ?? seat.attributes.x_cord) * scale;
      const y = (override?.y_cord ?? seat.attributes.y_cord) * scale;
      return <g key={seat.id}
        onPointerDown={event => onSeatPointerDown(seat, event)}
        onPointerMove={onSeatPointerMove}
        onPointerUp={onSeatPointerUp}
        onClick={event => {
          event.stopPropagation();
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            return;
          }
          onSeatClick(seat);
        }} style={{ cursor: 'pointer' }}>
        <title>Rivi {seat.attributes.Row}, paikka {seat.attributes.Number} — {order?.attributes.tickets_sent ? 'liput lähetetty' : assigned ? 'varattu' : 'vapaa'}</title>
        <circle cx={x} cy={y} r="3.8" fill={fill} stroke={stroke} strokeWidth={filter.showReserved ? 1.5 : 0.6} />
        <text x={x} y={y} fontSize="4" fontWeight="600" textAnchor="middle" dominantBaseline="central" fill={textColor} style={{ userSelect: 'none', pointerEvents: 'none' }}>{seat.attributes.Number}</text>
      </g>;
    })}
  </>;
});

export default function SeatMap() {
  const {
    activeSection, sections, setActiveSection, handleMapClick, handleSeatClick,
    selectedSeat, filter, setFilter, selectedGroup, selectedOrder,
    bottomDrawerOpen, setBottomDrawerOpen, orders, groups, setSelectedGroup,
    setSelectedOrder, handleSetActiveTab, multiSelectedSeats, setSelectedSeat,
    currentMode, selectedTicket, setMode, setSelectedTicket,
    mapScale,
    selectedRow, rowTransform, setRowTransform, moveSeat,
  } = useAdminContext();

  const viewportRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const viewRef = useRef<View>({ x: 0, y: 0, width: MAP_SIZE, height: MAP_SIZE, fitWidth: MAP_SIZE, fitHeight: MAP_SIZE });
  const [view, setView] = useState(viewRef.current);
  const frameRef = useRef<number | null>(null);
  const pointerRef = useRef<{ id: number; x: number; y: number; moved: boolean } | null>(null);
  const dragRef = useRef<{ seatId: number; pointerId: number; startClientX: number; startClientY: number; startX: number; startY: number; mode: 'seat' | 'row' } | null>(null);
  const suppressClickRef = useRef(false);
  const [legendOpen, setLegendOpen] = useState(true);
  const [showBackground, setShowBackground] = useState(true);
  const [showSeats, setShowSeats] = useState(true);
  const [dragSeat, setDragSeat] = useState<{ id: number; x_cord: number; y_cord: number } | null>(null);
  const selectedIds = useMemo(() => multiSelectedSeats.map(seat => seat.id), [multiSelectedSeats]);

  const image = activeSection?.attributes.background_image.data?.attributes;
  // The SVG world matches the background image's aspect ratio (longest side = MAP_SIZE)
  // so the map is never stretched. Seats are stored in image pixel coordinates and are
  // multiplied by this same scale to land on the image.
  const imageWidth = image?.width || MAP_SIZE;
  const imageHeight = image?.height || MAP_SIZE;
  const worldScale = MAP_SIZE / Math.max(imageWidth, imageHeight);
  const worldWidth = imageWidth * worldScale;
  const worldHeight = imageHeight * worldScale;
  // Global map size setting (from CMS Global settings). 100% = fit to the viewport.
  const mapScaleFactor = (mapScale > 0 ? mapScale : 100) / 100;

  // Live position overrides for the row transform preview and single-seat dragging.
  const seatOverrides = useMemo(() => {
    const overrides: Record<number, { x_cord: number; y_cord: number }> = {};
    if (activeSection && selectedRow && !isIdentityTransform(rowTransform)) {
      Object.assign(overrides, transformRowSeats(getRowSeats(activeSection, selectedRow), rowTransform));
    }
    if (dragSeat) overrides[dragSeat.id] = { x_cord: dragSeat.x_cord, y_cord: dragSeat.y_cord };
    return overrides;
  }, [activeSection, selectedRow, rowTransform, dragSeat]);

  const drawView = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      setView({ ...viewRef.current });
      frameRef.current = null;
    });
  }, []);

  const fitMap = useCallback(() => {
    const viewport = viewportRef.current;
    if (!viewport || !viewport.clientWidth || !viewport.clientHeight) return;
    const viewAspect = viewport.clientWidth / viewport.clientHeight;
    const worldAspect = worldWidth / worldHeight;
    let width: number;
    let height: number;
    if (worldAspect > viewAspect) {
      width = worldWidth / 0.92;
      height = width / viewAspect;
    } else {
      height = worldHeight / 0.92;
      width = height * viewAspect;
    }
    // Apply the global scale as the default zoom, keeping the aspect ratio intact.
    const scaledWidth = width / mapScaleFactor;
    const scaledHeight = height / mapScaleFactor;
    viewRef.current = {
      x: worldWidth / 2 - scaledWidth / 2,
      y: worldHeight / 2 - scaledHeight / 2,
      width: scaledWidth, height: scaledHeight, fitWidth: width, fitHeight: height,
    };
    drawView();
  }, [drawView, worldWidth, worldHeight, mapScaleFactor]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const observer = new ResizeObserver(fitMap);
    observer.observe(viewport);
    fitMap();
    return () => {
      observer.disconnect();
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
        frameRef.current = null;
      }
    };
  }, [fitMap]);

  useEffect(() => {
    if (sections.length && !activeSection) setActiveSection(sections[0].id);
  }, [sections, activeSection, setActiveSection]);

  const zoomAt = useCallback((px: number, py: number, factor: number) => {
    const current = viewRef.current;
    const zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, current.fitWidth / current.width * factor));
    const width = current.fitWidth / zoom;
    const height = current.fitHeight / zoom;
    if (width === current.width) return;
    const viewport = viewportRef.current;
    if (!viewport) return;
    const fx = px / viewport.clientWidth;
    const fy = py / viewport.clientHeight;
    viewRef.current = {
      ...current, width, height,
      x: current.x + (current.width - width) * fx,
      y: current.y + (current.height - height) * fy,
    };
    drawView();
  }, [drawView]);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) return;
    const onWheel = (event: WheelEvent) => {
      event.preventDefault();
      const rect = viewport.getBoundingClientRect();
      const delta = event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? rect.height : 1);
      zoomAt(event.clientX - rect.left, event.clientY - rect.top, Math.exp(-delta * 0.0015));
    };
    viewport.addEventListener('wheel', onWheel, { passive: false });
    return () => viewport.removeEventListener('wheel', onWheel);
  }, [zoomAt]);

  const zoomFromCenter = (factor: number) => {
    const viewport = viewportRef.current;
    if (viewport) zoomAt(viewport.clientWidth / 2, viewport.clientHeight / 2, factor);
  };

  const handlePointerDown = (event: ReactPointerEvent<SVGSVGElement>) => {
    if (event.button !== 0) return;
    suppressClickRef.current = false;
    pointerRef.current = { id: event.pointerId, x: event.clientX, y: event.clientY, moved: false };
  };

  const handlePointerMove = (event: ReactPointerEvent<SVGSVGElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    const dx = event.clientX - pointer.x;
    const dy = event.clientY - pointer.y;
    if (!pointer.moved && Math.hypot(dx, dy) > 5) {
      pointer.moved = true;
      svgRef.current?.setPointerCapture(event.pointerId);
      if (svgRef.current) svgRef.current.style.cursor = 'grabbing';
    }
    if (pointer.moved) {
      const viewport = viewportRef.current;
      if (!viewport) return;
      viewRef.current.x -= dx * viewRef.current.width / viewport.clientWidth;
      viewRef.current.y -= dy * viewRef.current.height / viewport.clientHeight;
      drawView();
    }
    pointer.x = event.clientX;
    pointer.y = event.clientY;
  };

  const handlePointerUp = (event: ReactPointerEvent<SVGSVGElement>) => {
    const pointer = pointerRef.current;
    if (!pointer || pointer.id !== event.pointerId) return;
    pointerRef.current = null;
    suppressClickRef.current = pointer.moved;
    if (svgRef.current?.hasPointerCapture(event.pointerId)) svgRef.current.releasePointerCapture(event.pointerId);
    if (svgRef.current) svgRef.current.style.cursor = 'grab';
    if (pointer.moved || !activeSection || (event.target !== svgRef.current && !(event.target instanceof SVGImageElement) && !(event.target instanceof SVGRectElement))) return;
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect || !image || !image.width || !image.height) return;
    const worldX = viewRef.current.x + (event.clientX - rect.left) / rect.width * viewRef.current.width;
    const worldY = viewRef.current.y + (event.clientY - rect.top) / rect.height * viewRef.current.height;
    const x = worldX / worldScale;
    const y = worldY / worldScale;
    if (x >= 0 && x <= image.width && y >= 0 && y <= image.height) handleMapClick(x, y, event.shiftKey);
  };

  const handlePointerCancel = () => {
    pointerRef.current = null;
    suppressClickRef.current = true;
    if (svgRef.current) svgRef.current.style.cursor = 'grab';
  };

  const imageDelta = (event: ReactPointerEvent<SVGGElement>, drag: { startClientX: number; startClientY: number }) => {
    const rect = viewportRef.current?.getBoundingClientRect();
    if (!rect || !rect.width || !rect.height) return { dx: 0, dy: 0 };
    return {
      dx: (event.clientX - drag.startClientX) / rect.width * viewRef.current.width / worldScale,
      dy: (event.clientY - drag.startClientY) / rect.height * viewRef.current.height / worldScale,
    };
  };

  // Shift+drag moves a single seat (edit-seat mode) or the whole selected row (edit-row mode).
  const handleSeatPointerDown = (seat: Seat, event: ReactPointerEvent<SVGGElement>) => {
    if (!event.shiftKey) return;
    const isSeatDrag = currentMode === 'edit-seat';
    const isRowDrag = currentMode === 'edit-row' && selectedRow !== null && seat.attributes.Row === selectedRow;
    if (!isSeatDrag && !isRowDrag) return;

    event.stopPropagation();
    event.preventDefault();
    try { event.currentTarget.setPointerCapture(event.pointerId); } catch { /* pointer capture unavailable */ }

    dragRef.current = isRowDrag
      ? { seatId: seat.id, pointerId: event.pointerId, startClientX: event.clientX, startClientY: event.clientY, startX: rowTransform.dx, startY: rowTransform.dy, mode: 'row' }
      : { seatId: seat.id, pointerId: event.pointerId, startClientX: event.clientX, startClientY: event.clientY, startX: seat.attributes.x_cord, startY: seat.attributes.y_cord, mode: 'seat' };

    if (!isRowDrag) setDragSeat({ id: seat.id, x_cord: seat.attributes.x_cord, y_cord: seat.attributes.y_cord });
  };

  const handleSeatPointerMove = (event: ReactPointerEvent<SVGGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const { dx, dy } = imageDelta(event, drag);
    if (drag.mode === 'row') {
      setRowTransform(previous => ({ ...previous, dx: drag.startX + dx, dy: drag.startY + dy }));
    } else {
      setDragSeat({ id: drag.seatId, x_cord: drag.startX + dx, y_cord: drag.startY + dy });
    }
  };

  const handleSeatPointerUp = (event: ReactPointerEvent<SVGGElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    suppressClickRef.current = true;
    if (drag.mode === 'row') return; // Keep the preview; the user commits with "Tallenna".
    const { dx, dy } = imageDelta(event, drag);
    const x_cord = drag.startX + dx;
    const y_cord = drag.startY + dy;
    // Keep the edit panel in sync so it cannot write back stale coordinates.
    if (selectedSeat?.id === drag.seatId) {
      setSelectedSeat({ ...selectedSeat, attributes: { ...selectedSeat.attributes, x_cord, y_cord } });
    }
    setDragSeat(null);
    moveSeat(drag.seatId, x_cord, y_cord);
  };

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && (selectedTicket || selectedSeat)) {
      setMode(null);
      setSelectedTicket(null);
      setSelectedSeat(null);
      setBottomDrawerOpen(false);
    }
    if (event.target !== viewportRef.current) return;
    if (event.key === '+' || event.key === '=') { event.preventDefault(); zoomFromCenter(1.25); }
    if (event.key === '-') { event.preventDefault(); zoomFromCenter(0.8); }
    if (event.key === '0') { event.preventDefault(); fitMap(); }
  };

  const selectedOrderId = selectedSeat?.attributes.item.data?.attributes.order.data?.id;
  const seatOrder = orders.find(order => order.id === selectedOrderId);
  const seatGroup = groups.find(group => group.id === seatOrder?.attributes.group.data?.id);
  const toggleFilter = (value: typeof filter.filter) => setFilter({ ...filter, filter: filter.filter === value ? null : value });
  const filters = [
    { value: 'show-class', label: 'Penkkiluokka' },
    { value: 'show-itemtype', label: 'Lippuluokka' },
    { value: 'highlight-group', label: 'Ryhmät' },
    { value: 'highlight-order', label: 'Tilaukset' },
    { value: 'special', label: 'Erikoispaikat' },
  ] as const;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#101a28]">
      <div className="z-20 shrink-0 border-b border-white/10 bg-[#172337] px-3 py-2 lg:px-4 lg:py-3">
        <div className="flex flex-wrap items-center justify-between gap-2 lg:gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-400">Salikartta</h2>
            <div className="flex flex-nowrap gap-1 overflow-x-auto rounded-lg bg-[#0e1929] p-1" aria-label="Kartan lohko">
              {sections.map(section => (
                <button key={section.id} type="button" onClick={() => setActiveSection(section.id)}
                  aria-pressed={activeSection?.id === section.id}
                  className={`shrink-0 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400 ${activeSection?.id === section.id ? 'bg-sky-500/20 text-sky-200' : 'text-slate-400 hover:bg-white/10 hover:text-white'}`}>
                  {section.attributes.Name}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={filter.showReserved} onChange={() => setFilter({ ...filter, showReserved: !filter.showReserved })} className="accent-sky-400" />
              Näytä varatut / vapaat
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={showBackground} onChange={() => setShowBackground(value => !value)} className="accent-sky-400" />
              Taustakartta
            </label>
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={showSeats} onChange={() => setShowSeats(value => !value)} className="accent-sky-400" />
              Paikat
            </label>
          </div>
        </div>
        <div className="mt-2 flex flex-nowrap gap-1.5 overflow-x-auto pb-0.5 lg:mt-3 lg:flex-wrap lg:overflow-visible" aria-label="Kartan väritys">
          {filters.map(option => (
            <button key={option.value} type="button" onClick={() => toggleFilter(option.value)} aria-pressed={filter.filter === option.value}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400 ${filter.filter === option.value ? 'border-sky-400/50 bg-sky-500/20 text-sky-100' : 'border-white/10 bg-white/5 text-slate-300 hover:border-white/30 hover:text-white'}`}>
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div ref={viewportRef} tabIndex={0} onKeyDown={handleKeyDown}
        className="relative min-h-[360px] flex-1 overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-400"
        style={{ touchAction: 'none', backgroundColor: '#adadad' }}
        aria-label="Salikartta. Vieritä hiirtä zoomataksesi kohdistimen kohdalle, vedä siirtääksesi karttaa.">
        <svg ref={svgRef} width="100%" height="100%" viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
          className="absolute inset-0 select-none" style={{ cursor: 'grab', touchAction: 'none' }}
          onPointerDown={handlePointerDown} onPointerMove={handlePointerMove} onPointerUp={handlePointerUp} onPointerCancel={handlePointerCancel}
          onDoubleClick={event => {
            event.preventDefault();
            const rect = viewportRef.current?.getBoundingClientRect();
            if (rect) zoomAt(event.clientX - rect.left, event.clientY - rect.top, 1.5);
          }}>
          <rect x={view.x} y={view.y} width={view.width} height={view.height} fill="#adadad" />
          {showBackground && image && <image href={`/api/admin/image?url=${encodeURIComponent(image.url)}`} x="0" y="0" width={worldWidth} height={worldHeight} preserveAspectRatio="none" />}
          {showSeats && <Seats section={activeSection} scale={worldScale}
            filter={filter} selectedSeat={selectedSeat} selectedGroup={selectedGroup} selectedOrder={selectedOrder}
            selectedIds={selectedIds} overrides={seatOverrides} suppressClickRef={suppressClickRef} onSeatClick={handleSeatClick}
            onSeatPointerDown={handleSeatPointerDown} onSeatPointerMove={handleSeatPointerMove} onSeatPointerUp={handleSeatPointerUp} />}
        </svg>

        <div className="absolute left-4 top-4 flex items-center gap-1 rounded-xl border border-white/10 bg-[#142235]/95 p-1 shadow-xl" aria-label="Kartan zoomaus">
          <button type="button" onClick={() => zoomFromCenter(1.3)} title="Lähennä" aria-label="Lähennä" className="h-9 w-9 rounded-lg text-xl text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">+</button>
          <output className="min-w-[55px] text-center text-xs font-semibold tabular-nums text-slate-200" aria-label="Zoomaustaso">{Math.round(view.fitWidth / view.width * 100)} %</output>
          <button type="button" onClick={() => zoomFromCenter(1 / 1.3)} title="Loitonna" aria-label="Loitonna" className="h-9 w-9 rounded-lg text-xl text-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">−</button>
          <span className="mx-1 h-5 w-px bg-white/15" />
          <button type="button" onClick={fitMap} title="Sovita kartta näkymään (0)" className="rounded-lg px-2.5 py-2 text-xs font-medium text-slate-200 hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-sky-400">Sovita</button>
        </div>

        {filter.showReserved && (
          <div className="absolute bottom-4 left-4 flex flex-wrap gap-x-3 gap-y-1 rounded-lg border border-white/10 bg-[#142235]/95 px-3 py-2 text-xs text-slate-200 shadow-lg" aria-label="Paikkojen tilat">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-[3px] border-[#19b77c] bg-[#292929]" />Vapaa</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-[3px] border-[#ee2725] bg-[#292929]" />Varattu</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-full border-[3px] border-[#8754dc] bg-[#292929]" />Liput lähetetty</span>
          </div>
        )}

        {currentMode === 'add-ticket-to-seat' || currentMode === 'change-ticket-seat' ? (
          <div className="absolute left-4 top-16 flex max-w-sm items-center gap-3 rounded-xl border border-amber-400/30 bg-[#322a20]/95 px-3 py-2 text-sm text-amber-100 shadow-xl">
            <span>Valitse vapaa paikka kartalta</span>
            <button type="button" className="font-semibold underline" onClick={() => { setMode(null); setSelectedTicket(null); }}>Peruuta</button>
          </div>
        ) : currentMode === 'add-seat' ? (
          <div className="absolute left-4 top-16 rounded-xl border border-sky-400/30 bg-[#142235]/95 px-3 py-2 text-xs text-sky-100 shadow-xl">Pidä Shift pohjassa ja klikkaa karttaa lisätäksesi istuimen</div>
        ) : currentMode === 'edit-seat' ? (
          <div className="absolute left-4 top-16 rounded-xl border border-sky-400/30 bg-[#142235]/95 px-3 py-2 text-xs text-sky-100 shadow-xl">Valitse istuin muokataksesi sitä · Shift + raahaa siirtääksesi istuinta</div>
        ) : currentMode === 'edit-row' ? (
          <div className="absolute left-4 top-16 rounded-xl border border-sky-400/30 bg-[#142235]/95 px-3 py-2 text-xs text-sky-100 shadow-xl">Valitse rivi · Shift + raahaa istuinta siirtääksesi koko riviä</div>
        ) : null}

        {filter.filter && (
          <div className="absolute right-4 top-4 max-w-[190px] rounded-xl border border-white/10 bg-[#142235]/95 p-3 text-xs text-slate-200 shadow-xl">
            <button type="button" onClick={() => setLegendOpen(!legendOpen)} aria-expanded={legendOpen} className="w-full text-left font-semibold text-white">
              {filters.find(option => option.value === filter.filter)?.label} <span className="float-right">{legendOpen ? '⌃' : '⌄'}</span>
            </button>
            {legendOpen && (filter.filter === 'show-class' || filter.filter === 'show-itemtype' ? (
              <div className="mt-2 grid gap-1.5">
                {Object.entries(colors).filter(([slug]) => filter.filter === 'show-itemtype' || slug !== 'opiskelija').map(([slug, color]) => (
                  <div key={slug} className="flex items-center gap-2"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: color }} />{slug}</div>
                ))}
              </div>
            ) : <p className="mt-2 leading-relaxed text-slate-400">{filter.filter === 'special' ? 'Erikoismerkityt paikat korostettu.' : 'Paikat väritetty ' + (filter.filter === 'highlight-group' ? 'ryhmän' : 'tilauksen') + ' mukaan.'}</p>)}
          </div>
        )}

        {bottomDrawerOpen && selectedSeat && (
          <div className="absolute inset-x-4 bottom-4 rounded-xl border border-white/15 bg-[#172337]/95 p-4 text-sm text-slate-200 shadow-2xl backdrop-blur-sm">
            <div className="flex items-start justify-between gap-3">
              <div><p className="text-xs font-semibold uppercase tracking-wide text-slate-400">Valittu paikka</p><h3 className="mt-1 text-lg font-bold text-white">Rivi {selectedSeat.attributes.Row} · Paikka {selectedSeat.attributes.Number}</h3></div>
              <button type="button" aria-label="Sulje paikan tiedot" onClick={() => { setBottomDrawerOpen(false); setSelectedSeat(null); }} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold hover:bg-white/10">Sulje</button>
            </div>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              <span>Luokka: <strong>{selectedSeat.attributes.item_type.data?.attributes.slug || 'Ei valittu'}</strong></span>
              {seatOrder && <button type="button" className="text-sky-300 underline" onClick={() => { setSelectedOrder(seatOrder); handleSetActiveTab('tilaukset'); }}>Tilaus: {seatOrder.attributes.customer.data?.attributes.firstName} {seatOrder.attributes.customer.data?.attributes.lastName}</button>}
              {seatGroup && <button type="button" className="text-sky-300 underline" onClick={() => { setSelectedGroup(seatGroup); handleSetActiveTab('ryhmat'); }}>Ryhmä: {seatGroup.attributes.name}</button>}
            </div>
            {selectedSeat.attributes.special?.trim() ? (
              <div className="mt-3 rounded-lg border border-red-400/60 bg-[#961816] px-3 py-2 text-sm text-white">
                <strong>Huomio:</strong> {selectedSeat.attributes.special}
              </div>
            ) : <p className="mt-3 text-slate-400">Huomio: Ei</p>}
          </div>
        )}
        <p className="pointer-events-none absolute bottom-4 right-4 hidden rounded-lg bg-[#142235]/85 px-3 py-2 text-xs text-slate-300 shadow-lg xl:block">Vieritä: zoomaa · Vedä: siirrä · Kaksoisklikkaa: lähennä</p>
      </div>
    </div>
  );
}
