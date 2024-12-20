"use client";

import Link from "next/link";
import { useRouter } from 'next/navigation';
import { useContext, useState, useEffect } from "react";
import GiftCardComponent from '@/components/GiftCard';
import Order from "@/components/Order";
import ContactComponent from "./Contact";
import { AppContext } from "@/context/AppContext";
import { ContactForm } from "@/utils/models";
import GroupCode from "@/components/GroupCode";
import { getUseGiftCard, getUseGroups } from "@/utils/helpers";

type SummaryProps = {
  locale: string;
  translation: Record<string,string>;
  contactForms: ContactForm[];
}

const Summary = ({locale, translation, contactForms}: SummaryProps) => {
  const {customer, items, isEmpty, order} = useContext(AppContext);
  const router = useRouter();
  const [ termsAccepted, setTermsAccepted ] = useState(false);
  const useGroups = getUseGroups(contactForms);
  const useGiftCard = getUseGiftCard(contactForms);

  useEffect(() => {
    if(isEmpty) {
      router.push(`/${locale}`);
    }
  },[isEmpty, router, locale]);

  return (
    <div className='container mx-auto max-w-3xl py-4'>
      <div className='bg-secondary-50 dark:bg-secondary-800 rounded'>
        <ContactComponent
          items={items}
          customer={customer}
          translation={translation}
          contactForms={contactForms}
          />
      </div>
      {
      useGroups &&
      <div className='bg-secondary-50 dark:bg-secondary-800 rounded shadow-lg p-4 mb-5'>
        <GroupCode locale={locale} order={order}/>
      </div>
      }
      <div className='bg-secondary-50 dark:bg-secondary-800 rounded shadow-lg p-4'>
        <Order items={items} locale={locale} translation={translation}></Order>
      </div>
      {
      useGiftCard &&
      <div className='bg-secondary-50 dark:bg-secondary-800 rounded shadow-lg p-4 text-primary-700 dark:text-primary-200'>
        <GiftCardComponent locale={locale}/>
      </div>
      }
      <div className='my-2'>
        <label className='text-primary-700 dark:text-primary-200'>
        <input
          className='h-4 w-4 mr-3 bg-transparent'
          type="checkbox"
          checked={termsAccepted}
          onChange={(event) => setTermsAccepted(event.target.checked)}/>
          {translation.haveRead} <Link href={`/${locale}/terms`} className='text-primary-900 dark:text-primary-50 underline'>
            {translation.terms}
          </Link>
        </label>
      </div>

      <div className='flex gap-2'>
      <Link passHref href={`/${locale}/contact`} className='btn'>{translation.back}</Link>
      <Link passHref href={`/${locale}/checkout/${order?.attributes.uid}`}><button className='btn' disabled={
        !termsAccepted
        || items.length === 0
        || !customer.attributes.firstName
        }>{translation.pay}</button></Link>
    </div>
    </div>
  );
}

export default Summary;