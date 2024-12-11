'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SeatDashboard from '@/components/admin/SeatDashboard'; // Import the new SeatDashboard component
import { AdminProvider } from '@/components/admin/AdminContext';

type User = {
  id: number; 
  username: string; 
  email: string; 
  provider: string; 
  confirmed: boolean; 
  blocked: boolean; 
  role: {
    id: number; 
    name: string; 
    description: string; 
    type: string; 
  };
  createdAt: string; 
  updatedAt: string; 
};

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/admin/me', { 
          method: 'GET', 
          headers: { 'Content-Type': 'application/json' } 
        });

        const data = await response.json();

        console.log('Data from API:', data);
        console.log('Response from API:', response);

        if (!response.ok || data.error) {
          console.error('Error from API:', data.error || 'Unauthorized');
          router.push('/admin/login');
        } else {
          setUser(data.user);
        }
      } catch (err) {
        console.error('Request failed:', err);
        router.push('/admin/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);


  if (loading) return (
    <div className="flex justify-center items-center w-full h-full">
      <h2 className="text-2xl font-bold">Loading...</h2>
    </div>
  )

  if (user) {
    return (
      <div className="flex flex-col w-full h-full">
        <AdminProvider>
          <SeatDashboard /> {/* Renders the new SeatDashboard component */}
        </AdminProvider>
      </div>
    );
  }

  if (!user) return (
    <div className="flex justify-center items-center w-full h-full">
      <h2 className="text-2xl font-bold">Redirecting to login...</h2>
    </div>
  )

  return (
    <div className="flex justify-center items-center w-full h-full">
      <h2 className="text-2xl font-bold">Unauthorized</h2>
    </div>
  )
}
