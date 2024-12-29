import paytrailService from '@/utils/paytrail';

import { serverFetchAPI } from '@/lib/serverApi';
import { CallbackPageFields } from '@/utils/models';
import { updateOrderState } from '@/utils/helpers';

import CallbackResetHandler from './CallbackResetHandler';
import { getTranslation } from '@/utils/translationHelper';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
export const dynamic = 'force-dynamic';
type CheckoutStatus = 'new' | 'ok' | 'fail' | 'pending' | 'delayed';

const getContent = async (locale: string) => {
  try {
    const content = await serverFetchAPI<CallbackPageFields>('/callback-page',{cache: 'no-store'},{
      locale: locale,
    });
    return content;
  } catch(error) {
    return undefined;
  }
}

type Props = {
  params: {
    locale: string
  },
  searchParams: Record<string, string>;
}

type ErrorLinkProps = {
  locale: string;
  translation: Record<string,string>
}
const ErrorLink = ({locale, translation}: ErrorLinkProps) => 
  <Link className='text-primary-900 dark:text-primary-100 underline'
        href={`/${locale}/summary`}>
        {translation.backToOrder}
</Link>


const CallbackPage = async ({params: {locale}, searchParams}: Props) => {
  const params = searchParams;
  const translation = await getTranslation(locale);
  const isValid = paytrailService.verifyPayment(params);
  if(isValid) {
    await updateOrderState(
      Number(params['checkout-reference']),
      params['checkout-status'] || 'fail',
      params['checkout-transaction-id'] || undefined,
      );
  }
  const paymentStatus = params['checkout-status'] as CheckoutStatus;
  const content = await getContent(locale);
  if(!content) return <div>Error on rendering callback page</div>
  
  if (!isValid) return <div> 
    {content.attributes.onError} <ErrorLink locale={locale} translation={translation}/>
    </div>
  else if (paymentStatus !== 'ok') return <div>
    {content.attributes.onCancel} <ErrorLink locale={locale} translation={translation}/>
  </div>
  
  return (
    <div className='container text-primary-900 dark:text-primary-100 max-w-3xl bg-secondary-50 dark:bg-secondary-800 mx-auto rounded shadow-md p-2 pt-4 sm:p-8'>
      <CallbackResetHandler isValid={isValid} paymentStatus={paymentStatus}/>
      <p>{content.attributes.onSuccess}</p>
      <ReactMarkdown
        className="prose dark:prose-invert prose-li:my-0.5 prose-ul:my-0.5 prose-secondary mt-0 mb-4"
        >
        {content.attributes.onSuccess}
      </ReactMarkdown>  
    </div>
  );
}

export default CallbackPage