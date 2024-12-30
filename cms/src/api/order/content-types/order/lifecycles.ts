import Mail from 'nodemailer/lib/mailer';
import {v4} from 'uuid';
type Event = {
  model: any,
  where: any,
  data: any,
  params: {
    data: any
    select: any
    where: any
    orderBy: any
    limit: any
    offset: any
    populate: any
  }
  result: any,
}
type Field = {
  id: number,
  label: string
  type: string
  required: boolean,
  fieldName: string,
}

const activeEmailSends = new Set();

const fillTemplatePatterns = (text: string, form: Field[], data: Record<string,string>,translation: Record<string,string>) => {
  form.forEach(field => {
    const regex = new RegExp(`{${field.fieldName}}`,'g');
    const replateString = field.type === 'checkbox' ? data[field.fieldName] ? translation.yes : translation.no : data[field.fieldName]
    text = text.replace(regex,`${replateString}`);
  });
  return text;
};

const sendConfirmationEmail = async (order: any) => {
  const customer = await strapi.query('api::customer.customer').findOne({
    where: {
      orders: {
        id: order.id,
      }
    }
  });

  if (!customer) {
    console.error("There is no customer for this order");
    return;
  }

  const [template, form, translation, tickets] = await Promise.all([
    strapi.query('api::email.email').findOne({
      where: {
        type: 'confirmation',
        locale: customer.locale,
      }
    }),
    strapi.query('api::contact-form.contact-form').findOne({
      where: {
        locale: customer.locale,
      },
      populate: {
        contactForm: true
      }
    }),
    strapi.query('api::translation.translation').findOne({}),
    strapi.query('api::item.item').findMany({
      where: {
        order: order.id,
      },
      populate: ['itemType'],
    })
  ]);

  // Generate localized ticket list
  const ticketList = tickets
    .map((ticket) => {
      const ticketType = translation[ticket.itemType.slug] || ticket.itemType.slug;
      return `- ${ticketType}`;
    })
    .join('\n');

  // Fill template placeholders
  let text = fillTemplatePatterns(
    template.text,
    form.contactForm,
    customer,
    translation
  );

  text = text
    .replace('{customerUid}', customer.uid)
    .replace('{ticketList}', ticketList);

  const mailOptions: Mail.Options = {
    to: customer.email,
    from: template.from,
    subject: template.subject,
    text: text,
  };

  try {
    if (customer.email) {
      await strapi.service('api::email.email').create(mailOptions);
    } else {
      const newSubject = `No email provided for order ${order.id} --- ${template.subject}`;
      await strapi.service('api::email.email').create({
        ...mailOptions,
        to: template.from,
        subject: newSubject,
      });
    }
  } catch (error) {
    console.error(`Order id: ${order.id} had an issue sending the email`);
  }
};

const sendTicketEmail = async (order: any) => {
  const customer = await strapi.query('api::customer.customer').findOne({
    where: {
      orders: {
        id: order.id,
      },
    },
  });

  if (!customer) {
    console.error("There is no customer for this order");
    return;
  }

  const [template, form, translation, tickets] = await Promise.all([
    strapi.query('api::email.email').findOne({
      where: {
        type: 'tickets',
        locale: customer.locale,
      },
    }),
    strapi.query('api::contact-form.contact-form').findOne({
      where: {
        locale: customer.locale,
      },
      populate: {
        contactForm: true,
      },
    }),
    strapi.query('api::translation.translation').findOne({}),
    strapi.query('api::item.item').findMany({
      where: {
        order: order.id,
      },
      populate: ['itemType', 'seat', 'seat.section'],
    }),
  ]);

  // Generate ticket list with seat details
  const ticketList = tickets
    .map((ticket) => {
      const ticketType = translation[ticket.itemType.slug] || ticket.itemType.slug;
      const section = ticket.seat?.section?.Name || translation.UnknownSection;
      const row = ticket.seat?.Row || translation.UnknownRow;
      const number = ticket.seat?.Number || translation.UnknownNumber;

      return `${ticketType} - ${section}, ${translation.row} ${row}, ${translation.seat} ${number}`;
    })
    .join('\n');

  // Fill template placeholders
  let text = fillTemplatePatterns(
    template.text,
    form.contactForm,
    customer,
    translation
  );

  text = text
    .replace('{customerUid}', customer.uid)
    .replace('{ticketList}', ticketList); // Replace ticket list placeholder

  const mailOptions: Mail.Options = {
    to: customer.email,
    from: template.from,
    subject: template.subject,
    text: text,
  };

  try {
    if (customer.email) {
      await strapi.service('api::email.email').create(mailOptions);
    } else {
      const newSubject = `No email provided for order ${order.id} --- ${template.subject}`;
      await strapi.service('api::email.email').create({
        ...mailOptions,
        to: template.from,
        subject: newSubject,
      });
    }
  } catch (error) {
    console.error(`Order id: ${order.id} had an issue sending the email`);
  }
};


export default {
  beforeCreate(event: Event) {
    const { data } = event.params;
    data.status = 'new';
    data.uid = v4();
  },

  async beforeUpdate(event: Event) {
    const { where: { id }, data } = event.params;

    const order = await strapi.query('api::order.order').findOne({
      where: { id },
    });

    if (!order) {
      console.error(`Order with ID ${id} not found.`);
      return;
    }

    if (order.status !== 'ok' && data.status === 'ok') {
      if (!activeEmailSends.has(id)) {
        activeEmailSends.add(id);
        console.log(`Order ${id} status ${order.status} -> ${data.status}, sending confirmation email...`);
        try {
          await sendConfirmationEmail(order);
        } catch (err) {
          console.error(`Failed to send confirmation email for order ${id}:`, err);
        } finally {
          activeEmailSends.delete(id);
        }
      } else {
        console.log(`Confirmation email for order ${id} is already being sent.`);
      }
    }

    if (!order.tickets_sent && data.tickets_sent === true) {
      if (!activeEmailSends.has(id)) {
        activeEmailSends.add(id);
        console.log(`Sending tickets for order ${id}...`);
        try {
          await sendTicketEmail(order);
        } catch (err) {
          console.error(`Failed to send ticket email for order ${id}:`, err);
        } finally {
          activeEmailSends.delete(id);
        }
      } else {
        console.log(`Ticket email for order ${id} is already being sent.`);
      }
    }
  },
};
