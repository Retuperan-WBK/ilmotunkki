'use client';

import '../../styles/global.css'; // Import global styles if needed
import AppProvider from '../../context/AppContext'; // Context provider
import DisableTrackpadPinchZoom from '@/components/admin/DisableTrackpadPinchZoom';

type PropType = {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: PropType) => {
  return (
    <html lang='fi' className='dark w-screen h-screen overflow-hidden touch-action-none'>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
        <title>RWBK Liput - Plassitunkki</title>
        <link rel="icon" href="https://rwbk.fi/favicon.ico" />
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

export default AdminLayout;
