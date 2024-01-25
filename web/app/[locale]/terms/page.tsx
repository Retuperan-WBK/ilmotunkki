import ReactMarkdown from 'react-markdown';
import { fetchAPI } from '@/lib/api';
import { StrapiBaseType } from '@/utils/models';
import { getTranslation } from '@/utils/translationHelper';
import GoBack from "@/components/GoBack";

export const dynamic = 'force-dynamic';
type Fields = StrapiBaseType<{
  terms: string;
  gdpr: string;
}>

const getContent = async (locale: string) => {
  try {
    const response = await fetchAPI<Fields>('/terms-and-condition', {
      next: { revalidate: 300 }
    }, {
      locale,
    });
    return response;
  } catch (error) {
    console.error(error);
    return undefined;
  }
}

type Props = {
  params: {
    locale: string
  }
}

const Terms = async ({ params: { locale } }: Props) => {
  const content = await getContent(locale);
  const translation = await getTranslation(locale);
  if (!content) {
    return <div className="text-white">No terms and conditions found</div>
  }
  return (
    <div className="container max-w-3xl bg-secondary-50 dark:bg-secondary-800 mx-auto rounded shadow-md p-8">
      <ReactMarkdown className='prose prose-secondary dark:prose-invert'>{content.attributes.terms}</ReactMarkdown>
      <ReactMarkdown className="prose prose-secondary dark:prose-invert">{content.attributes.gdpr}</ReactMarkdown>
      <div className='my-4'>
        <GoBack translation={translation} />
      </div>
    </div>
  )
}

export default Terms
