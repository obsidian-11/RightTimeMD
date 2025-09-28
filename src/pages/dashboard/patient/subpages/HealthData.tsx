import { useState, useEffect } from "react";
import { useFHIRData } from "@/hooks/useFHIRData";
import { useAuth } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function HealthData() {
  const { user } = useAuth();
  const {
    data,
    loading,
    error,
    loadPatientFHIRDataById,
    getVitalSigns,
    getLabResults,
  } = useFHIRData();
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

  const formatDateTime = (dateString: string) => {
    if (!dateString) return "Unknown time";
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const getObservationName = (observation: any) => {
    return (
      observation.code?.text ||
      observation.code?.coding?.[0]?.display ||
      "Unknown observation"
    );
  };

  const getObservationValue = (observation: any) => {
    if (observation.valueQuantity) {
      return `${observation.valueQuantity.value} ${observation.valueQuantity.unit || observation.valueQuantity.code || ""}`;
    }
    if (observation.valueString) {
      return observation.valueString;
    }
    if (observation.valueBoolean !== undefined) {
      return observation.valueBoolean ? "Yes" : "No";
    }
    if (observation.valueCodeableConcept) {
      return (
        observation.valueCodeableConcept.text ||
        observation.valueCodeableConcept.coding?.[0]?.display ||
        "Coded value"
      );
    }
    if (observation.component) {
      return observation.component
        .map(
          (comp: any) =>
            `${comp.code?.text || comp.code?.coding?.[0]?.display}: ${getObservationValue(comp)}`,
        )
        .join(", ");
    }
    return "No value recorded";
  };

  const getObservationCategory = (observation: any) => {
    const category = observation.category?.[0]?.coding?.[0]?.code;
    switch (category) {
      case "vital-signs":
        return { label: "Vital Signs", variant: "default" as const };
      case "laboratory":
        return { label: "Lab Results", variant: "secondary" as const };
      case "imaging":
        return { label: "Imaging", variant: "outline" as const };
      case "procedure":
        return { label: "Procedure", variant: "outline" as const };
      default:
        return { label: "Other", variant: "outline" as const };
    }
  };

  const getVitalSignsByType = () => {
    const vitals = getVitalSigns();
    const vitalTypes = new Map();

    vitals.forEach((vital: any) => {
      const code = vital.code?.coding?.[0]?.code;
      const name = getObservationName(vital);

      if (!vitalTypes.has(code)) {
        vitalTypes.set(code, {
          name,
          observations: [],
        });
      }
      vitalTypes.get(code).observations.push(vital);
    });

    // Sort observations by date for each vital type
    vitalTypes.forEach((vitalType) => {
      vitalType.observations.sort(
        (a: any, b: any) =>
          new Date(b.effectiveDateTime).getTime() -
          new Date(a.effectiveDateTime).getTime(),
      );
    });

    return vitalTypes;
  };

  const getLatestVitalValue = (observations: any[]) => {
    if (observations.length === 0) return null;
    const latest = observations[0];
    return {
      value: getObservationValue(latest),
      date: latest.effectiveDateTime,
      trend: observations.length > 1 ? "stable" : null, // Could calculate actual trend
    };
  };

  const getAllObservations = () => {
    if (!data?.observations) return [];
    return data.observations.sort(
      (a, b) =>
        new Date(b.effectiveDateTime || "").getTime() -
        new Date(a.effectiveDateTime || "").getTime(),
    );
  };

  if (loading) {
    return (
      <div className="min-h-full space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-48" />
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
            Error loading health data
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
          <p>No health data available</p>
        </div>
      </div>
    );
  }

  const vitalSigns = getVitalSigns();
  const labResults = getLabResults();
  const allObservations = getAllObservations();
  const vitalsByType = getVitalSignsByType();

  return (
    <div className="min-h-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Health Data</h1>
        <p className="text-gray-600">
          Vital signs, laboratory results, and clinical observations
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Observations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {allObservations.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Vital Signs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {vitalSigns.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Lab Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {labResults.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Vital Types
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {vitalsByType.size}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Latest Vital Signs */}
      {vitalsByType.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Vital Signs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
              {Array.from(vitalsByType.entries()).map(([code, vitalType]) => {
                const latest = getLatestVitalValue(vitalType.observations);
                return (
                  <div key={code} className="rounded-lg border bg-gray-50 p-4">
                    <h4 className="font-semibold text-gray-900">
                      {vitalType.name}
                    </h4>
                    {latest ? (
                      <div className="mt-2">
                        <div className="text-2xl font-bold text-blue-600">
                          {latest.value}
                        </div>
                        <div className="text-sm text-gray-500">
                          {formatDate(latest.date)}
                        </div>
                        <div className="mt-1 text-xs text-gray-400">
                          {vitalType.observations.length} measurement
                          {vitalType.observations.length > 1 ? "s" : ""}
                        </div>
                      </div>
                    ) : (
                      <p className="mt-2 text-sm text-gray-500">No data</p>
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Observations */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Lab Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Laboratory Results
              <Badge variant="secondary">{labResults.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 space-y-3 overflow-y-auto">
            {labResults.length > 0 ? (
              labResults.slice(0, 20).map((observation: any, index: number) => (
                <div
                  key={index}
                  className="border-b border-gray-100 pb-3 last:border-b-0"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">
                        {getObservationName(observation)}
                      </h4>
                      <div className="mt-1 text-sm text-gray-600">
                        <span className="font-medium">
                          {getObservationValue(observation)}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-gray-500">
                        {formatDateTime(observation.effectiveDateTime)}
                      </div>
                    </div>
                    <Badge variant="secondary" className="ml-2">
                      Lab
                    </Badge>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-sm text-gray-500">No lab results recorded</p>
            )}
          </CardContent>
        </Card>

        {/* All Recent Observations */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Observations</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 space-y-3 overflow-y-auto">
            {allObservations.length > 0 ? (
              allObservations
                .slice(0, 20)
                .map((observation: any, index: number) => {
                  const category = getObservationCategory(observation);
                  return (
                    <div
                      key={index}
                      className="border-b border-gray-100 pb-3 last:border-b-0"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">
                            {getObservationName(observation)}
                          </h4>
                          <div className="mt-1 text-sm text-gray-600">
                            <span className="font-medium">
                              {getObservationValue(observation)}
                            </span>
                          </div>
                          <div className="mt-1 text-xs text-gray-500">
                            {formatDateTime(observation.effectiveDateTime)}
                          </div>
                        </div>
                        <Badge variant={category.variant} className="ml-2">
                          {category.label}
                        </Badge>
                      </div>
                    </div>
                  );
                })
            ) : (
              <p className="text-sm text-gray-500">No observations recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Health Trends - Future Enhancement */}
      <Card>
        <CardHeader>
          <CardTitle>Health Trends & Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <p>Health trend analysis and charts coming soon...</p>
            <p className="mt-1 text-sm">
              Features will include vital sign trends, lab result tracking, and
              health pattern analysis
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
