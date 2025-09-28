'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { CheckCircle2, ChevronRight, User, Calendar, Shield, Pill } from 'lucide-react';

type Step = {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [completed, setCompleted] = useState(false);

  const [steps, setSteps] = useState<Step[]>([
    {
      id: 'profile',
      title: 'Complete Profile',
      description: 'Tell us about yourself',
      icon: <User className="h-5 w-5" />,
      completed: false,
    },
    {
      id: 'schedule',
      title: 'Set Availability',
      description: 'Your preferred appointment times',
      icon: <Calendar className="h-5 w-5" />,
      completed: false,
    },
    {
      id: 'medical',
      title: 'Medical History',
      description: 'Share your health background',
      icon: <Shield className="h-5 w-5" />,
      completed: false,
    },
    {
      id: 'medication',
      title: 'Current Medications',
      description: 'List your current prescriptions',
      icon: <Pill className="h-5 w-5" />,
      completed: false,
    },
  ]);

  const completeCurrentStep = () => {
    if (currentStep < steps.length - 1) {
      const updatedSteps = [...steps];
      updatedSteps[currentStep].completed = true;
      setSteps(updatedSteps);
      setCurrentStep(currentStep + 1);
    } else {
      // Mark all steps as completed
      setSteps(steps.map(step => ({ ...step, completed: true })));
      setCompleted(true);
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    }
  };

  const getStepContent = () => {
    switch (steps[currentStep].id) {
      case 'profile':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                id="fullName"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="John Doe"
              />
            </div>
            <div>
              <label htmlFor="dob" className="block text-sm font-medium text-gray-700">
                Date of Birth
              </label>
              <input
                type="date"
                id="dob"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
              />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <input
                type="tel"
                id="phone"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="(123) 456-7890"
              />
            </div>
          </div>
        );
      case 'schedule':
        return (
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Preferred Appointment Times</h4>
              <div className="space-y-2">
                {['Morning (8am-12pm)', 'Afternoon (12pm-5pm)', 'Evening (5pm-8pm)'].map((time) => (
                  <div key={time} className="flex items-center">
                    <input
                      id={time}
                      name="preferred-time"
                      type="radio"
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300"
                    />
                    <label htmlFor={time} className="ml-3 block text-sm font-medium text-gray-700">
                      {time}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case 'medical':
        return (
          <div className="space-y-4">
            <div>
              <label htmlFor="allergies" className="block text-sm font-medium text-gray-700">
                Allergies
              </label>
              <textarea
                id="allergies"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="List any allergies you have..."
              />
            </div>
            <div>
              <label htmlFor="conditions" className="block text-sm font-medium text-gray-700">
                Medical Conditions
              </label>
              <textarea
                id="conditions"
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border"
                placeholder="List any medical conditions..."
              />
            </div>
          </div>
        );
      case 'medication':
        return (
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              You can add your current medications now or skip and add them later in the Medications section.
            </p>
            <div className="border border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Pill className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No medications added</h3>
              <p className="mt-1 text-sm text-gray-500">
                Add your current prescriptions to keep track of them.
              </p>
              <div className="mt-6">
                <button
                  type="button"
                  className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                  Add Medication
                </button>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  if (completed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-blue-50 to-white p-4">
        <div className="text-center">
          <CheckCircle2 className="mx-auto h-16 w-16 text-green-500" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">Setup Complete!</h3>
          <p className="mt-1 text-sm text-gray-500">Redirecting you to your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      <div className="max-w-3xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to RightTimeMD</h1>
          <p className="text-lg text-gray-600">Let's get you set up in just a few steps</p>
        </div>

        <div className="mb-8">
          <nav aria-label="Progress">
            <ol role="list" className="space-y-6">
              {steps.map((step, stepIdx) => (
                <li key={step.id} className="relative">
                  {stepIdx !== steps.length - 1 ? (
                    <div className="absolute left-4 top-4 -ml-px mt-0.5 h-full w-0.5 bg-gray-200" aria-hidden="true" />
                  ) : null}
                  <div className="group relative flex items-start">
                    <span className="flex h-9 items-center">
                      <span
                        className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full ${
                          step.completed ? 'bg-indigo-600' : 'bg-white border-2 border-gray-300 group-hover:border-gray-400'
                        }`}
                      >
                        {step.completed ? (
                          <CheckCircle2 className="h-5 w-5 text-white" />
                        ) : (
                          <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                        )}
                      </span>
                    </span>
                    <span className="ml-4 flex min-w-0 flex-col">
                      <span className={`text-sm font-medium ${
                        stepIdx === currentStep ? 'text-indigo-600' : 'text-gray-500'
                      }`}>
                        {step.title}
                      </span>
                      <span className="text-sm text-gray-500">{step.description}</span>
                    </span>
                  </div>
                </li>
              ))}
            </ol>
          </nav>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
          <div className="mb-6">
            <h2 className="text-lg font-medium text-gray-900 flex items-center">
              {steps[currentStep].icon}
              <span className="ml-2">{steps[currentStep].title}</span>
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              {steps[currentStep].description}
            </p>
          </div>
          
          <div className="mb-8">
            {getStepContent()}
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              onClick={completeCurrentStep}
              className="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
            >
              {currentStep === steps.length - 1 ? 'Finish Setup' : 'Continue'}
              <ChevronRight className="ml-2 -mr-1 h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlusIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
      {...props}
    >
      <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
    </svg>
  );
}
