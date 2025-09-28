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

interface ManageCarePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  onCarePlanAdded?: () => void;
}

export function ManageCarePlanModal({
  isOpen,
  onClose,
  patient,
  onCarePlanAdded,
}: ManageCarePlanModalProps) {
  const [title, setTitle] = useState("");
  const [status, setStatus] = useState("active");
  const [intent, setIntent] = useState("plan");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [goals, setGoals] = useState("");
  const [activities, setActivities] = useState("");
  const [notes, setNotes] = useState("");

  const queryClient = useQueryClient();

  const addCarePlanMutation = useMutation({
    mutationFn: async () => {
      // Create FHIR CarePlan resource
      const fhirCarePlan = {
        resourceType: "CarePlan",
        id: crypto.randomUUID(),
        status: status,
        intent: intent,
        category: category
          ? [
              {
                coding: [
                  {
                    system: "http://snomed.info/sct",
                    display: category,
                  },
                ],
                text: category,
              },
            ]
          : undefined,
        title: title,
        description: description,
        subject: {
          reference: `Patient/${patient.id}`,
          display: `${patient.firstname} ${patient.lastname}`,
        },
        period: {
          start: startDate || new Date().toISOString().split("T")[0],
          end: endDate || undefined,
        },
        created: new Date().toISOString(),
        goal: goals
          ? goals
              .split("\n")
              .filter((g) => g.trim())
              .map((goal, index) => ({
                id: `goal-${index + 1}`,
                description: {
                  text: goal.trim(),
                },
                target: [
                  {
                    dueDate: endDate || undefined,
                  },
                ],
              }))
          : undefined,
        activity: activities
          ? activities
              .split("\n")
              .filter((a) => a.trim())
              .map((activity) => ({
                detail: {
                  status: "not-started",
                  description: activity.trim(),
                  scheduledPeriod: {
                    start: startDate || new Date().toISOString().split("T")[0],
                    end: endDate || undefined,
                  },
                },
              }))
          : undefined,
        note: notes ? [{ text: notes }] : undefined,
      };

      // Insert into FHIR table
      const { error } = await supabase.from("fhir").insert({
        id: crypto.randomUUID(),
        patient_id: patient.id,
        clinic_id: patient.clinic_id,
        resource_type: "CarePlan",
        resource_id: fhirCarePlan.id,
        resource_json: fhirCarePlan,
        version: 1,
      });

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Care plan added successfully");
      queryClient.invalidateQueries({ queryKey: ["fhir", patient.id] });
      onCarePlanAdded?.();
      onClose();
      // Reset form
      setTitle("");
      setStatus("active");
      setIntent("plan");
      setCategory("");
      setDescription("");
      setStartDate("");
      setEndDate("");
      setGoals("");
      setActivities("");
      setNotes("");
    },
    onError: (error: any) => {
      toast.error(`Failed to add care plan: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Please enter a care plan title");
      return;
    }
    addCarePlanMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Manage Care Plan</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Care Plan Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Diabetes Management Plan, Post-Surgical Care"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief description of the care plan..."
              rows={2}
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="on-hold">On Hold</SelectItem>
                  <SelectItem value="revoked">Revoked</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="intent">Intent</Label>
              <Select value={intent} onValueChange={setIntent}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proposal">Proposal</SelectItem>
                  <SelectItem value="plan">Plan</SelectItem>
                  <SelectItem value="order">Order</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Input
                id="category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g., Chronic Disease"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-date">Start Date</Label>
              <Input
                id="start-date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="end-date">End Date</Label>
              <Input
                id="end-date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="goals">Goals (one per line)</Label>
            <Textarea
              id="goals"
              value={goals}
              onChange={(e) => setGoals(e.target.value)}
              placeholder="Achieve HbA1c < 7%&#10;Lose 10 pounds&#10;Exercise 3x per week"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="activities">
              Activities/Interventions (one per line)
            </Label>
            <Textarea
              id="activities"
              value={activities}
              onChange={(e) => setActivities(e.target.value)}
              placeholder="Monitor blood glucose daily&#10;Follow diabetic diet&#10;Take metformin as prescribed"
              rows={4}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional care plan notes..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={addCarePlanMutation.isPending}>
              {addCarePlanMutation.isPending ? "Adding..." : "Add Care Plan"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
