import '../../styles/global.css'; // Import global styles if needed
import AppProvider from '../../context/AppContext'; // Context provider
import { StrapiBaseType, StrapiImage, StrapiResponse } from '@/utils/models';
import { Metadata } from 'next';
import { fetchAPI, getStrapiMedia } from '@/lib/api';
import DisableTrackpadPinchZoom from '@/components/admin/DisableTrackpadPinchZoom';

type PropType = {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: PropType) => {
  return (
    <html lang='fi' className='dark w-screen h-screen overflow-hidden touch-action-none'>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </head>
      <body className="bg-secondary-200 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-100 w-screen h-screen">
        <AppProvider>
          <DisableTrackpadPinchZoom />
          <main className='flex flex-col mx-auto w-screen h-screen'>
            {children}
          </main>
        </AppProvider>
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
    title: "RWBK Liput - ADMIN",
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

export default AdminLayout;
