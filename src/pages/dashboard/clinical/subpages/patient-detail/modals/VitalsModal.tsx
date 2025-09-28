import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import type { Patient } from "@/types";

interface VitalsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onVitalsSaved: () => void;
}

export function VitalsModal({
  isOpen,
  onClose,
  patient,
  onVitalsSaved,
}: VitalsModalProps) {
  const [vitalsForm, setVitalsForm] = useState({
    systolic_bp: "",
    diastolic_bp: "",
    heart_rate: "",
    temperature: "",
    notes: "",
  });

  const handleSaveVitals = async () => {
    if (
      !patient?.id ||
      (!vitalsForm.systolic_bp &&
        !vitalsForm.diastolic_bp &&
        !vitalsForm.heart_rate &&
        !vitalsForm.temperature)
    ) {
      toast.error("Please enter at least one vital sign.");
      return;
    }

    try {
      // Create FHIR Observation resources for vitals
      const observations = [];

      if (vitalsForm.systolic_bp && vitalsForm.diastolic_bp) {
        observations.push({
          resourceType: "Observation",
          status: "final",
          category: [
            {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "vital-signs",
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "85354-9",
                display: "Blood pressure panel",
              },
            ],
          },
          component: [
            {
              code: {
                coding: [
                  {
                    system: "http://loinc.org",
                    code: "8480-6",
                    display: "Systolic blood pressure",
                  },
                ],
              },
              valueQuantity: {
                value: parseInt(vitalsForm.systolic_bp),
                unit: "mmHg",
              },
            },
            {
              code: {
                coding: [
                  {
                    system: "http://loinc.org",
                    code: "8462-4",
                    display: "Diastolic blood pressure",
                  },
                ],
              },
              valueQuantity: {
                value: parseInt(vitalsForm.diastolic_bp),
                unit: "mmHg",
              },
            },
          ],
          effectiveDateTime: new Date().toISOString(),
          notes: vitalsForm.notes,
        });
      }

      if (vitalsForm.heart_rate) {
        observations.push({
          resourceType: "Observation",
          status: "final",
          category: [
            {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "vital-signs",
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8867-4",
                display: "Heart rate",
              },
            ],
          },
          valueQuantity: {
            value: parseInt(vitalsForm.heart_rate),
            unit: "beats/min",
          },
          effectiveDateTime: new Date().toISOString(),
        });
      }

      if (vitalsForm.temperature) {
        observations.push({
          resourceType: "Observation",
          status: "final",
          category: [
            {
              coding: [
                {
                  system:
                    "http://terminology.hl7.org/CodeSystem/observation-category",
                  code: "vital-signs",
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: "http://loinc.org",
                code: "8310-5",
                display: "Body temperature",
              },
            ],
          },
          valueQuantity: {
            value: parseFloat(vitalsForm.temperature),
            unit: "Cel",
          },
          effectiveDateTime: new Date().toISOString(),
        });
      }

      if (observations.length > 0) {
        const { error: fhirError } = await supabase.from("fhir").insert(
          observations.map((obs) => ({
            patient_id: patient.id,
            clinic_id: patient.clinic_id,
            resource_type: obs.resourceType,
            resource_id: crypto.randomUUID(), // Generate unique ID
            resource_json: obs,
          })),
        );

        if (fhirError) throw fhirError;
      }

      onClose();
      toast.success("Vitals added successfully");
      onVitalsSaved();

      setVitalsForm({
        systolic_bp: "",
        diastolic_bp: "",
        heart_rate: "",
        temperature: "",
        notes: "",
      });
    } catch (error: any) {
      console.error("Error saving vitals:", error);
      toast.error("Failed to save vitals", {
        description: error.message || "Please try again.",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Add Vitals for {patient.firstname} {patient.lastname}
          </DialogTitle>
          <DialogDescription>
            Record new vital signs for the patient.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="systolic_bp">Systolic BP (mmHg)</Label>
              <Input
                id="systolic_bp"
                type="number"
                placeholder="e.g., 120"
                value={vitalsForm.systolic_bp}
                onChange={(e) =>
                  setVitalsForm((prev) => ({
                    ...prev,
                    systolic_bp: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="diastolic_bp">Diastolic BP (mmHg)</Label>
              <Input
                id="diastolic_bp"
                type="number"
                placeholder="e.g., 80"
                value={vitalsForm.diastolic_bp}
                onChange={(e) =>
                  setVitalsForm((prev) => ({
                    ...prev,
                    diastolic_bp: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="heart_rate">Heart Rate (bpm)</Label>
              <Input
                id="heart_rate"
                type="number"
                placeholder="e.g., 72"
                value={vitalsForm.heart_rate}
                onChange={(e) =>
                  setVitalsForm((prev) => ({
                    ...prev,
                    heart_rate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="temperature">Temperature (°C)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                placeholder="e.g., 37.0"
                value={vitalsForm.temperature}
                onChange={(e) =>
                  setVitalsForm((prev) => ({
                    ...prev,
                    temperature: e.target.value,
                  }))
                }
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="vitals-notes">Notes (Optional)</Label>
            <Textarea
              id="vitals-notes"
              placeholder="Any specific notes about these vitals..."
              value={vitalsForm.notes}
              onChange={(e) =>
                setVitalsForm((prev) => ({ ...prev, notes: e.target.value }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSaveVitals}>Save Vitals</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
