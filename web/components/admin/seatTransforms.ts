import { Seat, Section } from '@/utils/models';

export type RowTransform = { dx: number; dy: number; scaleX: number; scaleY: number; rotation: number };

export const DEFAULT_ROW_TRANSFORM: RowTransform = { dx: 0, dy: 0, scaleX: 1, scaleY: 1, rotation: 0 };

export const isIdentityTransform = (transform: RowTransform) =>
  transform.dx === 0 &&
  transform.dy === 0 &&
  transform.scaleX === 1 &&
  transform.scaleY === 1 &&
  transform.rotation === 0;

export const getSectionRows = (section: Section | null): string[] => {
  if (!section) return [];
  const rows = new Set<string>();
  section.attributes.seats.data.forEach(seat => {
    if (seat.attributes.Row) rows.add(seat.attributes.Row);
  });
  return Array.from(rows).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
};

export const getRowSeats = (section: Section | null, row: string | null): Seat[] => {
  if (!section || row === null) return [];
  return section.attributes.seats.data.filter(seat => seat.attributes.Row === row);
};

/**
 * Applies a move/scale/rotate transform to a row of seats around the row's
 * centroid and returns the resulting coordinates per seat id. Coordinates are
 * in background-image pixel space, which is how seats are stored.
 */
export const transformRowSeats = (
  seats: Seat[],
  transform: RowTransform
): Record<number, { x_cord: number; y_cord: number }> => {
  if (!seats.length) return {};

  const centerX = seats.reduce((sum, seat) => sum + seat.attributes.x_cord, 0) / seats.length;
  const centerY = seats.reduce((sum, seat) => sum + seat.attributes.y_cord, 0) / seats.length;
  const radians = (transform.rotation * Math.PI) / 180;
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);

  const result: Record<number, { x_cord: number; y_cord: number }> = {};
  seats.forEach(seat => {
    const px = (seat.attributes.x_cord - centerX) * transform.scaleX;
    const py = (seat.attributes.y_cord - centerY) * transform.scaleY;
    result[seat.id] = {
      x_cord: centerX + px * cos - py * sin + transform.dx,
      y_cord: centerY + px * sin + py * cos + transform.dy,
    };
  });
  return result;
};
