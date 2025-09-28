'use client';

import { Fragment, ReactNode } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';

type ModalProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | '6xl' | '7xl';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  closeButton?: boolean;
};

const sizeClasses = {
  sm: 'sm:max-w-sm',
  md: 'sm:max-w-md',
  lg: 'sm:max-w-lg',
  xl: 'sm:max-w-xl',
  '2xl': 'sm:max-w-2xl',
  '3xl': 'sm:max-w-3xl',
  '4xl': 'sm:max-w-4xl',
  '5xl': 'sm:max-w-5xl',
  '6xl': 'sm:max-w-6xl',
  '7xl': 'sm:max-w-7xl',
};

const paddingClasses = {
  none: '',
  sm: 'px-4 pt-5 pb-4 sm:p-6',
  md: 'px-6 pt-6 pb-4 sm:p-8',
  lg: 'px-8 pt-8 pb-6 sm:p-10',
};

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  size = 'lg',
  padding = 'md',
  closeButton = true,
}: ModalProps) {
  return (
    <Transition.Root show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        </Transition.Child>

        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              enterTo="opacity-100 translate-y-0 sm:scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 translate-y-0 sm:scale-100"
              leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
            >
              <Dialog.Panel
                className={`relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all sm:my-8 sm:w-full ${sizeClasses[size]}`}
              >
                <div className="bg-white">
                  <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
                    <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                      {title}
                    </Dialog.Title>
                    {closeButton && (
                      <button
                        type="button"
                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        onClick={onClose}
                      >
                        <span className="sr-only">Close</span>
                        <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <div className={paddingClasses[padding]}>{children}</div>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}

// Modal Footer component for consistent button alignment
type ModalFooterProps = {
  children: ReactNode;
  className?: string;
};

export function ModalFooter({ children, className = '' }: ModalFooterProps) {
  return (
    <div className={`mt-6 flex justify-end space-x-3 border-t border-gray-200 px-6 py-4 ${className}`}>
      {children}
    </div>
  );
}

// Modal Content component for consistent spacing
type ModalContentProps = {
  children: ReactNode;
  className?: string;
};

export function ModalContent({ children, className = '' }: ModalContentProps) {
  return <div className={`mt-2 ${className}`}>{children}</div>;
}

// Example usage:
/*
<Modal 
  isOpen={isOpen} 
  onClose={() => setIsOpen(false)} 
  title="Example Modal"
  size="lg"
  padding="md"
  closeButton={true}
>
  <ModalContent>
    <p className="text-gray-700">This is the modal content.</p>
  </ModalContent>
  <ModalFooter>
    <button
      type="button"
      className="rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      onClick={() => setIsOpen(false)}
    >
      Cancel
    </button>
    <button
      type="button"
      className="ml-3 inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
      onClick={() => {
        // Handle action
        setIsOpen(false);
      }}
    >
      Save
    </button>
  </ModalFooter>
</Modal>
*/
