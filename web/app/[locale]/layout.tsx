import Footer from '../../components/Footer';
import Header from '../../components/Header';
import Locale from '../../components/Locale';
import Timer from '../../components/Timer';

import '../../styles/global.css';
import AppProvider from '../../context/AppContext';
import { StrapiBaseType, StrapiImage, StrapiResponse } from "@/utils/models";
import { fetchAPI, getStrapiMedia } from "@/lib/api";
import { Metadata } from 'next';

type PropType = {
  children: React.ReactNode
  params: {
    locale: string
  }
}

export const dynamic = 'force-dynamic';

const RootLayout = async ({ children, params }: PropType) => {
  return (
    <html lang={params.locale} className='dark w-full h-full'>
      <head />
      <body className="bg-secondary-200 dark:bg-secondary-900 p-2 text-secondary-700 dark:text-secondary-100">
        <AppProvider>
          <Header locale={params.locale}>
            <Locale />
            <Timer />
          </Header>
          <main className='max-w-7xl mx-auto'>
            {children}
          </main>
        </AppProvider>
        <Footer />
      </body>
    </html>
  )
}

type Global = StrapiBaseType<{
  updateEnd: string;
  title: string;
  description: string;
  url: string;
  favicon: StrapiResponse<StrapiImage>;
}>

export const generateMetadata = async (): Promise<Metadata> => {
  const data = await fetchAPI<Global>('/global', {
    next: { revalidate: 300 }
  }, { populate: ['favicon'] });

  return {
    title: data.attributes.title,
    description: data.attributes.description,
    icons: {
      icon: getStrapiMedia(data.attributes.favicon),
    },
    metadataBase: new URL(data.attributes.url),
    openGraph: {
      title: data.attributes.title,
      description: data.attributes.description,
      url: data.attributes.url,
      siteName: data.attributes.title,
      locale: 'fi_FI',
      type: 'website'
    }
  }
}

export default RootLayout;
