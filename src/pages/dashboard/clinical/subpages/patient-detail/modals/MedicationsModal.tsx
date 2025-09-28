import { Pill } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { Patient } from "@/types";

interface MedicationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
}

export function MedicationsModal({
  isOpen,
  onClose,
  patient,
}: MedicationsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            Manage Medications for {patient.firstname} {patient.lastname}
          </DialogTitle>
          <DialogDescription>
            View and manage patient medications and prescriptions.
          </DialogDescription>
        </DialogHeader>

        <div className="py-8 text-center text-gray-500">
          <Pill className="mx-auto mb-4 h-12 w-12 text-gray-400" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Medication Management
          </h3>
          <p className="mb-4 text-gray-600">
            Full medication management interface coming soon.
          </p>
          <p className="text-sm text-gray-500">
            This will include prescription management, drug interactions, and
            medication history.
          </p>
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
