import assert from 'node:assert/strict';
import { test } from 'node:test';
import { AdminOrderInputError, parseAdminOrderInput } from './admin-order';

const validOrder = () => ({
  customer: { firstName: ' Aino ', lastName: ' Example ', email: ' aino@example.invalid ', locale: 'fi' },
  kutsuvieras: false,
  status: 'admin-new',
  tickets: [{ itemTypeId: 1, quantity: 50 }, { itemTypeId: 2, quantity: 2 }],
});

test('normalizes customer information and excludes supplied ids and relations', () => {
  const input = validOrder();
  Object.assign(input.customer, { id: 42, uid: 'spoofed', orders: [99], accept: true });
  const result = parseAdminOrderInput(input);
  assert.equal(result.customer.firstName, 'Aino');
  assert.equal(result.customer.lastName, 'Example');
  assert.equal(result.customer.email, 'aino@example.invalid');
  assert.equal(result.customer.accept, true);
  assert.equal(result.customer.nonalcoholic, false);
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
});

test('rejects invalid customer information and unsupported order states', () => {
  const invalidOrders = [
    null, [], {},
    { ...validOrder(), customer: [] },
    { ...validOrder(), customer: { ...validOrder().customer, firstName: '  ' } },
    { ...validOrder(), customer: { ...validOrder().customer, lastName: null } },
    { ...validOrder(), customer: { ...validOrder().customer, email: 'invalid' } },
    { ...validOrder(), customer: { ...validOrder().customer, phone: 123 } },
    { ...validOrder(), customer: { ...validOrder().customer, locale: 'sv' } },
    { ...validOrder(), customer: { ...validOrder().customer, accept: 'true' } },
    { ...validOrder(), customer: { ...validOrder().customer, firstName: 'x'.repeat(256) } },
    { ...validOrder(), kutsuvieras: 'false' },
    { ...validOrder(), status: 'new' },
  ];
  for (const input of invalidOrders) assert.throws(() => parseAdminOrderInput(input), AdminOrderInputError);
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
