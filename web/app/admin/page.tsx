'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SeatDashboard from '@/components/admin/SeatDashboard'; // Import the new SeatDashboard component

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


  if (loading) return <p>Loading...</p>;

  if (!user) return <p>Redirecting to login...</p>;

  return (
    <div className="flex flex-col w-full h-full">
      <SeatDashboard /> {/* Renders the new SeatDashboard component */}
    </div>
  );
}
