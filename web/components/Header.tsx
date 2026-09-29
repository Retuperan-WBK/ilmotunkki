import Link from 'next/link';
import { fetchAPI, getStrapiURL } from '../lib/api';

import { StrapiBaseType, StrapiImage, StrapiResponse } from '../utils/models';
import Image from 'next/image';

type Response = StrapiBaseType<{
  header: StrapiResponse<StrapiImage[]>;
  headerTitle: string;
  headerFullWidth?: boolean;
}>

type PropType = {
  children: React.ReactNode;
  locale: string;
}

const getHeaderData = () => {
  try {
    const response = fetchAPI<Response>('/front-page',{}, { populate: ['header'] })
    return response;
  } catch(error) {
    console.error(error);
    return undefined;
  }
}

const Header = async ({children, locale}: PropType) => {
  const data = await getHeaderData();
  const headerArray = data?.attributes.header.data;
  const headerData = headerArray && headerArray[0];
  const header = headerData?.attributes.formats?.large || headerData?.attributes
  const headerFullWidth = data?.attributes.headerFullWidth || false;
  return <header className="container max-w-3xl mx-auto relative">
        <div className='w-fit p-1 flex gap-4'>
          {children}
      </div>
      <Link href={`/${locale}`}>
        {header && (headerFullWidth && header.width && header.height ? (
          <Image
            src={getStrapiURL(header.url)}
            alt="header"
            width={header.width}
            height={header.height}
            className="w-full h-auto"
            sizes="(max-width: 768px) 100vw, 768px"
            priority={true}
          />
        ) : (
          <div className="relative w-full h-96">
            <Image fill={true} alt="header" src={getStrapiURL(header.url)} className="object-cover" sizes="(max-width: 768px) 100vw, 768px" priority={true}/>
          </div>
        ))}
        <p className="py-10 text-3xl text-secondary-800 dark:text-secondary-50">{data?.attributes.headerTitle}</p>
      </Link>
    </header>
}

export default Header;