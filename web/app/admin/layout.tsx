'use client';

import '../../styles/global.css'; // Import global styles if needed
import '../../styles/admin.css';
import AppProvider from '../../context/AppContext'; // Context provider

type PropType = {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: PropType) => {
  return (
    <html lang='fi' className='dark min-h-screen'>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>RWBK Liput - Plassitunkki</title>
        <link rel="icon" href="https://rwbk.fi/favicon.ico" />
      </head>
      <body className="admin-panel min-h-screen bg-[#101010] text-slate-100">
        <AppProvider>
          <main className='mx-auto min-h-screen w-full lg:h-screen'>
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  )
}

export default AdminLayout;
