import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Calendar,
  User,
  MoreHorizontal,
  Clock,
  Search,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/lib/supabase";
import { useClinic } from "@/hooks";
import { useDebounce } from "@/hooks";
import type { AppointmentType, AppointmentStatus } from "@/types";

export function Appointments() {
  const { currentClinic } = useClinic();
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [patientSearch, setPatientSearch] = useState("");
  const [isPatientOpen, setIsPatientOpen] = useState(false);
  const debouncedPatientSearch = useDebounce(patientSearch, 300);

  // Form state for creating appointments
  const [newAppointment, setNewAppointment] = useState({
    patient_id: "",
    type: "" as AppointmentType,
    start_time: "",
    end_time: "",
    notes: "",
  });

  // Query for appointments
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments", currentClinic?.id],
    queryFn: async () => {
      if (!currentClinic?.id) return [];

      const { data, error } = await supabase
        .from("appointment")
        .select(
          `
          *,
          patient:patient_id (
            id,
            firstname,
            lastname,
            mrn,
            email
          )
        `,
        )
        .eq("clinic_id", currentClinic.id)
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentClinic?.id,
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  // Query for patients (for appointment creation with search)
  const { data: patients } = useQuery({
    queryKey: ["patients-search", currentClinic?.id, debouncedPatientSearch],
    queryFn: async () => {
      if (!currentClinic?.id) return [];

      let query = supabase
        .from("patient")
        .select("id, firstname, lastname, mrn")
        .eq("clinic_id", currentClinic.id)
        .order("lastname", { ascending: true })
        .limit(20); // Limit for performance

      if (debouncedPatientSearch) {
        query = query.or(
          `firstname.ilike.%${debouncedPatientSearch}%,lastname.ilike.%${debouncedPatientSearch}%,mrn.ilike.%${debouncedPatientSearch}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
    enabled:
      !!currentClinic?.id &&
      (isCreateModalOpen || debouncedPatientSearch.length > 0),
  });

  const handleCreateAppointment = async () => {
    if (
      !currentClinic?.id ||
      !newAppointment.patient_id ||
      !newAppointment.type ||
      !newAppointment.start_time
    ) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsCreating(true);
    try {
      // Calculate end time if not provided (default to 30 minutes later)
      let endTime = newAppointment.end_time;
      if (!endTime && newAppointment.start_time) {
        const startDate = new Date(newAppointment.start_time);
        const endDate = new Date(startDate.getTime() + 30 * 60000); // Add 30 minutes
        endTime = endDate.toISOString().slice(0, 16); // Format for datetime-local
      }

      const { error } = await supabase.from("appointment").insert([
        {
          clinic_id: currentClinic.id,
          patient_id: newAppointment.patient_id,
          type: newAppointment.type,
          start_time: new Date(newAppointment.start_time).toISOString(),
          end_time: new Date(endTime).toISOString(),
          status: "scheduled" as AppointmentStatus,
          notes: newAppointment.notes || null,
        },
      ]);

      if (error) throw error;

      // Refresh appointments data
      queryClient.invalidateQueries({
        queryKey: ["appointments", currentClinic.id],
      });

      // Reset form and close modal
      setNewAppointment({
        patient_id: "",
        type: "" as AppointmentType,
        start_time: "",
        end_time: "",
        notes: "",
      });
      setPatientSearch("");
      setIsCreateModalOpen(false);

      toast.success("Appointment scheduled successfully");
    } catch (error) {
      console.error("Error scheduling appointment:", error);
      toast.error("Failed to schedule appointment");
    } finally {
      setIsCreating(false);
    }
  };

  const handleStatusUpdate = async (
    appointmentId: string,
    newStatus: AppointmentStatus,
  ) => {
    try {
      const { error } = await supabase
        .from("appointment")
        .update({ status: newStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: ["appointments", currentClinic?.id],
      });
      toast.success(`Appointment marked as ${newStatus.replace("_", " ")}`);
    } catch (error) {
      console.error("Error updating appointment status:", error);
      toast.error("Failed to update appointment");
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointment")
        .update({ status: "cancelled" as AppointmentStatus })
        .eq("id", appointmentId);

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: ["appointments", currentClinic?.id],
      });
      toast.success("Appointment cancelled");
    } catch (error) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment");
    }
  };

  const handleDeleteAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointment")
        .delete()
        .eq("id", appointmentId);

      if (error) throw error;

      queryClient.invalidateQueries({
        queryKey: ["appointments", currentClinic?.id],
      });
      toast.success("Appointment deleted permanently");
    } catch (error) {
      console.error("Error deleting appointment:", error);
      toast.error("Failed to delete appointment");
    }
  };

  const getStatusBadgeVariant = (status: AppointmentStatus) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "scheduled":
        return "secondary";
      case "in_progress":
        return "default";
      case "completed":
        return "outline";
      case "cancelled":
        return "destructive";
      case "no_show":
        return "destructive";
      default:
        return "secondary";
    }
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

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

  if (!currentClinic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">
          Please select a clinic to view appointments.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Appointments</h1>
          <p className="text-sm text-gray-600">
            Manage appointments for {currentClinic.name}
          </p>
        </div>
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Create a new appointment for a patient at your clinic.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Patient Selection with Search */}
              <div className="space-y-2">
                <Label htmlFor="patient">Patient *</Label>
                <Popover open={isPatientOpen} onOpenChange={setIsPatientOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      className="w-full justify-between"
                    >
                      {newAppointment.patient_id
                        ? patients?.find(
                            (p) => p.id === newAppointment.patient_id,
                          )?.firstname +
                          " " +
                          patients?.find(
                            (p) => p.id === newAppointment.patient_id,
                          )?.lastname
                        : "Select a patient..."}
                      <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 p-0" align="start">
                    <div className="p-3">
                      <Input
                        placeholder="Search patients..."
                        value={patientSearch}
                        onChange={(e) => setPatientSearch(e.target.value)}
                        className="mb-2"
                      />
                      <div
                        className="max-h-48 space-y-1 overflow-y-scroll scroll-smooth"
                        style={{
                          scrollbarWidth: "thin",
                          scrollbarColor: "#cbd5e1 #f1f5f9",
                        }}
                        onWheel={(e) => {
                          e.stopPropagation();
                          const element = e.currentTarget;
                          element.scrollTop += e.deltaY;
                        }}
                      >
                        {patients && patients.length > 0 ? (
                          patients.map((patient: any) => (
                            <div
                              key={patient.id}
                              className="cursor-pointer rounded-md p-2 transition-colors hover:bg-gray-100"
                              onClick={() => {
                                setNewAppointment((prev) => ({
                                  ...prev,
                                  patient_id: patient.id,
                                }));
                                setIsPatientOpen(false);
                                setPatientSearch("");
                              }}
                            >
                              <div className="text-left">
                                <p className="text-sm font-medium">
                                  {patient.firstname} {patient.lastname}
                                </p>
                                <p className="text-xs text-gray-500">
                                  MRN:{" "}
                                  {patient.mrn ||
                                    "TMP-" +
                                      patient.firstname.charAt(0) +
                                      patient.lastname.charAt(0) +
                                      patient.id.slice(-4)}
                                </p>
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="p-2 text-sm text-gray-500">
                            {debouncedPatientSearch
                              ? "No patients found"
                              : "Start typing to search..."}
                          </p>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              <div className="space-y-2">
                <Label htmlFor="type">Appointment Type *</Label>
                <Select
                  value={newAppointment.type}
                  onValueChange={(value: AppointmentType) =>
                    setNewAppointment((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select appointment type" />
                  </SelectTrigger>
                  <SelectContent>
                    {appointmentTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type
                          .replace(/_/g, " ")
                          .replace(/\b\w/g, (l) => l.toUpperCase())}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Start and End Time */}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="start_time">Start Time *</Label>
                  <Input
                    id="start_time"
                    type="datetime-local"
                    value={newAppointment.start_time}
                    onChange={(e) =>
                      setNewAppointment((prev) => ({
                        ...prev,
                        start_time: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end_time">End Time</Label>
                  <Input
                    id="end_time"
                    type="datetime-local"
                    value={newAppointment.end_time}
                    onChange={(e) =>
                      setNewAppointment((prev) => ({
                        ...prev,
                        end_time: e.target.value,
                      }))
                    }
                    className="w-full"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea
                  id="notes"
                  placeholder="Additional notes for the appointment..."
                  value={newAppointment.notes}
                  onChange={(e) =>
                    setNewAppointment((prev) => ({
                      ...prev,
                      notes: e.target.value,
                    }))
                  }
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateModalOpen(false)}
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button onClick={handleCreateAppointment} disabled={isCreating}>
                {isCreating ? "Scheduling..." : "Schedule Appointment"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Appointments Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>All Appointments</CardTitle>
            <Badge variant="secondary">
              {appointments ? appointments.length : 0} appointments
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : appointments && appointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Notes</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {appointments.map((appointment: any) => (
                  <TableRow key={appointment.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {formatDateTime(appointment.start_time)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {appointment.end_time && (
                              <>
                                until{" "}
                                {new Date(
                                  appointment.end_time,
                                ).toLocaleTimeString("en-US", {
                                  hour: "numeric",
                                  minute: "2-digit",
                                })}
                              </>
                            )}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="h-4 w-4 text-gray-400" />
                        <div>
                          <p className="font-medium">
                            {appointment.patient?.firstname}{" "}
                            {appointment.patient?.lastname}
                          </p>
                          <p className="text-sm text-gray-500">
                            MRN: {appointment.patient?.mrn}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize">
                      {appointment.type?.replace(/_/g, " ")}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getStatusBadgeVariant(appointment.status)}
                      >
                        {appointment.status.replace(/_/g, " ")}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-48 truncate text-sm text-gray-500">
                      {appointment.notes || "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {appointment.status === "scheduled" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(appointment.id, "confirmed")
                              }
                            >
                              <Clock className="mr-2 h-4 w-4" />
                              Confirm Appointment
                            </DropdownMenuItem>
                          )}
                          {appointment.status === "confirmed" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(
                                  appointment.id,
                                  "in_progress",
                                )
                              }
                            >
                              <User className="mr-2 h-4 w-4" />
                              Mark as In Progress
                            </DropdownMenuItem>
                          )}
                          {appointment.status === "in_progress" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleStatusUpdate(appointment.id, "completed")
                              }
                            >
                              <Calendar className="mr-2 h-4 w-4" />
                              Mark as Completed
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() =>
                              handleCancelAppointment(appointment.id)
                            }
                            className="text-orange-600"
                          >
                            Cancel Appointment
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleDeleteAppointment(appointment.id)
                            }
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Permanently
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-gray-500">
              <p className="text-lg font-medium">No appointments scheduled</p>
              <p className="text-sm">
                Schedule your first appointment to get started
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
