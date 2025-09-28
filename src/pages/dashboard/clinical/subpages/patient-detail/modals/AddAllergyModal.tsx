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

interface AddAllergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onAllergyAdded?: () => void;
}

export function AddAllergyModal({
  isOpen,
  onClose,
  patient,
  onAllergyAdded,
}: AddAllergyModalProps) {
  const [allergen, setAllergen] = useState("");
  const [category, setCategory] = useState("");
  const [criticality, setCriticality] = useState("");
  const [type, setType] = useState("");
  const [reaction, setReaction] = useState("");
  const [severity, setSeverity] = useState("");
  const [onsetDate, setOnsetDate] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const addAllergyMutation = useMutation({
    mutationFn: async () => {
      // Create FHIR AllergyIntolerance resource
      const fhirAllergy = {
        resourceType: "AllergyIntolerance",
        id: crypto.randomUUID(),
        clinicalStatus: {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical",
              code: "active",
              display: "Active",
            },
          ],
        },
        verificationStatus: {
          coding: [
            {
              system:
                "http://terminology.hl7.org/CodeSystem/allergyintolerance-verification",
              code: "confirmed",
              display: "Confirmed",
            },
          ],
        },
        type: type || "allergy",
        category: category ? [category] : undefined,
        criticality: criticality || undefined,
        code: {
          coding: [
            {
              system: "http://snomed.info/sct",
              display: allergen,
            },
          ],
          text: allergen,
        },
        patient: {
          reference: `Patient/${patient.id}`,
          display: `${patient.firstname} ${patient.lastname}`,
        },
        onsetDateTime: onsetDate || undefined,
        recordedDate: new Date().toISOString(),
        reaction: reaction
          ? [
              {
                substance: {
                  coding: [
                    {
                      system: "http://snomed.info/sct",
                      display: allergen,
                    },
                  ],
                  text: allergen,
                },
                manifestation: [
                  {
                    coding: [
                      {
                        system: "http://snomed.info/sct",
                        display: reaction,
                      },
                    ],
                    text: reaction,
                  },
                ],
                severity: severity || undefined,
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
        resource_type: "AllergyIntolerance",
        resource_id: fhirAllergy.id,
        resource_json: fhirAllergy,
        version: 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Allergy added successfully");
      queryClient.invalidateQueries({ queryKey: ["fhir", patient.id] });
      onAllergyAdded?.();
      onClose();
      // Reset form
      setAllergen("");
      setCategory("");
      setCriticality("");
      setType("");
      setReaction("");
      setSeverity("");
      setOnsetDate("");
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(`Failed to add allergy: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allergen.trim()) {
      toast.error("Please enter an allergen");
      return;
    }
    addAllergyMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add New Allergy</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="allergen">Allergen *</Label>
            <Input
              id="allergen"
              value={allergen}
              onChange={(e) => setAllergen(e.target.value)}
              placeholder="e.g., Penicillin, Peanuts, Latex"
              required
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
                  <SelectItem value="food">Food</SelectItem>
                  <SelectItem value="medication">Medication</SelectItem>
                  <SelectItem value="environment">Environment</SelectItem>
                  <SelectItem value="biologic">Biologic</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="type">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="allergy">Allergy</SelectItem>
                  <SelectItem value="intolerance">Intolerance</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="criticality">Criticality</Label>
            <Select value={criticality} onValueChange={setCriticality}>
              <SelectTrigger>
                <SelectValue placeholder="Select criticality" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="unable-to-assess">
                  Unable to Assess
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reaction">Reaction/Manifestation</Label>
            <Input
              id="reaction"
              value={reaction}
              onChange={(e) => setReaction(e.target.value)}
              placeholder="e.g., Rash, Anaphylaxis, Nausea"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="severity">Reaction Severity</Label>
              <Select value={severity} onValueChange={setSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Select severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mild">Mild</SelectItem>
                  <SelectItem value="moderate">Moderate</SelectItem>
                  <SelectItem value="severe">Severe</SelectItem>
                </SelectContent>
              </Select>
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
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Clinical Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional notes about the allergy..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={addAllergyMutation.isPending}>
              {addAllergyMutation.isPending ? "Adding..." : "Add Allergy"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
