import { Pill } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface MedicationInfoProps {
  medications: any[];
  loading: boolean;
}

export function MedicationInfo({ medications, loading }: MedicationInfoProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Current Medications</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : medications && medications.length > 0 ? (
          <div className="space-y-3">
            {medications.slice(0, 5).map((med: any, index: number) => (
              <div
                key={index}
                className="flex items-start gap-3 rounded-lg border p-3"
              >
                <Pill className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">
                    {med.medicationCodeableConcept?.text ||
                      med.medicationCodeableConcept?.coding?.[0]?.display ||
                      med.medication?.display ||
                      "Unknown medication"}
                  </p>
                  <div className="mt-1 space-y-1 text-xs text-gray-500">
                    {med.dosageInstruction?.[0]?.text && (
                      <p>Dosage: {med.dosageInstruction[0].text}</p>
                    )}
                    {med.status && (
                      <p>
                        Status: <span className="capitalize">{med.status}</span>
                      </p>
                    )}
                    {med.authoredOn && (
                      <p>
                        Prescribed:{" "}
                        {new Date(med.authoredOn).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {medications.length > 5 && (
              <p className="text-center text-sm text-gray-500">
                +{medications.length - 5} more medications
              </p>
            )}
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <Pill className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p>No medication data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
