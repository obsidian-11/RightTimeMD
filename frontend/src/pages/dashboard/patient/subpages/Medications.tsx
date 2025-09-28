import { useState, useEffect } from "react";
import { useFHIRData } from "@/hooks/useFHIRData";
import { useAuth } from "@/hooks";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export function Medications() {
  const { user } = useAuth();
  const { data, loading, error, loadPatientFHIRDataById } = useFHIRData();
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

  const getAllMedications = () => {
    if (!data?.medications) return [];
    return data.medications.sort(
      (a, b) =>
        new Date(b.authoredOn || "").getTime() -
        new Date(a.authoredOn || "").getTime(),
    );
  };

  const getActiveMedications = () => {
    return getAllMedications().filter(
      (med: any) => med.status === "active" || med.status === "completed",
    );
  };

  const getMedicationName = (medication: any) => {
    return (
      medication.medicationCodeableConcept?.text ||
      medication.medicationCodeableConcept?.coding?.[0]?.display ||
      medication.medicationReference?.display ||
      "Unknown medication"
    );
  };

  const getDosageInstructions = (medication: any) => {
    const dosage = medication.dosageInstruction?.[0];
    if (!dosage) return "No dosage information";

    let instruction = "";

    if (dosage.text) {
      return dosage.text;
    }

    if (dosage.doseAndRate?.[0]?.doseQuantity) {
      const dose = dosage.doseAndRate[0].doseQuantity;
      instruction += `${dose.value} ${dose.unit || dose.code}`;
    }

    if (dosage.timing?.repeat?.frequency && dosage.timing?.repeat?.period) {
      const freq = dosage.timing.repeat.frequency;
      const period = dosage.timing.repeat.period;
      const periodUnit = dosage.timing.repeat.periodUnit || "day";
      instruction += ` - ${freq} time${freq > 1 ? "s" : ""} per ${period} ${periodUnit}${period > 1 ? "s" : ""}`;
    }

    if (dosage.route?.text || dosage.route?.coding?.[0]?.display) {
      const route = dosage.route.text || dosage.route.coding[0].display;
      instruction += ` (${route})`;
    }

    return instruction || "See prescriber instructions";
  };

  const getMedicationStatus = (medication: any) => {
    const status = medication.status?.toLowerCase();
    switch (status) {
      case "active":
        return { label: "Active", variant: "default" as const };
      case "completed":
        return { label: "Completed", variant: "secondary" as const };
      case "stopped":
      case "cancelled":
        return { label: "Discontinued", variant: "destructive" as const };
      case "on-hold":
        return { label: "On Hold", variant: "outline" as const };
      case "draft":
        return { label: "Draft", variant: "outline" as const };
      default:
        return { label: status || "Unknown", variant: "outline" as const };
    }
  };

  const getRequester = (medication: any) => {
    return medication.requester?.display || "Unknown prescriber";
  };

  if (loading) {
    return (
      <div className="min-h-full space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
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
            Error loading medications
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
          <p>No medication data available</p>
        </div>
      </div>
    );
  }

  const allMedications = getAllMedications();
  const activeMedications = getActiveMedications();

  return (
    <div className="min-h-full space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900">Medications</h1>
        <p className="text-gray-600">
          Current and past medications, prescriptions, and dosage instructions
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {allMedications.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Active Medications
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {activeMedications.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Prescribers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">
              {
                new Set(allMedications.map((med: any) => getRequester(med)))
                  .size
              }
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Active Medications */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Active Medications
              <Badge variant="default">{activeMedications.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {activeMedications.length > 0 ? (
              activeMedications.map((medication: any, index: number) => {
                const status = getMedicationStatus(medication);
                return (
                  <div
                    key={index}
                    className="rounded-lg border border-green-200 bg-green-50 p-4"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900">
                          {getMedicationName(medication)}
                        </h4>
                        <div className="mt-2 space-y-1 text-sm text-gray-700">
                          <div className="font-medium">
                            Dosage: {getDosageInstructions(medication)}
                          </div>
                          <div>
                            Prescribed: {formatDate(medication.authoredOn)}
                          </div>
                          <div>Prescriber: {getRequester(medication)}</div>
                        </div>
                      </div>
                      <Badge variant={status.variant} className="ml-2">
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No active medications</p>
            )}
          </CardContent>
        </Card>

        {/* All Medications */}
        <Card>
          <CardHeader>
            <CardTitle>All Medications</CardTitle>
          </CardHeader>
          <CardContent className="max-h-96 space-y-4 overflow-y-auto">
            {allMedications.length > 0 ? (
              allMedications.map((medication: any, index: number) => {
                const status = getMedicationStatus(medication);
                return (
                  <div
                    key={index}
                    className="border-b border-gray-100 pb-3 last:border-b-0"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900">
                          {getMedicationName(medication)}
                        </h4>
                        <div className="mt-1 space-y-1 text-sm text-gray-500">
                          <div>{getDosageInstructions(medication)}</div>
                          <div className="flex gap-4">
                            <span>
                              Prescribed: {formatDate(medication.authoredOn)}
                            </span>
                            <span>By: {getRequester(medication)}</span>
                          </div>
                        </div>
                      </div>
                      <Badge variant={status.variant} className="ml-2">
                        {status.label}
                      </Badge>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-sm text-gray-500">No medications recorded</p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Medication Adherence & Notes - Future Enhancement */}
      <Card>
        <CardHeader>
          <CardTitle>Medication Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="py-8 text-center text-gray-500">
            <p>Adherence tracking and medication reminders coming soon...</p>
            <p className="mt-1 text-sm">
              Features will include dose tracking, refill reminders, and
              interaction alerts
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
