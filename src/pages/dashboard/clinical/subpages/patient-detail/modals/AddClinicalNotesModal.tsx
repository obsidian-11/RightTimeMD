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

interface AddClinicalNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onNotesAdded?: () => void;
}

export function AddClinicalNotesModal({
  isOpen,
  onClose,
  patient,
  onNotesAdded,
}: AddClinicalNotesModalProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [content, setContent] = useState("");
  const [author, setAuthor] = useState("");
  const [confidentiality, setConfidentiality] = useState("N");

  const queryClient = useQueryClient();

  const addNotesMutation = useMutation({
    mutationFn: async () => {
      // Create FHIR DocumentReference resource
      const fhirDocument = {
        resourceType: "DocumentReference",
        id: crypto.randomUUID(),
        status: "current",
        type: {
          coding: [
            {
              system: "http://loinc.org",
              code: "11506-3",
              display: "Progress note",
            },
          ],
          text: category || "Clinical Note",
        },
        category: [
          {
            coding: [
              {
                system: "http://loinc.org",
                code: "LP173421-1",
                display: "Clinical note",
              },
            ],
          },
        ],
        subject: {
          reference: `Patient/${patient.id}`,
          display: `${patient.firstname} ${patient.lastname}`,
        },
        date: new Date().toISOString(),
        author: author ? [
          {
            display: author,
          },
        ] : undefined,
        description: title,
        securityLabel: [
          {
            coding: [
              {
                system: "http://terminology.hl7.org/CodeSystem/v3-Confidentiality",
                code: confidentiality,
                display: confidentiality === "N" ? "Normal" : confidentiality === "R" ? "Restricted" : "Very Restricted",
              },
            ],
          },
        ],
        content: [
          {
            attachment: {
              contentType: "text/plain",
              data: btoa(content), // Base64 encode the content
              title: title,
              creation: new Date().toISOString(),
            },
          },
        ],
        context: {
          period: {
            start: new Date().toISOString(),
            end: new Date().toISOString(),
          },
        },
      };

      // Insert into FHIR table
      const { error } = await supabase.from("fhir").insert({
        id: crypto.randomUUID(),
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        resource_type: "DocumentReference",
        resource_id: fhirDocument.id,
        resource_json: fhirDocument,
        version: 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Clinical note added successfully");
      queryClient.invalidateQueries({ queryKey: ["fhir", patient.id] });
      onNotesAdded?.();
      onClose();
      // Reset form
      setTitle("");
      setCategory("");
      setContent("");
      setAuthor("");
      setConfidentiality("N");
    },
    onError: (error: any) => {
      toast.error(`Failed to add clinical note: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      toast.error("Please enter both a title and content for the note");
      return;
    }
    addNotesMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Clinical Note</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Note Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Progress Note, Consultation Summary"
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
                  <SelectItem value="Progress Note">Progress Note</SelectItem>
                  <SelectItem value="Consultation">Consultation</SelectItem>
                  <SelectItem value="Assessment">Assessment</SelectItem>
                  <SelectItem value="Treatment Plan">Treatment Plan</SelectItem>
                  <SelectItem value="Discharge Summary">Discharge Summary</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confidentiality">Confidentiality</Label>
              <Select value={confidentiality} onValueChange={setConfidentiality}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="N">Normal</SelectItem>
                  <SelectItem value="R">Restricted</SelectItem>
                  <SelectItem value="V">Very Restricted</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="author">Author/Provider</Label>
            <Input
              id="author"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Healthcare provider name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Note Content *</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter detailed clinical notes here..."
              rows={8}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={addNotesMutation.isPending}>
              {addNotesMutation.isPending ? "Adding..." : "Add Clinical Note"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
