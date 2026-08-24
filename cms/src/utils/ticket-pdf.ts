/**
 * PDF ticket generation.
 *
 * Tickets are rendered with pdfkit, one page per order item. The layout is
 * driven by the localized `ticket-template` single type: an optional
 * background image plus repeatable positioned text fields with placeholder
 * support. When no text fields are defined a built-in layout is used, and
 * when no template entry exists at all no PDF is generated.
 */
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

// PDF coordinates are in points, template coordinates in millimeters
const MM = 72 / 25.4;
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;

type TemplateField = {
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  color?: string;
  bold?: boolean;
  align?: 'left' | 'center' | 'right';
};

const fillPlaceholders = (text: string, values: Record<string, string>) =>
  text.replace(/\{(\w+)\}/g, (match, key) => values[key] ?? match);

// Only local uploads are supported; pdfkit can embed PNG and JPEG
const resolveUploadPath = (media: any): string | null => {
  const url = media?.url;
  if (typeof url !== 'string' || !url.startsWith('/')) return null;
  const filePath = path.join(strapi.dirs.static.public, url);
  if (!/\.(png|jpe?g)$/i.test(filePath) || !fs.existsSync(filePath)) return null;
  return filePath;
};

const drawText = (doc: PDFKit.PDFDocument, field: TemplateField, values: Record<string, string>) => {
  const text = fillPlaceholders(field.text, values);
  doc
    .font(field.bold ? 'Helvetica-Bold' : 'Helvetica')
    .fontSize(field.fontSize || 12)
    .fillColor(field.color || '#000000');
  let x = field.x * MM;
  if (field.align === 'center') {
    x -= doc.widthOfString(text) / 2;
  } else if (field.align === 'right') {
    x -= doc.widthOfString(text);
  }
  doc.text(text, x, field.y * MM, { lineBreak: false });
};

const drawDefaultLayout = (
  doc: PDFKit.PDFDocument,
  template: any,
  values: Record<string, string>,
  translations: Record<string, string>,
  pageWidth: number,
) => {
  const accent = template.accentColor || '#1f2937';
  const margin = 15 * MM;

  // Header band
  doc.rect(0, 0, pageWidth, 32 * MM).fill(accent);
  doc.font('Helvetica-Bold').fontSize(24).fillColor('#ffffff');
  doc.text(values.eventName || '', margin, 10 * MM, { lineBreak: false });
  doc.font('Helvetica').fontSize(12);
  doc.text([values.eventDate, values.venue].filter(Boolean).join(' · '), margin, 22 * MM, { lineBreak: false });

  // Ticket type and holder
  doc.font('Helvetica-Bold').fontSize(20).fillColor('#000000');
  doc.text(values.ticketType, margin, 45 * MM, { lineBreak: false });
  doc.font('Helvetica').fontSize(14);
  doc.text(`${values.firstName} ${values.lastName}`.trim(), margin, 55 * MM, { lineBreak: false });

  // Seat box
  const boxY = 68 * MM;
  const boxWidth = pageWidth - 2 * margin;
  doc.roundedRect(margin, boxY, boxWidth, 28 * MM, 3 * MM).lineWidth(1).stroke(accent);
  const columns: [string, string][] = [
    [translations.section || 'Section', values.section],
    [translations.row || 'Row', values.row],
    [translations.seat || 'Seat', values.seat],
  ];
  columns.forEach(([label, value], index) => {
    const columnX = margin + (boxWidth / 3) * index;
    const columnCenter = columnX + boxWidth / 6;
    doc.font('Helvetica').fontSize(10).fillColor('#666666');
    doc.text(label, columnCenter - doc.widthOfString(label) / 2, boxY + 6 * MM, { lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(20).fillColor('#000000');
    doc.text(value, columnCenter - doc.widthOfString(value) / 2, boxY + 13 * MM, { lineBreak: false });
  });

  // Order details
  doc.font('Helvetica').fontSize(10).fillColor('#666666');
  doc.text(
    `#${values.orderNumber} · ${values.ticketNumber}/${values.ticketCount}`,
    margin,
    boxY + 34 * MM,
    { lineBreak: false },
  );

  // Info text
  if (template.infoText) {
    doc.font('Helvetica').fontSize(10).fillColor('#000000');
    doc.text(fillPlaceholders(template.infoText, values), margin, boxY + 44 * MM, {
      width: boxWidth,
    });
  }
};

export const generateTicketsPdf = async (input: {
  template: any;
  order: any;
  customer: any;
  tickets: any[];
  translations: Record<string, string>;
}): Promise<Buffer> => {
  const { template, order, customer, tickets, translations } = input;

  const pageWidth = (template.pageWidthMm || A4_WIDTH_MM) * MM;
  const pageHeight = (template.pageHeightMm || A4_HEIGHT_MM) * MM;
  const doc = new PDFDocument({
    size: [pageWidth, pageHeight],
    margin: 0,
    autoFirstPage: false,
    info: { Title: template.eventName || 'Tickets' },
  });

  const chunks: Buffer[] = [];
  doc.on('data', (chunk) => chunks.push(chunk));
  const done = new Promise<Buffer>((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });

  const backgroundPath = resolveUploadPath(template.backgroundImage);
  const fields: TemplateField[] = Array.isArray(template.fields) ? template.fields : [];

  tickets.forEach((ticket, index) => {
    const values: Record<string, string> = {
      eventName: template.eventName || '',
      eventDate: template.eventDate || '',
      venue: template.venue || '',
      ticketType: translations[ticket.itemType?.slug] || ticket.itemType?.slug || '',
      section: ticket.seat?.section?.Name || '-',
      row: ticket.seat?.Row || '-',
      seat: ticket.seat?.Number || '-',
      firstName: customer.firstName || '',
      lastName: customer.lastName || '',
      email: customer.email || '',
      orderNumber: String(order.id),
      groupName: order.group?.name || '',
      ticketNumber: String(index + 1),
      ticketCount: String(tickets.length),
    };

    doc.addPage();
    if (backgroundPath) {
      doc.image(backgroundPath, 0, 0, { width: pageWidth, height: pageHeight });
    }
    if (fields.length > 0) {
      fields.forEach((field) => drawText(doc, field, values));
    } else {
      drawDefaultLayout(doc, template, values, translations, pageWidth);
    }
  });

  doc.end();
  return done;
};

/**
 * Load everything needed for an order's tickets and render the PDF.
 * Returns null when no ticket template has been configured.
 */
export const buildTicketsPdfForOrder = async (orderId: number | string): Promise<Buffer | null> => {
  const order = await strapi.query('api::order.order').findOne({
    where: { id: orderId },
    populate: { group: true },
  });
  if (!order) {
    throw new Error(`Order ${orderId} not found`);
  }

  const customer = await strapi.query('api::customer.customer').findOne({
    where: {
      orders: { id: order.id },
    },
  });
  if (!customer) {
    throw new Error(`Order ${orderId} has no customer`);
  }

  const template =
    (await strapi.query('api::ticket-template.ticket-template').findOne({
      where: { locale: customer.locale },
      populate: { backgroundImage: true, fields: true },
    })) ??
    (await strapi.query('api::ticket-template.ticket-template').findOne({
      where: {},
      populate: { backgroundImage: true, fields: true },
    }));
  if (!template) {
    return null;
  }

  const [translation, tickets] = await Promise.all([
    strapi.query('api::translation.translation').findOne({
      where: { locale: customer.locale },
      populate: ['translations'],
    }),
    strapi.query('api::item.item').findMany({
      where: { order: order.id },
      populate: ['itemType', 'seat', 'seat.section'],
    }),
  ]);

  const translations = (translation?.translations ?? []).reduce((acc, entry) => {
    acc[entry.key] = entry.value;
    return acc;
  }, {} as Record<string, string>);

  return generateTicketsPdf({ template, order, customer, tickets, translations });
};
