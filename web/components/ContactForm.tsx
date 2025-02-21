"use client";

import { FormEvent } from 'react';
import { ContactForm, Customer, Item} from '@/utils/models';
import { getContactForm } from '@/utils/helpers';
import { useTranslation } from "@/context/useTranslation";


type Props = {
  locale: string;
  contactForms: ContactForm[];
  customer: Customer;
  items: Item[];
  onSubmit?: () => void | Promise<void>;
  text?: "next" | "send";
}

const Form = ({locale, contactForms, customer, items, onSubmit=() => Promise.resolve(), text }: Props) => {
  const { translation } = useTranslation(locale);
  const contactForm = getContactForm(contactForms || [], items);
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const updateFields = Object.fromEntries(form.entries()) as Record<string,string | boolean | number>;
    contactForm.forEach(field => {
      if (field.type === 'checkbox') {
        updateFields[field.fieldName] = form.has(field.fieldName);
      }
    });
    updateFields.locale = locale;
    delete updateFields.createdAt;
    delete updateFields.updatedAt;
    delete updateFields.publishedAt;
    const payload = {
      data: updateFields,
      customerUid: customer.attributes.uid,
    }
    await fetch(`/api/customers`, {
      method: 'PUT',
      body: JSON.stringify(payload)
    });
    onSubmit();
  };
  const getFieldValue = (key: keyof Customer["attributes"]) => {
    return customer.attributes[key] as string;
  };
  return (
    <form className='mb-6 text-secondary-800 dark:text-secondary-100' 
          onSubmit={handleSubmit}>
      {contactForm.map(field => (
        field.type === 'checkbox' ?
        <div className="mb-8 flex items-center" key={field.fieldName}>
          <label className='block p-1 flex-1'>
          {field.label}{field.required && '*'}
          {field.description && <p className='text-sm text-gray-500'>{field.description}</p>}
          </label>
          <div className='flex-1'>
            <input
              className='tx-input mt-2 accent-primary-500 !w-4 !h-4'
              type={field.type}
              id={field.fieldName}
              name={field.fieldName}
              defaultChecked={field.type === 'checkbox' ? !!getFieldValue(field.fieldName) : undefined}
              defaultValue={field.type !== 'checkbox' ? getFieldValue(field.fieldName) : undefined}
              required={field.required}
            />
          </div>
        </div>
        :
        <div className="mb-8" key={field.fieldName}>
          <label className='block p-1'>
          {field.label}{field.required && '*'}
          {field.description && <p className='text-sm text-gray-500'>{field.description}</p>}
          </label>
          <input
            className='tx-input mt-2'
            type={field.type}
            id={field.fieldName}
            name={field.fieldName}
            defaultValue={getFieldValue(field.fieldName)}
            required={field.required}
          />
        </div>
      ))}
      <div className='float-right'>
        <button className='btn h-12'>{text === 'next' ? translation.next : translation.send}</button>
      </div>
    </form>
  );
}

export default Form;