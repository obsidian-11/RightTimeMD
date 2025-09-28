'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  HomeIcon, 
  CalendarIcon, 
  UserCircleIcon, 
  DocumentTextIcon,
  ArrowRightOnRectangleIcon,
  BeakerIcon
} from '@heroicons/react/24/outline';

type User = {
  email: string;
  name: string;
};

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is logged in
    const currentUser = localStorage.getItem('currentUser');
    if (!currentUser) {
      router.push('/login');
      return;
    }
    
    try {
      const userData = JSON.parse(currentUser);
      setUser(userData);
    } catch (error) {
      console.error('Error parsing user data:', error);
      router.push('/login');
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    router.push('/login');
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
    { name: 'Appointments', href: '/dashboard/appointments', icon: CalendarIcon },
    { name: 'Medications', href: '/dashboard/medications', icon: BeakerIcon },
    { name: 'Profile', href: '/dashboard/profile', icon: UserCircleIcon },
    { name: 'Medical Records', href: '/dashboard/records', icon: DocumentTextIcon },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 bg-indigo-700">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <h1 className="text-white text-2xl font-bold">RightTimeMD</h1>
            </div>
            <nav className="mt-5 flex-1 px-2 space-y-1">
              {menuItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className="text-indigo-100 hover:bg-indigo-600 group flex items-center px-4 py-3 text-sm font-medium rounded-md"
                >
                  <item.icon className="mr-3 h-6 w-6 text-indigo-300" />
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-indigo-800 p-4">
            <div className="flex items-center">
              <div>
                <div className="text-base font-medium text-white">
                  {user?.name || 'User'}
                </div>
                <div className="text-sm font-medium text-indigo-300">
                  {user?.email}
                </div>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="ml-auto flex-shrink-0 bg-indigo-600 p-1 rounded-full text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <span className="sr-only">Logout</span>
              <ArrowRightOnRectangleIcon className="h-6 w-6" />
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className="md:hidden bg-indigo-700 p-4 flex justify-between items-center">
        <h1 className="text-white text-xl font-bold">RightTimeMD</h1>
        <button
          onClick={handleLogout}
          className="text-white"
        >
          <ArrowRightOnRectangleIcon className="h-6 w-6" />
        </button>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <main className="flex-1">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <h1 className="text-2xl font-semibold text-gray-900">
                Welcome back, {user?.name?.split(' ')[0] || 'User'}!
              </h1>
            </div>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              <div className="py-4">
                <div className="rounded-lg bg-white p-6 shadow">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    <Link
                      href="/dashboard/appointments"
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <CalendarIcon className="h-6 w-6 text-indigo-600 mr-3" />
                        <span>Schedule Appointment</span>
                      </div>
                    </Link>
                    <Link
                      href="/dashboard/medications"
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <BeakerIcon className="h-6 w-6 text-indigo-600 mr-3" />
                        <span>View Medications</span>
                      </div>
                    </Link>
                    <Link
                      href="/dashboard/records"
                      className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center">
                        <DocumentTextIcon className="h-6 w-6 text-indigo-600 mr-3" />
                        <span>Medical Records</span>
                      </div>
                    </Link>
                  </div>
                </div>

                <div className="mt-8">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Activity</h2>
                  <div className="bg-white shadow overflow-hidden sm:rounded-lg">
                    <div className="px-4 py-5 sm:px-6">
                      <p className="text-gray-500 text-center py-8">
                        No recent activity to display
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
