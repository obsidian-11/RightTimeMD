import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Search,
  Filter,
  Download,
  User,
  Activity,
  Shield,
  AlertTriangle,
  CheckCircle,
  X,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useClinic } from "@/hooks";
import type { AuditLog, AuditLogAction } from "@/types";

export function Logs() {
  const { currentClinic } = useClinic();
  const [searchTerm, setSearchTerm] = useState("");
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Query for audit logs
  const {
    data: logs,
    isLoading,
    error,
  } = useQuery({
    queryKey: [
      "audit-logs",
      currentClinic?.id,
      searchTerm,
      actionFilter,
      dateFilter,
    ],
    queryFn: async () => {
      if (!currentClinic?.id) return [];

      let query = supabase
        .from("audit_log")
        .select("*")
        .order("timestamp", { ascending: false })
        .limit(100); // Limit to most recent 100 logs

      // Apply search filter
      if (searchTerm) {
        query = query.or(
          `user_id.ilike.%${searchTerm}%,resource_id.ilike.%${searchTerm}%,ip_address.ilike.%${searchTerm}%`,
        );
      }

      // Apply action filter
      if (actionFilter !== "all") {
        query = query.eq("action", actionFilter);
      }

      // Apply date filter
      if (dateFilter !== "all") {
        const now = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case "today":
            startDate = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate(),
            );
            break;
          case "week":
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case "month":
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          default:
            startDate = new Date(0);
        }

        query = query.gte("timestamp", startDate.toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;

      return data || [];
    },
    enabled: !!currentClinic?.id,
    staleTime: 30 * 1000, // 30 seconds
  });

  const getActionIcon = (action: AuditLogAction) => {
    switch (action) {
      case "create":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "update":
        return <Activity className="h-4 w-4 text-blue-600" />;
      case "delete":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case "login":
        return <User className="h-4 w-4 text-green-600" />;
      case "logout":
        return <User className="h-4 w-4 text-gray-600" />;
      case "failed_login":
        return <Shield className="h-4 w-4 text-red-600" />;
      case "password_change":
        return <Shield className="h-4 w-4 text-orange-600" />;
      case "emergency_access":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getActionColor = (action: AuditLogAction) => {
    switch (action) {
      case "create":
        return "bg-green-100 text-green-800";
      case "update":
        return "bg-blue-100 text-blue-800";
      case "delete":
        return "bg-red-100 text-red-800";
      case "login":
        return "bg-green-100 text-green-800";
      case "logout":
        return "bg-gray-100 text-gray-800";
      case "failed_login":
        return "bg-red-100 text-red-800";
      case "password_change":
        return "bg-orange-100 text-orange-800";
      case "emergency_access":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const clearFilters = () => {
    setActionFilter("all");
    setDateFilter("all");
  };

  const activeFilterCount = [actionFilter, dateFilter].filter(
    (f) => f !== "all",
  ).length;

  const handleExportLogs = () => {
    if (!logs) return;

    const csvContent = [
      [
        "Timestamp",
        "Action",
        "User ID",
        "Resource Type",
        "Resource ID",
        "IP Address",
      ].join(","),
      ...logs.map((log) =>
        [
          log.timestamp,
          log.action,
          log.user_id,
          log.resource_type,
          log.resource_id,
          log.ip_address,
        ].join(","),
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (!currentClinic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">
          Please select a clinic to view audit logs.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Audit Logs</h1>
          <p className="text-sm text-gray-600">
            System activity and security events for {currentClinic.name}
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={handleExportLogs}
          disabled={!logs || logs.length === 0}
        >
          <Download className="h-4 w-4" />
          Export Logs
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700">
                Search
              </label>
              <div className="relative mt-1">
                <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search by user ID, resource, or IP address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Popover open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  className="relative flex-shrink-0"
                >
                  <Filter className="h-4 w-4" />
                  {activeFilterCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 text-xs"
                    >
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium">Filters</h4>
                    {activeFilterCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearFilters}>
                        <X className="mr-1 h-4 w-4" />
                        Clear
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Action Type</Label>
                      <Select
                        value={actionFilter}
                        onValueChange={setActionFilter}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Actions</SelectItem>
                          <SelectItem value="create">Create</SelectItem>
                          <SelectItem value="read">Read</SelectItem>
                          <SelectItem value="update">Update</SelectItem>
                          <SelectItem value="delete">Delete</SelectItem>
                          <SelectItem value="login">Login</SelectItem>
                          <SelectItem value="logout">Logout</SelectItem>
                          <SelectItem value="failed_login">
                            Failed Login
                          </SelectItem>
                          <SelectItem value="password_change">
                            Password Change
                          </SelectItem>
                          <SelectItem value="emergency_access">
                            Emergency Access
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Time Period</Label>
                      <Select value={dateFilter} onValueChange={setDateFilter}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          <SelectItem value="today">Today</SelectItem>
                          <SelectItem value="week">Last 7 Days</SelectItem>
                          <SelectItem value="month">This Month</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Activity Log</CardTitle>
            <Badge variant="secondary">{logs?.length || 0} events</Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-8 w-8 rounded" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex h-32 items-center justify-center text-red-600">
              Error loading logs: {error.message}
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Action</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>IP Address</TableHead>
                  <TableHead>Timestamp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log: AuditLog) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getActionIcon(log.action)}
                        <Badge
                          className={getActionColor(log.action)}
                          variant="secondary"
                        >
                          {log.action.replace("_", " ").toUpperCase()}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.user_id
                        ? `${log.user_id.substring(0, 8)}...`
                        : "System"}
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm font-medium">
                          {log.resource_type || "N/A"}
                        </div>
                        <div className="font-mono text-xs text-gray-500">
                          {log.resource_id
                            ? `${log.resource_id.substring(0, 12)}...`
                            : "N/A"}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {log.ip_address}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      {formatTimestamp(log.timestamp.toString())}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-gray-500">
              <p className="text-lg font-medium">No audit logs found</p>
              <p className="text-sm">
                {searchTerm || activeFilterCount > 0
                  ? "Try adjusting your search criteria"
                  : "No activity has been logged yet"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
