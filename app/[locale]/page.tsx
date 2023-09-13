import Image from 'next/image';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import ItemList from '../../components/ItemList';
import { fetchAPI, getStrapiURL } from '../../lib/api';
import { getTranslation } from '../../utils/translationHelper';
import { StrapiBaseType } from '../../utils/models';
import PageContinue from './PageContinue';

type FrontPageFields = StrapiBaseType<{
  bodyText: string;
  showSignups: boolean;
}>;

export const getFrontpageFields = async (locale: string) => {
  const content = await fetchAPI<FrontPageFields>('/front-page',{},{
      locale,
    });
  return content;
}

type Props = {
  params: {
    locale: string
  }
}

const Home = async ({params: {locale}}: Props) => {
  const translation = await getTranslation(locale);
  const response = await getFrontpageFields(locale);
  const {bodyText, showSignups} = response.attributes;
  return (
    <div className="container max-w-3xl bg-secondary-50 dark:bg-secondary-800 mx-auto rounded shadow-md mt-4 p-1 sm:p-8">
      <main className='container mx-auto px-4'>
          <ReactMarkdown
          components={{
            img: image => {
              if(!image.src) return null;
              return <Image src={getStrapiURL(image.src)} width={400} height={800} alt={image.alt || ""}></Image>
            }
          }}
          className="prose dark:prose-invert prose-li:my-0.5 prose-ul:my-0.5 prose-secondary mt-0 mb-4">
            {bodyText}
          </ReactMarkdown>
          {showSignups &&
            <div className='my-10'>
              <Link className="btn" href={'/signups'} passHref>
                {translation.signups}
              </Link>
            </div>
          }
          <div className='w-full border-b-2 border-b-primary-700 dark:border-b-primary-300 opacity-50 my-4'></div>
          <ItemList locale={locale}/>
          <PageContinue locale={locale}/>
      </main>
    </div>
  )
}

export default Home
