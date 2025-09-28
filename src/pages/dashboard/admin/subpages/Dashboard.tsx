import { useQuery } from "@tanstack/react-query";
import {
  Users,
  UserCheck,
  Calendar,
  Activity,
  TrendingUp,
  Clock,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useClinic } from "@/hooks";

export function Dashboard() {
  const { currentClinic } = useClinic();

  // Query for clinic statistics
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats", currentClinic?.id],
    queryFn: async () => {
      if (!currentClinic?.id) return null;

      const [
        patientsQuery,
        staffQuery,
        appointmentsQuery,
        recentActivityQuery,
      ] = await Promise.all([
        // Total patients
        supabase
          .from("patient")
          .select("id, created_at", { count: "exact" })
          .eq("clinic_id", currentClinic.id),

        // Total staff
        supabase
          .from("staff")
          .select("id, type, created_at", { count: "exact" })
          .eq("clinic_id", currentClinic.id),

        // Appointments today and upcoming
        supabase
          .from("appointment")
          .select("id, start_time, status", { count: "exact" })
          .eq("clinic_id", currentClinic.id)
          .gte("start_time", new Date().toISOString().split("T")[0])
          .order("start_time", { ascending: true }),

        // Recent activity (last 7 days)
        supabase
          .from("audit_log")
          .select("id, action, timestamp")
          .gte(
            "timestamp",
            new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          )
          .order("timestamp", { ascending: false })
          .limit(10),
      ]);

      // Calculate new patients this month
      const thisMonth = new Date();
      thisMonth.setDate(1);
      const newPatientsThisMonth =
        patientsQuery.data?.filter((p) => new Date(p.created_at) >= thisMonth)
          .length || 0;

      // Calculate today's appointments
      const today = new Date().toISOString().split("T")[0];
      const todaysAppointments =
        appointmentsQuery.data?.filter((apt) =>
          apt.start_time.startsWith(today),
        ) || [];

      // Calculate upcoming appointments (next 7 days)
      const nextWeek = new Date(
        Date.now() + 7 * 24 * 60 * 60 * 1000,
      ).toISOString();
      const upcomingAppointments =
        appointmentsQuery.data?.filter(
          (apt) =>
            apt.start_time > new Date().toISOString() &&
            apt.start_time <= nextWeek,
        ) || [];

      return {
        totalPatients: patientsQuery.count || 0,
        newPatientsThisMonth,
        totalStaff: staffQuery.count || 0,
        staffByType:
          staffQuery.data?.reduce((acc: Record<string, number>, staff) => {
            acc[staff.type] = (acc[staff.type] || 0) + 1;
            return acc;
          }, {}) || {},
        todaysAppointments: todaysAppointments.length,
        upcomingAppointments: upcomingAppointments.length,
        totalAppointments: appointmentsQuery.count || 0,
        recentActivity: recentActivityQuery.data || [],
        appointmentsByStatus:
          appointmentsQuery.data?.reduce((acc: Record<string, number>, apt) => {
            acc[apt.status] = (acc[apt.status] || 0) + 1;
            return acc;
          }, {}) || {},
      };
    },
    enabled: !!currentClinic?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  if (!currentClinic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">
          Please select a clinic to view admin dashboard.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
        <p className="text-sm text-gray-600">
          Overview of {currentClinic.name} operations and analytics
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Patients */}
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
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalPatients || 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  +{stats?.newPatientsThisMonth || 0} this month
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Total Staff */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Staff Members</CardTitle>
            <UserCheck className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.totalStaff || 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Active staff members
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Today's Appointments */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Today's Appointments
            </CardTitle>
            <Calendar className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.todaysAppointments || 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  {stats?.upcomingAppointments || 0} upcoming this week
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* System Activity */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              System Activity
            </CardTitle>
            <Activity className="text-muted-foreground h-4 w-4" />
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {stats?.recentActivity?.length || 0}
                </div>
                <p className="text-muted-foreground text-xs">
                  Actions in last 7 days
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Detailed Overview */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Staff Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="h-5 w-5" />
              Staff Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats?.staffByType || {}).map(
                  ([type, count]) => (
                    <div
                      key={type}
                      className="flex items-center justify-between"
                    >
                      <span className="text-sm capitalize">
                        {type.replace("_", " ")}
                      </span>
                      <Badge variant="secondary">{count}</Badge>
                    </div>
                  ),
                )}
                {(!stats?.staffByType ||
                  Object.keys(stats.staffByType).length === 0) && (
                  <p className="text-sm text-gray-500">No staff members yet</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Appointment Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Appointment Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            {statsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats?.appointmentsByStatus || {}).map(
                  ([status, count]) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case "completed":
                          return "bg-green-100 text-green-800";
                        case "scheduled":
                          return "bg-blue-100 text-blue-800";
                        case "confirmed":
                          return "bg-purple-100 text-purple-800";
                        case "cancelled":
                          return "bg-red-100 text-red-800";
                        case "no_show":
                          return "bg-orange-100 text-orange-800";
                        default:
                          return "bg-gray-100 text-gray-800";
                      }
                    };

                    return (
                      <div
                        key={status}
                        className="flex items-center justify-between"
                      >
                        <span className="text-sm capitalize">
                          {status.replace("_", " ")}
                        </span>
                        <Badge
                          className={getStatusColor(status)}
                          variant="secondary"
                        >
                          {count}
                        </Badge>
                      </div>
                    );
                  },
                )}
                {(!stats?.appointmentsByStatus ||
                  Object.keys(stats.appointmentsByStatus).length === 0) && (
                  <p className="text-sm text-gray-500">
                    No appointments scheduled
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {statsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="mt-1 h-3 w-24" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {stats?.recentActivity && stats.recentActivity.length > 0 ? (
                stats.recentActivity.map((activity: any, index: number) => {
                  const getActivityIcon = (action: string) => {
                    switch (action) {
                      case "create":
                        return (
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        );
                      case "update":
                        return <TrendingUp className="h-4 w-4 text-blue-600" />;
                      case "delete":
                        return (
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                        );
                      case "login":
                        return <UserCheck className="h-4 w-4 text-green-600" />;
                      default:
                        return <Activity className="h-4 w-4 text-gray-600" />;
                    }
                  };

                  return (
                    <div key={index} className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100">
                        {getActivityIcon(activity.action)}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm">
                          <span className="capitalize">{activity.action}</span>{" "}
                          action performed
                        </p>
                        <p className="text-xs text-gray-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-gray-500">
                  No recent activity to display
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
