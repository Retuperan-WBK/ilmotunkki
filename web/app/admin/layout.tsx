"use client"; // Required for client hooks and router

import '../../styles/global.css'; // Import global styles if needed
import AppProvider from '../../context/AppContext'; // Context provider

type PropType = {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: PropType) => {
  return (
    <html lang='fi' className='dark w-screen h-screen overflow-hidden'>
      <head />
      <body className="bg-secondary-200 dark:bg-secondary-900 text-secondary-700 dark:text-secondary-100 w-screen h-screen">
        <AppProvider>
          <main className='flex flex-col mx-auto w-screen h-screen'>
            {children}
          </main>
        </AppProvider>
      </body>
    </html>
  )
}

export default AdminLayout;
