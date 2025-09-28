import { Calendar, FileText, Activity, Pill, Stethoscope, FlaskConical, AlertTriangle, Clipboard, HeartHandshake, FileBarChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import type { Patient } from "@/types";

interface QuickActionsProps {
  patient: Patient;
  onScheduleAppointment: () => void;
  onViewFHIRData: () => void;
  onAddVitals: () => void;
  onManageMedications: () => void;
  onAddCondition: () => void;
  onAddLabResults: () => void;
  onAddAllergy: () => void;
  onAddProcedure: () => void;
  onAddClinicalNotes: () => void;
  onManageCarePlan: () => void;
}

export function QuickActions({
  patient,
  onScheduleAppointment,
  onViewFHIRData,
  onAddVitals,
  onManageMedications,
  onAddCondition,
  onAddLabResults,
  onAddAllergy,
  onAddProcedure,
  onAddClinicalNotes,
  onManageCarePlan,
}: QuickActionsProps) {
  return (
    <div className="space-y-6">
      {/* Patient Avatar */}
      <Card>
        <CardContent className="pt-6">
          <div className="text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-blue-100 text-2xl font-bold text-blue-600">
              {patient.firstname.charAt(0)}
              {patient.lastname.charAt(0)}
            </div>
            <h3 className="mt-4 font-medium text-gray-900">
              {patient.firstname} {patient.lastname}
            </h3>
            <p className="text-sm text-gray-500">
              MRN: {patient.mrn || "Auto-generated"}
            </p>
            <Badge variant="default" className="mt-2">
              Active Patient
            </Badge>
          </div>

          <Separator className="my-6" />

          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="mt-2 h-2 w-2 rounded-full bg-blue-500"></div>
              <div>
                <p className="font-medium">Patient created</p>
                <p className="text-gray-600">
                  {patient.created_at
                    ? format(new Date(patient.created_at), "PPP p")
                    : "N/A"}
                </p>
              </div>
            </div>
            <div className="py-4 text-center text-gray-500">
              <p className="text-xs">More activity tracking coming soon</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {/* Administrative Actions */}
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onScheduleAppointment}
          >
            <Calendar className="mr-2 h-4 w-4" />
            Schedule Appointment
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start"
            onClick={onViewFHIRData}
          >
            <FileText className="mr-2 h-4 w-4" />
            View Full FHIR Data
          </Button>
          
          {/* Clinical Data Entry */}
          <div className="pt-2">
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Clinical Data</p>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onAddVitals}
              >
                <Activity className="mr-2 h-4 w-4" />
                Add Vitals
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onAddCondition}
              >
                <Stethoscope className="mr-2 h-4 w-4" />
                Add Condition/Diagnosis
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onAddLabResults}
              >
                <FlaskConical className="mr-2 h-4 w-4" />
                Add Lab Results
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onAddAllergy}
              >
                <AlertTriangle className="mr-2 h-4 w-4" />
                Add Allergy
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onAddProcedure}
              >
                <Clipboard className="mr-2 h-4 w-4" />
                Add Procedure
              </Button>
            </div>
          </div>
          
          {/* Treatment Management */}
          <div className="pt-2">
            <p className="mb-2 text-xs font-semibold text-gray-500 uppercase tracking-wide">Treatment</p>
            <div className="space-y-1">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onManageMedications}
              >
                <Pill className="mr-2 h-4 w-4" />
                Manage Medications
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onManageCarePlan}
              >
                <HeartHandshake className="mr-2 h-4 w-4" />
                Manage Care Plan
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={onAddClinicalNotes}
              >
                <FileBarChart className="mr-2 h-4 w-4" />
                Add Clinical Notes
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
