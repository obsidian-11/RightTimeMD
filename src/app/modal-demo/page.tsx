'use client';

import { useState } from 'react';
import Modal, { ModalFooter, ModalContent } from '@/components/ui/Modal';

export default function ModalDemoPage() {
  const [isOpen, setIsOpen] = useState(false);
  const [modalSize, setModalSize] = useState('md');

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-extrabold text-gray-900">Modal Component Demo</h1>
          <p className="mt-2 text-lg text-gray-600">
            A reusable, accessible modal dialog for your application
          </p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-md">
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Basic Usage</h2>
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Open Modal
              </button>
            </div>

            <div>
              <h2 className="text-xl font-semibold mb-4">Modal Sizes</h2>
              <div className="flex flex-wrap gap-3">
                {['sm', 'md', 'lg', 'xl', '2xl', '3xl', '4xl', '5xl', '6xl', '7xl'].map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => {
                      setModalSize(size);
                      setIsOpen(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    {size.toUpperCase()}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Example Modal */}
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)} 
        title="Example Modal"
        size={modalSize as any}
        padding="md"
      >
        <ModalContent>
          <div className="space-y-4">
            <p className="text-gray-700">
              This is a reusable modal component. You can put any content here, including forms, images, or other components.
            </p>
            <p className="text-sm text-gray-500">
              Current size: <span className="font-mono bg-gray-100 px-2 py-1 rounded">{modalSize}</span>
            </p>
            <div className="mt-4 p-4 bg-gray-50 rounded-md">
              <h4 className="font-medium text-gray-900 mb-2">How to use:</h4>
              <pre className="text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
{`import Modal, { ModalContent, ModalFooter } from '@/components/ui/Modal';

function Example() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open Modal</button>
      
      <Modal 
        isOpen={isOpen} 
        onClose={() => setIsOpen(false)}
        title="Example Modal"
        size="md"
      >
        <ModalContent>
          <p>Your content here</p>
        </ModalContent>
        <ModalFooter>
          <button onClick={() => setIsOpen(false)}>Cancel</button>
          <button>Save</button>
        </ModalFooter>
      </Modal>
    </>
  );
}`}
              </pre>
            </div>
          </div>
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
            Save Changes
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
