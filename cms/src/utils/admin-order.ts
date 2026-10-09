import type { Strapi } from '@strapi/strapi';

const MAX_TICKETS = 1000;
const TEXT_FIELDS = [
  'firstName', 'lastName', 'email', 'phone', 'postalCode', 'startYear', 'extra',
  'diet', 'group', 'avec', 'representativeOf', 'special_arragements',
] as const;
const CHECKBOX_FIELDS = ['accept', 'nonalcoholic', 'greeting'] as const;

export class AdminOrderInputError extends Error {}

export type AdminOrderInput = {
  customer: Record<string, string | boolean>;
  kutsuvieras: boolean;
  status: 'admin-new' | 'ok';
  tickets: { itemTypeId: number; quantity: number }[];
};

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseAdminOrderInput = (body: unknown): AdminOrderInput => {
  if (!isObject(body) || !isObject(body.customer)) {
    throw new AdminOrderInputError('Asiakkaan tiedot puuttuvat.');
  }

  // Only customer information can be supplied, never ids, UIDs or relations.
  const customer: AdminOrderInput['customer'] = {};
  for (const field of TEXT_FIELDS) {
    const value = body.customer[field];
    if (value === undefined) continue;
    const maxLength = field === 'extra' || field === 'special_arragements' ? 10000 : 255;
    if (typeof value !== 'string' || value.length > maxLength) {
      throw new AdminOrderInputError(`Asiakastieto ${field} on virheellinen tai liian pitkä.`);
    }
    customer[field] = value.trim();
  }
  if (!customer.firstName || !customer.lastName) {
    throw new AdminOrderInputError('Anna asiakkaan etu- ja sukunimi.');
  }
  if (customer.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email as string)) {
    throw new AdminOrderInputError('Sähköpostiosoite on virheellinen.');
  }
  for (const field of CHECKBOX_FIELDS) {
    const value = body.customer[field];
    if (value !== undefined && typeof value !== 'boolean') {
      throw new AdminOrderInputError(`Asiakastieto ${field} on virheellinen.`);
    }
    customer[field] = value === true;
  }
  const locale = body.customer.locale ?? 'fi';
  if (locale !== 'fi' && locale !== 'en') {
    throw new AdminOrderInputError('Valitse asiakkaan kieleksi suomi tai englanti.');
  }
  customer.locale = locale;

  if (body.kutsuvieras !== undefined && typeof body.kutsuvieras !== 'boolean') {
    throw new AdminOrderInputError('Kutsuvierasvalinta on virheellinen.');
  }
  const kutsuvieras = body.kutsuvieras === true;
  const status = body.status ?? 'admin-new';
  if (status !== 'admin-new' && status !== 'ok') {
    throw new AdminOrderInputError('Tilauksen tila on virheellinen.');
  }

  if (!Array.isArray(body.tickets) || !body.tickets.length || body.tickets.length > MAX_TICKETS) {
    throw new AdminOrderInputError('Valitse vähintään yksi lippu.');
  }
  const seenTypes = new Set<number>();
  let total = 0;
  const tickets = body.tickets.map(ticket => {
    if (!isObject(ticket) || !Number.isSafeInteger(ticket.itemTypeId) || (ticket.itemTypeId as number) <= 0
      || !Number.isSafeInteger(ticket.quantity) || (ticket.quantity as number) <= 0) {
      throw new AdminOrderInputError('Lippumäärien on oltava positiivisia kokonaislukuja.');
    }
    const itemTypeId = ticket.itemTypeId as number;
    const quantity = ticket.quantity as number;
    if (seenTypes.has(itemTypeId)) {
      throw new AdminOrderInputError('Sama lipputyyppi on valittu useammin kuin kerran.');
    }
    seenTypes.add(itemTypeId);
    total += quantity;
    if (total > MAX_TICKETS) {
      throw new AdminOrderInputError(`Tilauksessa voi olla enintään ${MAX_TICKETS} lippua.`);
    }
    return { itemTypeId, quantity };
  });

  return { customer, kutsuvieras, status: kutsuvieras ? 'ok' : status, tickets };
};

export const createAdminOrder = async (strapi: Strapi, body: unknown) => {
  const input = parseAdminOrderInput(body);

  // The customer, order and individual tickets must either all be saved or all
  // rolled back. Admin orders deliberately bypass public checkout limits.
  return strapi.db.transaction(async () => {
    const itemTypes = await strapi.query('api::item-type.item-type').findMany({
      where: { id: { $in: input.tickets.map(ticket => ticket.itemTypeId) } },
      select: ['id'],
    });
    if (itemTypes.length !== input.tickets.length) {
      throw new AdminOrderInputError('Yhtä valituista lipputyypeistä ei enää ole olemassa.');
    }

    const customer = await strapi.query('api::customer.customer').create({ data: input.customer });
    const order = await strapi.query('api::order.order').create({
      data: {
        customer: customer.id,
        status: input.status,
        kutsuvieras: input.kutsuvieras,
        tickets_sent: false,
      },
    });
    for (const ticket of input.tickets) {
      for (let index = 0; index < ticket.quantity; index++) {
        await strapi.query('api::item.item').create({
          data: { order: order.id, itemType: ticket.itemTypeId },
        });
      }
    }
    return strapi.query('api::order.order').findOne({
      where: { id: order.id },
      populate: ['customer', 'group', 'items.itemType', 'items.seat', 'items.seat.section'],
    });
  });
};
