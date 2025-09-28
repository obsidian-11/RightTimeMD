import { Activity, Stethoscope, Pill, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface FHIRDataSummaryProps {
  vitals: any[] | undefined;
  conditions: any[] | undefined;
  labResults: any[] | undefined;
  medications: any[] | undefined;
  loading: boolean;
  hasData: boolean;
}

export function FHIRDataSummary({
  vitals,
  conditions,
  labResults,
  medications,
  loading,
  hasData,
}: FHIRDataSummaryProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">FHIR Data Summary</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-3">
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
            <Skeleton className="h-24" />
          </div>
        ) : hasData ? (
          <div className="grid gap-4 md:grid-cols-4">
            <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-3">
              <Activity className="h-8 w-8 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Vitals</p>
                <p className="text-sm text-blue-700">
                  {vitals?.length || 0} records
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-red-50 p-3">
              <Stethoscope className="h-8 w-8 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Conditions</p>
                <p className="text-sm text-red-700">
                  {conditions?.length || 0} active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-green-50 p-3">
              <Pill className="h-8 w-8 text-green-600" />
              <div>
                <p className="font-medium text-green-900">Medications</p>
                <p className="text-sm text-green-700">
                  {medications?.length || 0} active
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg bg-purple-50 p-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <p className="font-medium text-purple-900">Lab Results</p>
                <p className="text-sm text-purple-700">
                  {labResults?.length || 0} results
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">
            <FileText className="mx-auto mb-4 h-12 w-12 text-gray-400" />
            <p>No FHIR data available for this patient</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
