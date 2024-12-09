"use client"; // Required for client hooks and router

import '../../styles/global.css'; // Import global styles if needed
import AppProvider from '../../context/AppContext'; // Context provider
import { AdminProvider } from '@/components/admin/AdminContext';

type PropType = {
  children: React.ReactNode;
}

const AdminLayout = ({ children }: PropType) => {
  return (
    <html lang='fi' className='dark w-full h-full'>
      <head />
      <body className="bg-secondary-200 dark:bg-secondary-900 p-2 text-secondary-700 dark:text-secondary-100">
        <AppProvider>
          <AdminProvider>
          <main className='max-w-screen flex flex-col mx-auto h-full w-full overflow-hidden'>
            {children}
          </main>
          </AdminProvider>
        </AppProvider>
      </body>
    </html>
  )
}

export default AdminLayout;
