'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Pill, Activity, Calendar, HeartPulse, ArrowRight } from 'lucide-react';

type StatCardProps = {
  title: string;
  value: string;
  icon: React.ReactNode;
  color: string;
};

function StatCard({ title, value, icon, color }: StatCardProps) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-500">{title}</p>
          <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
        </div>
        <div className={`p-3 rounded-lg ${color} bg-opacity-10`}>
          {icon}
        </div>
      </div>
    </div>
  );
}

export default function DashboardPage() {
  const router = useRouter();

  // Check if user is logged in
  useEffect(() => {
    const user = localStorage.getItem('currentUser');
    if (!user) {
      router.push('/login');
    }
  }, [router]);

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's your health overview.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Active Medications"
            value="2"
            icon={<Pill className="h-6 w-6 text-blue-600" />}
            color="bg-blue-100"
          />
          <StatCard
            title="Upcoming Appointments"
            value="1"
            icon={<Calendar className="h-6 w-6 text-green-600" />}
            color="bg-green-100"
          />
          <StatCard
            title="Health Score"
            value="85/100"
            icon={<Activity className="h-6 w-6 text-purple-600" />}
            color="bg-purple-100"
          />
          <StatCard
            title="Recent Activity"
            value="3 updates"
            icon={<HeartPulse className="h-6 w-6 text-red-600" />}
            color="bg-red-100"
          />
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Quick Actions</h2>
            <button 
              onClick={() => router.push('/medication')}
              className="text-sm text-indigo-600 hover:text-indigo-500 flex items-center"
            >
              View all <ArrowRight className="ml-1 h-4 w-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => router.push('/medication')}
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="p-3 bg-blue-100 rounded-full mb-2">
                <Pill className="h-6 w-6 text-blue-600" />
              </div>
              <span className="text-sm font-medium">Medication</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="p-3 bg-green-100 rounded-full mb-2">
                <Calendar className="h-6 w-6 text-green-600" />
              </div>
              <span className="text-sm font-medium">Appointments</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="p-3 bg-purple-100 rounded-full mb-2">
                <Activity className="h-6 w-6 text-purple-600" />
              </div>
              <span className="text-sm font-medium">Health Records</span>
            </button>
            <button 
              className="flex flex-col items-center justify-center p-4 border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="p-3 bg-red-100 rounded-full mb-2">
                <HeartPulse className="h-6 w-6 text-red-600" />
              </div>
              <span className="text-sm font-medium">Vital Signs</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
