import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Strapi } from '@strapi/strapi';
import { AdminOrderInputError, createAdminOrder, parseAdminOrderInput } from './admin-order';

const validOrder = () => ({
  customer: { firstName: ' Aino ', lastName: ' Example ', email: ' aino@example.invalid ', locale: 'fi' },
  kutsuvieras: false,
  status: 'admin-new',
  tickets: [{ itemTypeId: 1, quantity: 50 }, { itemTypeId: 2, quantity: 2 }],
});

test('normalizes customer information and excludes supplied ids and relations', () => {
  const input = validOrder();
  Object.assign(input.customer, { id: 42, uid: 'spoofed', orders: [99], phone: '123', accept: true });
  const result = parseAdminOrderInput(input);
  assert.equal(result.customer.firstName, 'Aino');
  assert.equal(result.customer.lastName, 'Example');
  assert.equal(result.customer.email, 'aino@example.invalid');
  assert.equal(result.customer.accept, undefined);
  assert.equal(result.customer.phone, undefined);
  assert.equal(result.customer.uid, undefined);
  assert.equal(result.customer.id, undefined);
  assert.equal(result.customer.orders, undefined);
  assert.deepEqual(result.tickets, input.tickets);
  assert.equal(result.status, 'admin-new');
});

test('invited guests are completed without requiring online payment', () => {
  const result = parseAdminOrderInput({ ...validOrder(), kutsuvieras: true });
  assert.equal(result.status, 'ok');
  assert.equal(result.kutsuvieras, true);
});

test('supports separately paid orders and customers without an email address', () => {
  const input = validOrder();
  input.status = 'ok';
  input.customer.email = '';
  input.customer.locale = 'en';
  const result = parseAdminOrderInput(input);
  assert.equal(result.status, 'ok');
  assert.equal(result.customer.email, '');
  assert.equal(result.customer.locale, 'en');
});

test('defaults to a non-expiring unpaid order with Finnish customer language', () => {
  const result = parseAdminOrderInput({
    customer: { firstName: 'Aino', lastName: 'Example' },
    tickets: [{ itemTypeId: 1, quantity: 1 }],
  });
  assert.equal(result.status, 'admin-new');
  assert.equal(result.kutsuvieras, false);
  assert.equal(result.customer.locale, 'fi');
  assert.equal(result.sendConfirmation, false);
});

test('rejects invalid customer information and unsupported order states', () => {
  const invalidOrders = [
    null, [], {},
    { ...validOrder(), customer: [] },
    { ...validOrder(), customer: { ...validOrder().customer, firstName: '  ' } },
    { ...validOrder(), customer: { ...validOrder().customer, lastName: null } },
    { ...validOrder(), customer: { ...validOrder().customer, email: 'invalid' } },
    { ...validOrder(), customer: { ...validOrder().customer, special_arragements: 123 } },
    { ...validOrder(), customer: { ...validOrder().customer, locale: 'sv' } },
    { ...validOrder(), customer: { ...validOrder().customer, firstName: 'x'.repeat(256) } },
    { ...validOrder(), kutsuvieras: 'false' },
    { ...validOrder(), status: 'new' },
  ];
  for (const input of invalidOrders) assert.throws(() => parseAdminOrderInput(input), AdminOrderInputError);
});

test('confirmation email is opt-in and requires a valid customer email', () => {
  assert.equal(parseAdminOrderInput({ ...validOrder(), sendConfirmation: true }).sendConfirmation, true);
  assert.throws(() => parseAdminOrderInput({ ...validOrder(), sendConfirmation: 'true' }), AdminOrderInputError);
  for (const email of ['', '   ', undefined, 'invalid']) {
    assert.throws(() => parseAdminOrderInput({
      ...validOrder(), customer: { ...validOrder().customer, email }, sendConfirmation: true,
    }), AdminOrderInputError);
  }
});

const creationFixture = (failTicket = false) => {
  let committed = false;
  let ticketCount = 0;
  const savedOrder = { id: 7 };
  const strapi = {
    db: {
      async transaction(callback: () => Promise<unknown>) {
        const result = await callback();
        committed = true;
        return result;
      },
    },
    query(uid: string) {
      if (uid === 'api::item-type.item-type') return { findMany: async () => [{ id: 1 }, { id: 2 }] };
      if (uid === 'api::customer.customer') return { create: async () => ({ id: 3 }) };
      if (uid === 'api::order.order') return { create: async () => savedOrder, findOne: async () => savedOrder };
      if (uid === 'api::item.item') return { create: async () => {
        if (failTicket) throw new Error('Ticket creation failed');
        return { id: ++ticketCount };
      } };
      throw new Error(`Unexpected query ${uid}`);
    },
    log: { error() {} },
  } as unknown as Strapi;
  return { strapi, savedOrder, isCommitted: () => committed, getTicketCount: () => ticketCount };
};

test('sends confirmation only after committing the order and all its tickets', async () => {
  const fixture = creationFixture();
  let emailCount = 0;
  const result = await createAdminOrder(fixture.strapi, { ...validOrder(), sendConfirmation: true }, async order => {
    assert.equal(fixture.isCommitted(), true);
    assert.equal(fixture.getTicketCount(), 52);
    assert.equal(order.id, fixture.savedOrder.id);
    emailCount++;
  });
  assert.equal(emailCount, 1);
  assert.equal(result.confirmationEmailStatus, 'sent');
  assert.equal(result.order.id, fixture.savedOrder.id);
});

test('does not send confirmation unless requested', async () => {
  const fixture = creationFixture();
  const result = await createAdminOrder(fixture.strapi, validOrder(), async () => assert.fail('Unexpected email'));
  assert.equal(result.confirmationEmailStatus, 'not-requested');
});

test('reports email failure while retaining the successfully created order', async () => {
  const fixture = creationFixture();
  const result = await createAdminOrder(fixture.strapi, { ...validOrder(), sendConfirmation: true }, async () => {
    throw new Error('SMTP unavailable');
  });
  assert.equal(fixture.isCommitted(), true);
  assert.equal(result.order.id, fixture.savedOrder.id);
  assert.equal(result.confirmationEmailStatus, 'failed');
});

test('does not send confirmation when ticket creation fails', async () => {
  const fixture = creationFixture(true);
  await assert.rejects(createAdminOrder(fixture.strapi, { ...validOrder(), sendConfirmation: true }, async () => assert.fail('Unexpected email')), /Ticket creation failed/);
  assert.equal(fixture.isCommitted(), false);
});

test('rejects empty, fractional, negative, duplicate and malformed ticket quantities', () => {
  const invalidTickets = [
    [], null, '1', [null],
    [{ itemTypeId: 1, quantity: 0 }],
    [{ itemTypeId: 1, quantity: -1 }],
    [{ itemTypeId: 1, quantity: 1.5 }],
    [{ itemTypeId: 1, quantity: '2' }],
    [{ itemTypeId: 0, quantity: 1 }],
    [{ itemTypeId: '1', quantity: 1 }],
    [{ itemTypeId: 1, quantity: 1 }, { itemTypeId: 1, quantity: 2 }],
  ];
  for (const tickets of invalidTickets) {
    assert.throws(() => parseAdminOrderInput({ ...validOrder(), tickets }), AdminOrderInputError);
  }
});

test('allows large groups up to 1000 tickets and enforces the combined limit', () => {
  assert.equal(parseAdminOrderInput({ ...validOrder(), tickets: [{ itemTypeId: 1, quantity: 1000 }] }).tickets[0].quantity, 1000);
  assert.throws(() => parseAdminOrderInput({
    ...validOrder(), tickets: [{ itemTypeId: 1, quantity: 600 }, { itemTypeId: 2, quantity: 401 }],
  }), AdminOrderInputError);
});
