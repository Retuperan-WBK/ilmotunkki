"use client";

import { ChangeEvent, FormEvent, useContext, useEffect, useState } from 'react';
import { fetchAPI } from '@/lib/api';
import { AppContext } from '@/context/AppContext';
import { ContactForm, Customer} from '@/utils/models';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getContactForm } from '@/utils/helpers';
import { useTranslation } from "@/context/useTranslation";

import useSWR from 'swr';


type Props = {
  locale: string;
}
const Form = ({locale}: Props) => {
  const { translation } = useTranslation(locale);
  const router = useRouter();
  const {data: contactForms} = useSWR('/contact-forms', url => fetchAPI<ContactForm[]>(url,{},{
    locale,
    populate: ['contactForm','itemTypes']
  }))
  const {customer, refreshFields, isEmpty, items} = useContext(AppContext);
  const [inputFields, setInputFields] = useState<Customer["attributes"]>(customer.attributes);
  useEffect(() => {
    setInputFields(customer.attributes);
  },[customer]);
  useEffect(() => {
    if(isEmpty) {
      router.push(`/${locale}`);
    }
  },[isEmpty, router, locale]);
  const contactForm = getContactForm(contactForms || [], items);
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const updateFields: Partial<Customer["attributes"]> = {...inputFields};
    updateFields.locale = locale;
    delete updateFields.createdAt;
    delete updateFields.updatedAt;
    delete updateFields.publishedAt;
    await fetchAPI(`/customers/${customer.attributes.uid}`, {
      method: 'PUT',
      body: JSON.stringify({
        data: {
          ...updateFields,
        }
      }),
    });
    await refreshFields();
    router.push(`/${locale}/summary`);
  };
  const handleChange = (event: Pick<ChangeEvent<HTMLInputElement>,'target'>, key: string, type: string) => {
    const value = type === 'checkbox' ? event.target.checked : event.target.value;
    setInputFields(previousKeys => {
      return {
        ...previousKeys,
        [key]: value,
      }
    })
  }
  return (
    <div className="container max-w-3xl mx-auto bg-secondary-50 dark:bg-secondary-800 rounded shadow-md p-4 mt-4 sm:p-8">
      <form className='mb-6 text-secondary-800 dark:text-secondary-100' 
            onSubmit={handleSubmit}>
        {contactForm.map(field => (
          <div className="mb-8" key={field.fieldName}>
            <label className='block p-1'>
            {field.label}{field.required && '*'}
            <input
              className='tx-input mt-2'
              type={field.type}
              onChange={(event: ChangeEvent<HTMLInputElement>) => handleChange(event, field.fieldName, field.type)}
              value={String(inputFields[field.fieldName]) || ''}
              checked={!!inputFields[field.fieldName] || false}
              required={field.required}
            />
          </label>
          </div>

        ))}
        <div className='float-right'>
          <button className='btn h-12'>{translation.send}</button>
        </div>
      </form>
        <div>
          <Link href={`/${locale}/`}>
            <button className='btn h-12'>{translation.back}</button>
          </Link>
      </div>

    </div>

  );
}

export default Form;