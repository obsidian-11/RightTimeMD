import { useState, useEffect } from "react";
import { useFHIRData } from "@/hooks/useFHIRData";
import { useAuth } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function Dashboard() {
  const { user } = useAuth();
  const {
    data,
    loading,
    error,
    loadPatientFHIRDataById,
    getVitalSigns,
    getActiveConditions,
  } = useFHIRData();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    // Load FHIR data by patient ID from authenticated user
    if (!initialized && user?.id) {
      loadPatientFHIRDataById(user.id);
      setInitialized(true);
    }
  }, [initialized, user?.id, loadPatientFHIRDataById]);

  const formatPatientName = (patient: any) => {
    if (!patient?.name?.[0]) return "Unknown Patient";
    const name = patient.name[0];
    return `${name.given?.join(" ") || ""} ${name.family || ""}`.trim();
  };

  const formatAge = (birthDate: string) => {
    if (!birthDate) return "Unknown";
    const birth = new Date(birthDate);
    const now = new Date();
    const years = now.getFullYear() - birth.getFullYear();
    return `${years} years old`;
  };

  const getLatestVitalValue = (code: string, vitalSigns: any[]) => {
    const vital = vitalSigns
      .filter((v) => v.code?.coding?.some((c: any) => c.code === code))
      .sort(
        (a, b) =>
          new Date(b.effectiveDateTime).getTime() -
          new Date(a.effectiveDateTime).getTime(),
      )[0];

    if (!vital) return null;

    return {
      value: vital.valueQuantity?.value || vital.valueString,
      unit: vital.valueQuantity?.unit || "",
      date: vital.effectiveDateTime,
    };
  };

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-32" />
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
            Error loading patient data
          </h3>
          <p className="mt-1 text-sm text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!data?.patient) {
    return (
      <div className="p-6">
        <div className="text-center text-gray-500">
          <p>No patient data available</p>
        </div>
      </div>
    );
  }

  const patient = data.patient;
  const vitalSigns = getVitalSigns();
  const activeConditions = getActiveConditions();

  // Get latest vital signs
  const height = getLatestVitalValue("8302-2", vitalSigns); // Body Height
  const weight = getLatestVitalValue("29463-7", vitalSigns); // Body Weight
  const bmi = getLatestVitalValue("39156-5", vitalSigns); // BMI

  return (
    <div className="min-h-full space-y-6 p-6">
      {/* Patient Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">
          {formatPatientName(patient)}
        </h1>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>DOB: {patient.birthDate}</span>
          <span>•</span>
          <span>{formatAge(patient.birthDate)}</span>
          <span>•</span>
          <span className="capitalize">{patient.gender}</span>
          {patient.identifier?.find((id: any) =>
            id.system?.includes("ssn"),
          ) && (
            <>
              <span>•</span>
              <span>
                SSN: ***-**-
                {patient.identifier
                  .find((id: any) => id.system?.includes("ssn"))
                  ?.value?.slice(-4)}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {/* Patient Demographics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Demographics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">Race:</span>
              <span className="ml-2">
                {patient.extension
                  ?.find((ext: any) => ext.url?.includes("us-core-race"))
                  ?.extension?.find((e: any) => e.url === "text")
                  ?.valueString || "Not specified"}
              </span>
            </div>
            <div>
              <span className="text-sm text-gray-600">Ethnicity:</span>
              <span className="ml-2">
                {patient.extension
                  ?.find((ext: any) => ext.url?.includes("us-core-ethnicity"))
                  ?.extension?.find((e: any) => e.url === "text")
                  ?.valueString || "Not specified"}
              </span>
            </div>
            {patient.telecom?.[0] && (
              <div>
                <span className="text-sm text-gray-600">Phone:</span>
                <span className="ml-2">{patient.telecom[0].value}</span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vital Signs */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Latest Vitals</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {height && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Height:</span>
                <span>
                  {height.value} {height.unit}
                </span>
              </div>
            )}
            {weight && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Weight:</span>
                <span>
                  {weight.value} {weight.unit}
                </span>
              </div>
            )}
            {bmi && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">BMI:</span>
                <span>{bmi.value}</span>
              </div>
            )}
            {!height && !weight && !bmi && (
              <p className="text-sm text-gray-500">No vital signs recorded</p>
            )}
          </CardContent>
        </Card>

        {/* Active Conditions */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Active Conditions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {activeConditions.length > 0 ? (
                activeConditions
                  .slice(0, 3)
                  .map((condition: any, idx: number) => (
                    <Badge key={idx} variant="secondary" className="mr-1 mb-1">
                      {condition.code?.text ||
                        condition.code?.coding?.[0]?.display ||
                        "Unknown condition"}
                    </Badge>
                  ))
              ) : (
                <p className="text-sm text-gray-500">No active conditions</p>
              )}
              {activeConditions.length > 3 && (
                <p className="text-xs text-gray-400">
                  +{activeConditions.length - 3} more
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="text-lg">Medical Record Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {data.encounters?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Encounters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {data.conditions?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Conditions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">
                  {data.observations?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Observations</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">
                  {data.medications?.length || 0}
                </div>
                <div className="text-sm text-gray-600">Medications</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
