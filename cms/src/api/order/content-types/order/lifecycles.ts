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
  if(!customer) {
    console.error("There is no customer for this order");
    return;
  }
  const [template, form, translation] = await Promise.all([
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
    strapi.query('api::translation.translation').findOne({})
  ]);

  const text = fillTemplatePatterns(
    template.text,
    form.contactForm,
    customer,
    translation).replace('{customerUid}',customer.uid);
  const mailOptions: Mail.Options = {
    to: customer.email,
    from: template.from,
    subject: template.subject,
    text: text,
  }
  try {
    await strapi.service('api::email.email').create(mailOptions);
  } catch(error) {
    console.error(`Order id: ${order.id} had an issue sending the email`);
  }
}

export default {
  beforeCreate(event: Event) {
    const { data } = event.params;
    data.status = 'new'
    data.uid = v4();
  },
  async beforeUpdate(event: Event) {
    const {where: {id}, data} = event.params;
    const order = await strapi.query('api::order.order').findOne({
      where: {
        id,
      }
    });
    if(order.status !== 'ok' && data.status === 'ok') {
      sendConfirmationEmail(order);
    }
  },
}