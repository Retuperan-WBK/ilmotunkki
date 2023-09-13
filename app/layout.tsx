import { Metadata, ResolvingMetadata } from "next";

import Footer from '../components/Footer';
import Header from '../components/Header';
import Locale from '../components/Locale';
import Timer from '../components/Timer';

import '../styles/global.css';
import AppProvider from '../context/AppContext';
import { StrapiBaseType, StrapiImage, StrapiResponse } from "@/utils/models";
import { fetchAPI, getStrapiMedia } from "@/lib/api";

type PropType = {
  children: React.ReactNode
}


const RootLayout = async ({children}: PropType) => {
  return (
    <html lang='fi' className='dark w-full h-full'>
      <head />
      <body className="bg-secondary-200 dark:bg-secondary-900 p-2 text-secondary-700 dark:text-secondary-100'">
      <AppProvider>
          <Header>
              <Locale />
              <Timer/>
          </Header>
          <main className='max-w-7xl mx-auto'>
            {children}
          </main>
          </AppProvider>
        <Footer/>
      </body>
    </html>
  )
}

type Global = StrapiBaseType<{
  updateEnd: string;
  title: string,
  description: string,
  favicon: StrapiResponse<StrapiImage>,
}>

export const generateMetadata = async (): Promise<Metadata> => {
  const data = await fetchAPI<Global>('/global',{},{populate: ['favicon']});
  return {
    title: data.attributes.title,
    description: data.attributes.description,
    icons: {
      icon: getStrapiMedia(data.attributes.favicon) 
    },
    openGraph: {
      title: data.attributes.title,
      description: data.attributes.description,
      url: '',
      siteName: data.attributes.title,
      locale: 'fi_FI',
      type: 'website'
    }
  }
}


export default RootLayout;