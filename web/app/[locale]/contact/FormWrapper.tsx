"use client";

import { useContext, useEffect } from 'react';
import { AppContext } from '@/context/AppContext';
import { ContactForm} from '@/utils/models';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslation } from "@/context/useTranslation";
import Form from '@/components/ContactForm';


type Props = {
  locale: string;
  contactForms: ContactForm[];
}

const FormWrapper = ({locale, contactForms}: Props) => {
  const { translation } = useTranslation(locale);
  const router = useRouter();
  const {customer, refreshFields, isEmpty, items} = useContext(AppContext);
  useEffect(() => {
    if(isEmpty) {
      router.push(`/${locale}`);
    }
  },[isEmpty, router, locale]);
  const handleSubmit = async () => {
    await refreshFields();
    router.push(`/${locale}/summary`);
  };
  return (
    <div className="container max-w-3xl mx-auto bg-secondary-50 dark:bg-secondary-800 rounded shadow-md p-4 mt-4 sm:p-8">
      <Form
        contactForms={contactForms}
        items={items}
        customer={customer}
        locale={locale}
        onSubmit={handleSubmit}
      />
      <div>
        <Link href={`/${locale}/`}>
          <button className='btn h-12'>{translation.back}</button>
        </Link>
      </div>
    </div>
  );
}

export default FormWrapper;