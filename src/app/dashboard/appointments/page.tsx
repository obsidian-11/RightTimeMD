'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlusIcon, CalendarIcon, ClockIcon, UserCircleIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline';
import Modal, { ModalContent, ModalFooter } from '@/components/ui/Modal';

// Mock data - in a real app, this would come from your API
type Appointment = {
  id: string;
  date: string;
  time: string;
  doctor: string;
  specialty: string;
  status: 'scheduled' | 'completed' | 'cancelled' | 'pending';
  reason: string;
};

const mockAppointments: Appointment[] = [
  {
    id: '1',
    date: '2023-06-15',
    time: '09:30',
    doctor: 'Dr. Sarah Johnson',
    specialty: 'Cardiology',
    status: 'scheduled',
    reason: 'Routine checkup',
  },
  {
    id: '2',
    date: '2023-06-20',
    time: '14:15',
    doctor: 'Dr. Michael Chen',
    specialty: 'Dermatology',
    status: 'scheduled',
    reason: 'Skin consultation',
  },
  {
    id: '3',
    date: '2023-05-28',
    time: '11:00',
    doctor: 'Dr. Emily Wilson',
    specialty: 'Pediatrics',
    status: 'completed',
    reason: 'Annual physical',
  },
  {
    id: '4',
    date: '2023-06-05',
    time: '10:00',
    doctor: 'Dr. Robert Taylor',
    specialty: 'Orthopedics',
    status: 'cancelled',
    reason: 'Knee pain evaluation',
  },
];

export default function AppointmentsPage() {
  const router = useRouter();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [view, setView] = useState<'upcoming' | 'past' | 'all'>('upcoming');
  const [searchTerm, setSearchTerm] = useState('');

  // In a real app, you would fetch this data from your API
  useEffect(() => {
    const timer = setTimeout(() => {
      setAppointments(mockAppointments);
      setIsLoading(false);
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const filteredAppointments = appointments.filter(appointment => {
    // Filter by view
    const isUpcoming = new Date(`${appointment.date}T${appointment.time}`) >= new Date();
    if (view === 'upcoming' && !isUpcoming) return false;
    if (view === 'past' && isUpcoming) return false;
    
    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        appointment.doctor.toLowerCase().includes(searchLower) ||
        appointment.specialty.toLowerCase().includes(searchLower) ||
        appointment.reason.toLowerCase().includes(searchLower)
      );
    }
    
    return true;
  });

  const handleScheduleAppointment = () => {
    // In a real app, this would open a form to schedule a new appointment
    alert('This would open a form to schedule a new appointment');
  };

  const handleViewAppointment = (appointment: Appointment) => {
    setSelectedAppointment(appointment);
    setIsModalOpen(true);
  };

  const handleCancelAppointment = (appointmentId: string) => {
    // In a real app, this would make an API call to cancel the appointment
    setAppointments(prev => 
      prev.map(apt => 
        apt.id === appointmentId ? { ...apt, status: 'cancelled' as const } : apt
      )
    );
    setIsModalOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const statusClasses = {
      scheduled: 'bg-blue-100 text-blue-800',
      completed: 'bg-green-100 text-green-800',
      cancelled: 'bg-red-100 text-red-800',
      pending: 'bg-yellow-100 text-yellow-800',
    };
    
    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${statusClasses[status as keyof typeof statusClasses] || 'bg-gray-100 text-gray-800'}`}>
        {status}
      </span>
    );
  };

  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('en-US', options);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="sm:flex sm:items-center sm:justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
            <p className="mt-1 text-sm text-gray-500">
              {view === 'upcoming' && 'View and manage your upcoming appointments'}
              {view === 'past' && 'View your past appointment history'}
              {view === 'all' && 'View all your appointments'}
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              type="button"
              onClick={handleScheduleAppointment}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
              Schedule Appointment
            </button>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 sm:p-6">
            <div className="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
              <div className="flex-1">
                <label htmlFor="search" className="sr-only">
                  Search appointments
                </label>
                <div className="relative rounded-md shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" aria-hidden="true" />
                  </div>
                  <input
                    type="text"
                    name="search"
                    id="search"
                    className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md py-2"
                    placeholder="Search by doctor, specialty, or reason"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-shrink-0">
                <div className="inline-flex rounded-md shadow-sm">
                  <button
                    type="button"
                    onClick={() => setView('upcoming')}
                    className={`relative inline-flex items-center px-4 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium ${
                      view === 'upcoming' 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-500 z-10' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Upcoming
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('past')}
                    className={`-ml-px relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium ${
                      view === 'past' 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-500 z-10' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Past
                  </button>
                  <button
                    type="button"
                    onClick={() => setView('all')}
                    className={`-ml-px relative inline-flex items-center px-4 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium ${
                      view === 'all' 
                        ? 'bg-indigo-50 text-indigo-600 border-indigo-500 z-10' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Appointments List */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          {filteredAppointments.length > 0 ? (
            <ul className="divide-y divide-gray-200">
              {filteredAppointments.map((appointment) => (
                <li key={appointment.id} className="hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center">
                          <UserCircleIcon className="h-6 w-6 text-indigo-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-indigo-600">
                            {appointment.doctor}
                          </div>
                          <div className="text-sm text-gray-500">
                            {appointment.specialty}
                          </div>
                        </div>
                      </div>
                      <div className="ml-4 flex-shrink-0">
                        {getStatusBadge(appointment.status)}
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        <div className="flex items-center text-sm text-gray-500">
                          <CalendarIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>
                            {formatDate(appointment.date)} at {appointment.time}
                          </p>
                        </div>
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                          <ClockIcon className="flex-shrink-0 mr-1.5 h-5 w-5 text-gray-400" />
                          <p>30 minutes</p>
                        </div>
                      </div>
                      <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                        <button
                          type="button"
                          onClick={() => handleViewAppointment(appointment)}
                          className="text-indigo-600 hover:text-indigo-900 font-medium"
                        >
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-12">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <h3 className="mt-2 text-sm font-medium text-gray-900">No appointments</h3>
              <p className="mt-1 text-sm text-gray-500">
                {view === 'upcoming' 
                  ? "You don't have any upcoming appointments."
                  : "No appointments match your current filters."}
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  onClick={handleScheduleAppointment}
                  className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                  Schedule Appointment
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Appointment Detail Modal */}
      {selectedAppointment && (
        <Modal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          title="Appointment Details"
          size="lg"
        >
          <ModalContent>
            <div className="bg-white">
              <div className="space-y-4">
                <div className="border-b border-gray-200 pb-4">
                  <h3 className="text-lg font-medium text-gray-900">
                    {selectedAppointment.doctor}
                  </h3>
                  <p className="text-sm text-gray-500">{selectedAppointment.specialty}</p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-start">
                    <CalendarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Date & Time</p>
                      <p className="text-sm text-gray-500">
                        {formatDate(selectedAppointment.date)} at {selectedAppointment.time}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Duration</p>
                      <p className="text-sm text-gray-500">30 minutes</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg 
                      className="h-5 w-5 text-gray-400 mr-2 mt-0.5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" 
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Reason for Visit</p>
                      <p className="text-sm text-gray-500">{selectedAppointment.reason}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <svg 
                      className="h-5 w-5 text-gray-400 mr-2 mt-0.5" 
                      fill="none" 
                      viewBox="0 0 24 24" 
                      stroke="currentColor"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" 
                      />
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-gray-900">Status</p>
                      {getStatusBadge(selectedAppointment.status)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ModalContent>
          <ModalFooter>
            <button
              type="button"
              className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => setIsModalOpen(false)}
            >
              Close
            </button>
            {selectedAppointment.status === 'scheduled' && (
              <button
                type="button"
                className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-red-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                onClick={() => handleCancelAppointment(selectedAppointment.id)}
              >
                Cancel Appointment
              </button>
            )}
            <button
              type="button"
              className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
              onClick={() => {
                // In a real app, this would open a reschedule form
                alert('This would open a reschedule form');
              }}
            >
              Reschedule
            </button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
