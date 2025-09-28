import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import { CalendarDays, Clock, Users, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { useClinic } from "@/hooks";

export function Dashboard() {
  const { currentClinic } = useClinic();

  // Query for today's appointments
  const { data: todayAppointments, isLoading: appointmentsLoading } = useQuery({
    queryKey: ["appointments", "today", currentClinic?.id],
    queryFn: async () => {
      if (!currentClinic?.id) return [];

      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const { data, error } = await supabase
        .from("appointment")
        .select(
          `
          *,
          patient:patient_id (
            id,
            firstname,
            lastname,
            mrn
          )
        `,
        )
        .eq("clinic_id", currentClinic.id)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString())
        .order("start_time", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!currentClinic?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Query for clinic stats
  const { data: clinicStats, isLoading: statsLoading } = useQuery({
    queryKey: ["clinic-stats", currentClinic?.id],
    queryFn: async () => {
      if (!currentClinic?.id) return null;

      // Get patient count
      const { count: patientCount } = await supabase
        .from("patient")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", currentClinic.id);

      // Get today's appointment count
      const today = new Date();
      const startOfDay = new Date(today.setHours(0, 0, 0, 0));
      const endOfDay = new Date(today.setHours(23, 59, 59, 999));

      const { count: todayAppointmentCount } = await supabase
        .from("appointment")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", currentClinic.id)
        .gte("start_time", startOfDay.toISOString())
        .lte("start_time", endOfDay.toISOString());

      // Get upcoming appointments (next 7 days)
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);

      const { count: upcomingAppointmentCount } = await supabase
        .from("appointment")
        .select("*", { count: "exact", head: true })
        .eq("clinic_id", currentClinic.id)
        .gte("start_time", new Date().toISOString())
        .lte("start_time", nextWeek.toISOString());

      return {
        patientCount: patientCount || 0,
        todayAppointmentCount: todayAppointmentCount || 0,
        upcomingAppointmentCount: upcomingAppointmentCount || 0,
      };
    },
    enabled: !!currentClinic?.id,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  const getStatusBadgeVariant = (status: string) => {
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
      default:
        return "secondary";
    }
  };

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (!currentClinic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">
          Please select a clinic to view the dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Clinical Dashboard
            </h1>
            <p className="text-sm text-gray-600">
              Overview of {currentClinic.name} activities
            </p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Patients
            </CardTitle>
            <Users className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {clinicStats?.patientCount || 0}
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              Active patients in clinic
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <CalendarDays className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {clinicStats?.todayAppointmentCount || 0}
              </div>
            )}
            <p className="text-muted-foreground text-xs">
              Appointments scheduled today
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
            <Clock className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <div className="text-2xl font-bold">
                {clinicStats?.upcomingAppointmentCount || 0}
              </div>
            )}
            <p className="text-muted-foreground text-xs">Next 7 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Clinic Status</CardTitle>
            <TrendingUp className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Active</div>
            <p className="text-muted-foreground text-xs">
              All systems operational
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Today's Appointments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Today's Appointments</CardTitle>
            <p className="text-muted-foreground text-sm">
              Scheduled appointments for {new Date().toLocaleDateString()}
            </p>
          </div>
          <Button asChild size="sm">
            <Link to="appointments">View All</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {appointmentsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : todayAppointments && todayAppointments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Time</TableHead>
                  <TableHead>Patient</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayAppointments.map((appointment: any) => (
                  <TableRow key={appointment.id}>
                    <TableCell className="font-medium">
                      {formatTime(appointment.start_time)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">
                          {appointment.patient?.firstname}{" "}
                          {appointment.patient?.lastname}
                        </p>
                        <p className="text-muted-foreground text-sm">
                          MRN: {appointment.patient?.mrn}
                        </p>
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
                    <TableCell>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`patients/${appointment.patient_id}`}>
                          View Patient
                        </Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-muted-foreground flex h-32 items-center justify-center">
              No appointments scheduled for today
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
