import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Patient } from "@/types";

interface AddLabResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onLabResultAdded?: () => void;
}

export function AddLabResultsModal({
  isOpen,
  onClose,
  patient,
  onLabResultAdded,
}: AddLabResultsModalProps) {
  const [testName, setTestName] = useState("");
  const [value, setValue] = useState("");
  const [unit, setUnit] = useState("");
  const [referenceRange, setReferenceRange] = useState("");
  const [status, setStatus] = useState("final");
  const [category, setCategory] = useState("");
  const [interpretation, setInterpretation] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const addLabResultMutation = useMutation({
    mutationFn: async () => {
      // Create FHIR Observation resource for lab result
      const fhirObservation = {
        resourceType: "Observation",
        id: crypto.randomUUID(),
        status: status,
        category: [
          {
            coding: [
              {
                system:
                  "http://terminology.hl7.org/CodeSystem/observation-category",
                code: category || "laboratory",
                display:
                  (category || "laboratory").charAt(0).toUpperCase() +
                  (category || "laboratory").slice(1),
              },
            ],
          },
        ],
        code: {
          coding: [
            {
              system: "http://loinc.org",
              display: testName,
            },
          ],
          text: testName,
        },
        subject: {
          reference: `Patient/${patient.id}`,
          display: `${patient.firstname} ${patient.lastname}`,
        },
        effectiveDateTime: new Date().toISOString(),
        valueQuantity:
          value && unit
            ? {
                value: parseFloat(value),
                unit: unit,
                system: "http://unitsofmeasure.org",
                code: unit,
              }
            : undefined,
        valueString: value && !unit ? value : undefined,
        referenceRange: referenceRange
          ? [
              {
                text: referenceRange,
              },
            ]
          : undefined,
        interpretation: interpretation
          ? [
              {
                coding: [
                  {
                    system:
                      "http://terminology.hl7.org/CodeSystem/v3-ObservationInterpretation",
                    code: interpretation.toLowerCase(),
                    display: interpretation,
                  },
                ],
              },
            ]
          : undefined,
        note: notes ? [{ text: notes }] : undefined,
      };

      // Insert into FHIR table
      const { error } = await supabase.from("fhir").insert({
        id: crypto.randomUUID(),
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        resource_type: "Observation",
        resource_id: fhirObservation.id,
        resource_json: fhirObservation,
        version: 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Lab result added successfully");
      queryClient.invalidateQueries({ queryKey: ["fhir", patient.id] });
      onLabResultAdded?.();
      onClose();
      // Reset form
      setTestName("");
      setValue("");
      setUnit("");
      setReferenceRange("");
      setStatus("final");
      setCategory("");
      setInterpretation("");
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(`Failed to add lab result: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!testName.trim()) {
      toast.error("Please enter a test name");
      return;
    }
    addLabResultMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Lab Result</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="test-name">Test Name *</Label>
            <Input
              id="test-name"
              value={testName}
              onChange={(e) => setTestName(e.target.value)}
              placeholder="e.g., Complete Blood Count, Glucose"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="value">Value</Label>
              <Input
                id="value"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Result value"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unit</Label>
              <Input
                id="unit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                placeholder="mg/dL, %, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reference-range">Reference Range</Label>
            <Input
              id="reference-range"
              value={referenceRange}
              onChange={(e) => setReferenceRange(e.target.value)}
              placeholder="e.g., 70-100 mg/dL"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="laboratory">Laboratory</SelectItem>
                  <SelectItem value="imaging">Imaging</SelectItem>
                  <SelectItem value="procedure">Procedure</SelectItem>
                  <SelectItem value="vital-signs">Vital Signs</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interpretation">Interpretation</Label>
              <Select value={interpretation} onValueChange={setInterpretation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select interpretation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                  <SelectItem value="Critical">Critical</SelectItem>
                  <SelectItem value="Abnormal">Abnormal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="final">Final</SelectItem>
                <SelectItem value="preliminary">Preliminary</SelectItem>
                <SelectItem value="amended">Amended</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the result..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={addLabResultMutation.isPending}>
              {addLabResultMutation.isPending ? "Adding..." : "Add Lab Result"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
