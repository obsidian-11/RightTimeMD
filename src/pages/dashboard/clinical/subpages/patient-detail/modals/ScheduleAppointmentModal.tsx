import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import type { Patient, AppointmentType } from "@/types";

interface ScheduleAppointmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: Patient;
  clinicId: string;
}

export function ScheduleAppointmentModal({
  isOpen,
  onClose,
  patient,
  clinicId,
}: ScheduleAppointmentModalProps) {
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);

  const [appointmentForm, setAppointmentForm] = useState({
    type: "" as AppointmentType,
    start_time: "",
    end_time: "",
    notes: "",
  });

  const appointmentTypes: AppointmentType[] = [
    "routine_checkup",
    "follow_up",
    "consultation",
    "procedure",
    "lab_work",
    "imaging",
    "emergency",
    "telemedicine",
  ];

  const handleScheduleAppointment = async () => {
    if (
      !clinicId ||
      !patient?.id ||
      !appointmentForm.type ||
      !appointmentForm.start_time
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      // Calculate end time if not provided (default to 30 minutes)
      let endTime = appointmentForm.end_time;
      if (!endTime && appointmentForm.start_time) {
        const startDate = new Date(appointmentForm.start_time);
        const endDate = new Date(startDate.getTime() + 30 * 60000);
        endTime = endDate.toISOString().slice(0, 16);
      }

      const { error } = await supabase.from("appointment").insert([
        {
          clinic_id: clinicId,
          patient_id: patient.id,
          type: appointmentForm.type,
          start_time: new Date(appointmentForm.start_time).toISOString(),
          end_time: new Date(endTime).toISOString(),
          status: "scheduled",
          notes: appointmentForm.notes || null,
        },
      ]);

      if (error) throw error;

      toast.success("Appointment scheduled successfully!");

      // Reset form and close modal
      setAppointmentForm({
        type: "" as AppointmentType,
        start_time: "",
        end_time: "",
        notes: "",
      });
      onClose();

      // Refresh appointments data
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
    } catch (error: any) {
      console.error("Error scheduling appointment:", error);
      toast.error("Failed to schedule appointment", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Schedule a new appointment for {patient.firstname}{" "}
            {patient.lastname}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="type" className="w-full">
              Appointment Type *
            </Label>
            <Select
              value={appointmentForm.type}
              onValueChange={(value: AppointmentType) =>
                setAppointmentForm((prev) => ({ ...prev, type: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((type) => (
                  <SelectItem key={type} value={type} className="w-full">
                    {type
                      .replace(/_/g, " ")
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start_time">Start Time *</Label>
              <Input
                id="start_time"
                type="datetime-local"
                value={appointmentForm.start_time}
                onChange={(e) =>
                  setAppointmentForm((prev) => ({
                    ...prev,
                    start_time: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end_time">End Time</Label>
              <Input
                id="end_time"
                type="datetime-local"
                value={appointmentForm.end_time}
                onChange={(e) =>
                  setAppointmentForm((prev) => ({
                    ...prev,
                    end_time: e.target.value,
                  }))
                }
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes for the appointment..."
              value={appointmentForm.notes}
              onChange={(e) =>
                setAppointmentForm((prev) => ({
                  ...prev,
                  notes: e.target.value,
                }))
              }
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isCreating}>
            Cancel
          </Button>
          <Button onClick={handleScheduleAppointment} disabled={isCreating}>
            {isCreating ? "Scheduling..." : "Schedule Appointment"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
