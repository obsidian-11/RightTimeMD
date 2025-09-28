import { useState, useEffect } from "react";
import { useFHIRData } from "@/hooks/useFHIRData";
import { useAuth } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function MedicalHistory() {
  const { user } = useAuth();
  const { data, loading, error, loadPatientFHIRDataById, getActiveConditions } =
    useFHIRData();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Load FHIR data by patient ID from authenticated user
    if (!initialized && user?.id) {
      loadPatientFHIRDataById(user.id);
      setInitialized(true);
    }
  }, [initialized, user?.id, loadPatientFHIRDataById]);

  const formatDate = (dateString: string) => {
    if (!dateString) return "Unknown date";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const getAllConditions = () => {
    if (!data?.conditions) return [];
    return data.conditions.sort(
      (a, b) =>
        new Date(b.recordedDate || b.onsetDateTime || "").getTime() -
        new Date(a.recordedDate || a.onsetDateTime || "").getTime(),
    );
  };

  const getRecentEncounters = () => {
    if (!data?.encounters) return [];
    return data.encounters
      .sort(
        (a, b) =>
          new Date(b.period?.start || "").getTime() -
          new Date(a.period?.start || "").getTime(),
      )
      .slice(0, 10); // Show last 10 encounters
  };

  const getConditionStatus = (condition: any) => {
    const status = condition.clinicalStatus?.coding?.[0]?.code;
    switch (status) {
      case "active":
        return { label: "Active", variant: "destructive" as const };
      case "resolved":
        return { label: "Resolved", variant: "secondary" as const };
      case "inactive":
        return { label: "Inactive", variant: "outline" as const };
      default:
        return { label: "Unknown", variant: "outline" as const };
    }
  };

  const getEncounterType = (encounter: any) => {
    return (
      encounter.type?.[0]?.text ||
      encounter.type?.[0]?.coding?.[0]?.display ||
      "Unknown encounter type"
    );
  };

  if (loading) {
    return (
      <div className="min-h-full space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 p-4">
          <h3 className="font-medium text-red-800">
            Error loading medical history
          </h3>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <p>No medical history available</p>
        </div>
      </div>
    );
  }

  const allConditions = getAllConditions();
  const activeConditions = getActiveConditions();
  const recentEncounters = getRecentEncounters();

  return (
    <div className="min-h-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Medical History</h1>
        <p className="text-gray-600">
          Comprehensive view of conditions, diagnoses, and healthcare encounters
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {allConditions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Conditions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeConditions.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Healthcare Visits
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {data.encounters?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Conditions */}
        <Card>
          <CardHeader>
            <CardTitle>Conditions & Diagnoses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {allConditions.length > 0 ? (
              allConditions.map((condition: any, index: number) => {
                const status = getConditionStatus(condition);
                return (
                  <div
                    key={index}
                    className="flex items-start justify-between border-b border-gray-100 pb-3 last:border-b-0"
                  >
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {condition.code?.text ||
                          condition.code?.coding?.[0]?.display ||
                          "Unknown condition"}
                      </h4>
                      <div className="mt-1 space-x-2 text-sm text-gray-500">
                        <span>
                          Recorded: {formatDate(condition.recordedDate)}
                        </span>
                        {condition.onsetDateTime && (
                          <span>
                            • Onset: {formatDate(condition.onsetDateTime)}
                          </span>
                        )}
                        {condition.abatementDateTime && (
                          <span>
                            • Resolved:{" "}
                            {formatDate(condition.abatementDateTime)}
                          </span>
                        )}
                      </div>
                    </div>
                    <Badge variant={status.variant} className="ml-2">
                      {status.label}
                    </Badge>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No conditions recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Recent Encounters */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Healthcare Visits</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentEncounters.length > 0 ? (
              recentEncounters.map((encounter: any, index: number) => (
                <div
                  key={index}
                  className="border-b border-gray-100 pb-3 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {getEncounterType(encounter)}
                      </h4>
                      <div className="mt-1 text-sm text-gray-500">
                        <div>Date: {formatDate(encounter.period?.start)}</div>
                        {encounter.participant?.[0]?.individual?.display && (
                          <div>
                            Provider:{" "}
                            {encounter.participant[0].individual.display}
                          </div>
                        )}
                        {encounter.serviceProvider?.display && (
                          <div>
                            Facility: {encounter.serviceProvider.display}
                          </div>
                        )}
                      </div>
                    </div>
                    <Badge
                      variant={
                        encounter.status === "finished"
                          ? "secondary"
                          : "default"
                      }
                      className="ml-2 capitalize"
                    >
                      {encounter.status || "Unknown"}
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No encounters recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Timeline View - Future Enhancement */}
      <Card>
        <CardHeader>
          <CardTitle>Medical Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <p>Timeline view coming soon...</p>
            <p className="mt-1 text-sm">
              This will show a chronological view of all medical events
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
