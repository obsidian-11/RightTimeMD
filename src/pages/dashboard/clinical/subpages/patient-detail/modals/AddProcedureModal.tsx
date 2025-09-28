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

interface AddProcedureModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onProcedureAdded?: () => void;
}

export function AddProcedureModal({
  isOpen,
  onClose,
  patient,
  onProcedureAdded,
}: AddProcedureModalProps) {
  const [procedureName, setProcedureName] = useState("");
  const [status, setStatus] = useState("completed");
  const [category, setCategory] = useState("");
  const [performedDate, setPerformedDate] = useState("");
  const [performer, setPerformer] = useState("");
  const [location, setLocation] = useState("");
  const [outcome, setOutcome] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const addProcedureMutation = useMutation({
    mutationFn: async () => {
      // Create FHIR Procedure resource
      const fhirProcedure = {
        resourceType: "Procedure",
        id: crypto.randomUUID(),
        status: status,
        category: category ? {
          coding: [
            {
              system: "http://snomed.info/sct",
              display: category,
            },
          ],
          text: category,
        } : undefined,
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              display: procedureName,
            },
          ],
          text: procedureName,
        },
        subject: {
          reference: `Patient/${patient.id}`,
          display: `${patient.firstname} ${patient.lastname}`,
        },
        performedDateTime: performedDate || new Date().toISOString().split('T')[0],
        performer: performer ? [
          {
            actor: {
              display: performer,
            },
          },
        ] : undefined,
        location: location ? {
          display: location,
        } : undefined,
        outcome: outcome ? {
          coding: [
            {
              system: "http://snomed.info/sct",
              display: outcome,
            },
          ],
          text: outcome,
        } : undefined,
        note: notes ? [{ text: notes }] : undefined,
        recordedDate: new Date().toISOString(),
      };

      // Insert into FHIR table
      const { error } = await supabase.from("fhir").insert({
        id: crypto.randomUUID(),
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        resource_type: "Procedure",
        resource_id: fhirProcedure.id,
        resource_json: fhirProcedure,
        version: 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Procedure added successfully");
      queryClient.invalidateQueries({ queryKey: ["fhir", patient.id] });
      onProcedureAdded?.();
      onClose();
      // Reset form
      setProcedureName("");
      setStatus("completed");
      setCategory("");
      setPerformedDate("");
      setPerformer("");
      setLocation("");
      setOutcome("");
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(`Failed to add procedure: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!procedureName.trim()) {
      toast.error("Please enter a procedure name");
      return;
    }
    addProcedureMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Procedure</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="procedure-name">Procedure Name *</Label>
            <Input
              id="procedure-name"
              value={procedureName}
              onChange={(e) => setProcedureName(e.target.value)}
              placeholder="e.g., Blood draw, X-ray, Surgery"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="preparation">Preparation</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="aborted">Aborted</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Diagnostic, Therapeutic"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="performed-date">Date Performed</Label>
            <Input
              id="performed-date"
              type="date"
              value={performedDate}
              onChange={(e) => setPerformedDate(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="performer">Performer</Label>
              <Input
                id="performer"
                value={performer}
                onChange={(e) => setPerformer(e.target.value)}
                placeholder="Healthcare provider name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g., Operating Room 1, Lab"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="outcome">Outcome</Label>
            <Select value={outcome} onValueChange={setOutcome}>
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="successful">Successful</SelectItem>
                <SelectItem value="unsuccessful">Unsuccessful</SelectItem>
                <SelectItem value="partially successful">Partially Successful</SelectItem>
                <SelectItem value="complicated">Complicated</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the procedure..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={addProcedureMutation.isPending}>
              {addProcedureMutation.isPending ? "Adding..." : "Add Procedure"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
