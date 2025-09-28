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

interface AddConditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onConditionAdded?: () => void;
}

export function AddConditionModal({
  isOpen,
  onClose,
  patient,
  onConditionAdded,
}: AddConditionModalProps) {
  const [conditionName, setConditionName] = useState("");
  const [severity, setSeverity] = useState("");
  const [status, setStatus] = useState("");
  const [onsetDate, setOnsetDate] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const addConditionMutation = useMutation({
    mutationFn: async () => {
      // Create FHIR Condition resource
      const fhirCondition = {
        resourceType: "Condition",
        id: crypto.randomUUID(),
        subject: {
          reference: `Patient/${patient.id}`,
          display: `${patient.firstname} ${patient.lastname}`,
        },
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              display: conditionName,
            },
          ],
          text: conditionName,
        },
        severity: severity ? {
          coding: [
            {
              system: "http://snomed.info/sct",
              code: severity,
              display: severity.charAt(0).toUpperCase() + severity.slice(1),
            },
          ],
        } : undefined,
        clinicalStatus: {
          coding: [
            {
              system: "http://terminology.hl7.org/CodeSystem/condition-clinical",
              code: status || "active",
              display: (status || "active").charAt(0).toUpperCase() + (status || "active").slice(1),
            },
          ],
        },
        onsetDateTime: onsetDate || new Date().toISOString().split('T')[0],
        note: notes ? [{ text: notes }] : undefined,
        recordedDate: new Date().toISOString(),
      };

      // Insert into FHIR table
      const { error } = await supabase.from("fhir").insert({
        id: crypto.randomUUID(),
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        resource_type: "Condition",
        resource_id: fhirCondition.id,
        resource_json: fhirCondition,
        version: 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Condition added successfully");
      queryClient.invalidateQueries({ queryKey: ["fhir", patient.id] });
      onConditionAdded?.();
      onClose();
      // Reset form
      setConditionName("");
      setSeverity("");
      setStatus("");
      setOnsetDate("");
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(`Failed to add condition: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!conditionName.trim()) {
      toast.error("Please enter a condition name");
      return;
    }
    addConditionMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Condition/Diagnosis</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="condition-name">Condition Name *</Label>
            <Input
              id="condition-name"
              value={conditionName}
              onChange={(e) => setConditionName(e.target.value)}
              placeholder="Enter condition or diagnosis"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                  <SelectItem value="fatal">Fatal</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="recurrence">Recurrence</SelectItem>
                  <SelectItem value="relapse">Relapse</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="remission">Remission</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="onset-date">Onset Date</Label>
            <Input
              id="onset-date"
              type="date"
              value={onsetDate}
              onChange={(e) => setOnsetDate(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional clinical notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={addConditionMutation.isPending}>
              {addConditionMutation.isPending ? "Adding..." : "Add Condition"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
