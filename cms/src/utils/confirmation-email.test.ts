import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { Strapi } from '@strapi/strapi';
import { sendConfirmationEmail } from '../api/order/content-types/order/lifecycles';

const emailFixture = (locale: string | null = 'en', failSend = false) => {
  const queries: { uid: string; locale: string }[] = [];
  const mails: Record<string, unknown>[] = [];
  const customer = { firstName: 'Aino', lastName: 'Example', email: 'aino@example.invalid', uid: 'customer-uid', locale, accept: false };
  const strapi = {
    query(uid: string) {
      return {
        async findOne(params: { where: { locale: string } }) {
          if (uid === 'api::customer.customer') return customer;
          queries.push({ uid, locale: params.where.locale });
          if (uid === 'api::email.email') return {
            from: 'tickets@example.invalid', subject: 'Order confirmation',
            text: 'Hello {firstName} {lastName}\n{ticketList}\n/edit/{customerUid}\nPhone: {phone}\nPublic name: {accept}',
          };
          if (uid === 'api::contact-form.contact-form') return {
            contactForm: [
              { fieldName: 'firstName', type: 'text' }, { fieldName: 'lastName', type: 'text' },
              { fieldName: 'phone', type: 'text' }, { fieldName: 'accept', type: 'checkbox' },
            ],
          };
          if (uid === 'api::translation.translation') return {
            translations: [{ key: 'deluxe', value: 'DeLuxe ticket' }, { key: 'yes', value: 'Yes' }, { key: 'no', value: 'No' }],
          };
          throw new Error(`Unexpected query ${uid}`);
        },
        async findMany() {
          assert.equal(uid, 'api::item.item');
          return [{ itemType: { slug: 'deluxe' } }, { itemType: { slug: 'deluxe' } }];
        },
      };
    },
    service(uid: string) {
      assert.equal(uid, 'api::email.email');
      return { async create(mail: Record<string, unknown>) {
        if (failSend) throw new Error('SMTP unavailable');
        mails.push(mail);
      } };
    },
  } as unknown as Required<Strapi>;
  return { strapi, queries, mails };
};

test('uses the normal localized confirmation template with customer UID and full ticket list', async context => {
  const original = global.strapi;
  context.after(() => { global.strapi = original; });
  const fixture = emailFixture();
  global.strapi = fixture.strapi;
  await sendConfirmationEmail({ id: 7 });
  assert(fixture.queries.every(query => query.locale === 'en'));
  assert.equal(fixture.mails.length, 1);
  assert.equal(fixture.mails[0].to, 'aino@example.invalid');
  assert.equal(fixture.mails[0].subject, 'Order confirmation');
  assert.equal(fixture.mails[0].text, 'Hello Aino Example\n- DeLuxe ticket\n- DeLuxe ticket\n/edit/customer-uid\nPhone: \nPublic name: No');
});

test('uses Finnish confirmation content when the customer has no locale', async context => {
  const original = global.strapi;
  context.after(() => { global.strapi = original; });
  const fixture = emailFixture(null);
  global.strapi = fixture.strapi;
  await sendConfirmationEmail({ id: 7 });
  assert(fixture.queries.every(query => query.locale === 'fi'));
});

test('surfaces delivery errors so admin creation can report the failed email', async context => {
  const original = global.strapi;
  context.after(() => { global.strapi = original; });
  const fixture = emailFixture('en', true);
  global.strapi = fixture.strapi;
  await assert.rejects(sendConfirmationEmail({ id: 7 }), /SMTP unavailable/);
  assert.equal(fixture.mails.length, 0);
});
