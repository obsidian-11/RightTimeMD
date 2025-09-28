import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FHIRViewer } from "../fhir-viewer/FHIRViewer";
import type { Patient } from "@/types";

interface FHIRDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  fhirData: any;
  vitals: any[];
  conditions: any[];
  medications: any[];
  labResults: any[];
  allergies: any[];
  procedures: any[];
  loading: boolean;
}

export function FHIRDataModal({
  isOpen,
  onClose,
  patient,
  fhirData,
  vitals,
  conditions,
  medications,
  labResults,
  allergies,
  procedures,
  loading,
}: FHIRDataModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle>FHIR Data</DialogTitle>
          <DialogDescription>
            Complete FHIR data for {patient.firstname} {patient.lastname}
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">
          <FHIRViewer
            fhirData={fhirData}
            vitals={vitals}
            conditions={conditions}
            medications={medications}
            labResults={labResults}
            allergies={allergies}
            procedures={procedures}
            loading={loading}
          />
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
