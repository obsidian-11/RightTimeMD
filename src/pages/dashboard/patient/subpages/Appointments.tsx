import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { CalendarDays, Clock, MapPin, Phone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks";
import { format, isFuture, isPast } from "date-fns";

export function Appointments() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "past">(
    "upcoming",
  );

  // Query for patient's appointments - optimized for faster loading
  const { data: appointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["patient-appointments", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("appointment")
        .select(
          `
          id,
          type,
          start_time,
          end_time,
          status,
          notes,
          clinic:clinic_id (
            name,
            street,
            suite,
            city,
            state,
            zip,
            phone_number
          )
        `,
        )
        .eq("patient_id", user.id)
        .order("start_time", { ascending: false })
        .limit(50); // Limit results for better performance

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes cache
    gcTime: 10 * 60 * 1000, // Keep in cache for 10 minutes
  });

  const upcomingAppointments =
    appointments?.filter((apt) => isFuture(new Date(apt.start_time))) || [];

  const pastAppointments =
    appointments?.filter((apt) => isPast(new Date(apt.start_time))) || [];

  const handleCancelAppointment = async (appointmentId: string) => {
    try {
      const { error } = await supabase
        .from("appointment")
        .update({ status: "cancelled" })
        .eq("id", appointmentId);

      if (error) throw error;

      toast.success("Appointment cancelled successfully");
      // Refresh appointments data
    } catch (error: any) {
      console.error("Error cancelling appointment:", error);
      toast.error("Failed to cancel appointment", {
        description: error.message || "Please try again.",
      });
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "confirmed":
        return "default";
      case "scheduled":
        return "secondary";
      case "in_progress":
        return "outline";
      case "completed":
        return "success";
      case "cancelled":
      case "no_show":
        return "destructive";
      case "rescheduled":
        return "warning";
      default:
        return "secondary";
    }
  };

  const formatAppointmentTime = (startTime: string, endTime?: string) => {
    const start = new Date(startTime);
    const end = endTime ? new Date(endTime) : null;

    return {
      date: format(start, "EEEE, MMMM d, yyyy"),
      time: `${format(start, "h:mm a")}${end ? ` - ${format(end, "h:mm a")}` : ""}`,
    };
  };

  if (appointmentsLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
          <Skeleton className="h-10 flex-1 rounded-md" />
          <Skeleton className="h-10 flex-1 rounded-md" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Appointments</h1>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 rounded-lg bg-gray-100 p-1">
        <button
          onClick={() => setSelectedTab("upcoming")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            selectedTab === "upcoming"
              ? "bg-white text-gray-900 shadow"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Upcoming ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setSelectedTab("past")}
          className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
            selectedTab === "past"
              ? "bg-white text-gray-900 shadow"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Past ({pastAppointments.length})
        </button>
      </div>

      {/* Appointments List */}
      <div className="space-y-4">
        {selectedTab === "upcoming" ? (
          upcomingAppointments.length > 0 ? (
            upcomingAppointments.map((appointment: any) => {
              const timeInfo = formatAppointmentTime(
                appointment.start_time,
                appointment.end_time,
              );
              return (
                <Card
                  key={appointment.id}
                  className="transition-shadow hover:shadow-md"
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="mb-2 flex items-center gap-3">
                          <CalendarDays className="h-5 w-5 text-blue-600" />
                          <h3 className="text-lg font-semibold capitalize">
                            {appointment.type.replace(/_/g, " ")}
                          </h3>
                          <Badge
                            variant={getStatusBadgeVariant(appointment.status)}
                            className="capitalize"
                          >
                            {appointment.status.replace(/_/g, " ")}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm text-gray-600">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{timeInfo.date}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{timeInfo.time}</span>
                          </div>
                          {appointment.clinic && (
                            <>
                              <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4" />
                                <span>{appointment.clinic.name}</span>
                              </div>
                              {(appointment.clinic.street ||
                                appointment.clinic.city) && (
                                <div className="ml-6 flex items-center gap-2">
                                  <span className="text-xs">
                                    {[
                                      appointment.clinic.street,
                                      appointment.clinic.suite,
                                      appointment.clinic.city,
                                      appointment.clinic.state,
                                      appointment.clinic.zip,
                                    ]
                                      .filter(Boolean)
                                      .join(", ")}
                                  </span>
                                </div>
                              )}
                              {appointment.clinic.phone_number && (
                                <div className="flex items-center gap-2">
                                  <Phone className="h-4 w-4" />
                                  <span>{appointment.clinic.phone_number}</span>
                                </div>
                              )}
                            </>
                          )}
                          {appointment.notes && (
                            <div className="mt-3 rounded-md bg-gray-50 p-3">
                              <p className="mb-1 text-xs font-medium text-gray-700">
                                Notes:
                              </p>
                              <p className="text-sm">{appointment.notes}</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {appointment.status !== "cancelled" &&
                        appointment.status !== "completed" && (
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                handleCancelAppointment(appointment.id)
                              }
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="mr-1 h-4 w-4" />
                              Cancel
                            </Button>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  No upcoming appointments
                </h3>
                <p className="mt-2 text-gray-500">
                  You don't have any upcoming appointments scheduled.
                </p>
              </CardContent>
            </Card>
          )
        ) : pastAppointments.length > 0 ? (
          pastAppointments.map((appointment: any) => {
            const timeInfo = formatAppointmentTime(
              appointment.start_time,
              appointment.end_time,
            );
            return (
              <Card key={appointment.id} className="opacity-75">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="mb-2 flex items-center gap-3">
                        <CalendarDays className="h-5 w-5 text-gray-500" />
                        <h3 className="text-lg font-semibold capitalize">
                          {appointment.type.replace(/_/g, " ")}
                        </h3>
                        <Badge
                          variant={getStatusBadgeVariant(appointment.status)}
                          className="capitalize"
                        >
                          {appointment.status.replace(/_/g, " ")}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{timeInfo.date}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>{timeInfo.time}</span>
                        </div>
                        {appointment.clinic && (
                          <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" />
                            <span>{appointment.clinic.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <CalendarDays className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No past appointments
              </h3>
              <p className="mt-2 text-gray-500">
                Your appointment history will appear here.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
