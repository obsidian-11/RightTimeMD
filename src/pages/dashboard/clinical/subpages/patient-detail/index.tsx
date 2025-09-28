import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useFHIRData } from "@/hooks/useFHIRData";
import { useClinic } from "@/hooks";
import type { Patient } from "@/types";

// Import sub-components
import { PatientOverview } from "./PatientOverview";
import { FHIRDataSummary } from "./FHIRDataSummary";
import { MedicationInfo } from "./MedicationInfo";
import { QuickActions } from "./QuickActions";

// Import modals
import { ScheduleAppointmentModal } from "./modals/ScheduleAppointmentModal";
import { FHIRDataModal } from "./modals/FHIRDataModal";
import { VitalsModal } from "./modals/VitalsModal";
import { MedicationsModal } from "./modals/MedicationsModal";
import { AddConditionModal } from "./modals/AddConditionModal";
import { AddLabResultsModal } from "./modals/AddLabResultsModal";
import { AddAllergyModal } from "./modals/AddAllergyModal";
import { AddProcedureModal } from "./modals/AddProcedureModal";
import { AddClinicalNotesModal } from "./modals/AddClinicalNotesModal";
import { ManageCarePlanModal } from "./modals/ManageCarePlanModal";

export function PatientDetail() {
  const { patientId } = useParams();
  const { currentClinic } = useClinic();

  const {
    data: fhirData,
    loading: fhirLoading,
    loadPatientFHIRDataById,
    getVitalSigns,
    getActiveConditions,
    getLabResults,
    getMedications,
    getAllergies,
    getProcedures,
  } = useFHIRData();

  // Modal states
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isFHIRModalOpen, setIsFHIRModalOpen] = useState(false);
  const [isVitalsModalOpen, setIsVitalsModalOpen] = useState(false);
  const [isMedicationsModalOpen, setIsMedicationsModalOpen] = useState(false);
  const [isAddConditionModalOpen, setIsAddConditionModalOpen] = useState(false);
  const [isAddLabResultsModalOpen, setIsAddLabResultsModalOpen] =
    useState(false);
  const [isAddAllergyModalOpen, setIsAddAllergyModalOpen] = useState(false);
  const [isAddProcedureModalOpen, setIsAddProcedureModalOpen] = useState(false);
  const [isAddClinicalNotesModalOpen, setIsAddClinicalNotesModalOpen] =
    useState(false);
  const [isManageCarePlanModalOpen, setIsManageCarePlanModalOpen] =
    useState(false);

  // Query for patient details
  const {
    data: patient,
    isLoading: patientLoading,
    error,
  } = useQuery({
    queryKey: ["patient", patientId],
    queryFn: async () => {
      if (!patientId) throw new Error("Patient ID is required");

      const { data, error } = await supabase
        .from("patient")
        .select("*")
        .eq("id", patientId)
        .single();

      if (error) throw error;
      return data as Patient;
    },
    enabled: !!patientId,
  });

  // Load FHIR data when patient is loaded
  useEffect(() => {
    if (patient?.id && !fhirData) {
      loadPatientFHIRDataById(patient.id);
    }
  }, [patient?.id, fhirData, loadPatientFHIRDataById]);

  // Handle loading states
  if (patientLoading || fhirLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-8 w-48" />
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          <div className="space-y-6 md:col-span-2">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="space-y-6">
            <Skeleton className="h-48 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  // Handle error states
  if (error || !patient) {
    return (
      <div className="flex h-screen flex-col items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-500" />
          <h3 className="mb-2 text-lg font-medium text-gray-900">
            Patient Not Found
          </h3>
          <p className="mb-4 text-gray-600">
            {error?.message || "The requested patient could not be found."}
          </p>
          <Button variant="outline" size="sm" asChild>
            <Link to="../patients">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Patients
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // Get processed FHIR data
  const vitals = getVitalSigns?.();
  const conditions = getActiveConditions?.();
  const labResults = getLabResults?.();
  const medications = getMedications?.();
  const allergies = getAllergies?.();
  const procedures = getProcedures?.();

  const handleVitalsSaved = () => {
    if (patient.id) {
      loadPatientFHIRDataById(patient.id);
    }
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="sm" asChild>
          <Link to="../patients">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Patients
          </Link>
        </Button>
        <h1 className="text-2xl font-bold text-gray-900">
          {patient.firstname} {patient.lastname}
        </h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="space-y-6 md:col-span-2">
          {/* Patient Overview */}
          <PatientOverview patient={patient} />

          {/* FHIR Data Summary */}
          <FHIRDataSummary
            vitals={vitals}
            conditions={conditions}
            labResults={labResults}
            medications={medications}
            loading={fhirLoading}
            hasData={!!fhirData}
          />

          {/* Medication Information */}
          <MedicationInfo
            medications={medications || []}
            loading={fhirLoading}
          />
        </div>

        {/* Sidebar */}
        <QuickActions
          patient={patient}
          onScheduleAppointment={() => setIsScheduleModalOpen(true)}
          onViewFHIRData={() => setIsFHIRModalOpen(true)}
          onAddVitals={() => setIsVitalsModalOpen(true)}
          onManageMedications={() => setIsMedicationsModalOpen(true)}
          onAddCondition={() => setIsAddConditionModalOpen(true)}
          onAddLabResults={() => setIsAddLabResultsModalOpen(true)}
          onAddAllergy={() => setIsAddAllergyModalOpen(true)}
          onAddProcedure={() => setIsAddProcedureModalOpen(true)}
          onAddClinicalNotes={() => setIsAddClinicalNotesModalOpen(true)}
          onManageCarePlan={() => setIsManageCarePlanModalOpen(true)}
        />
      </div>

      {/* Modals */}
      <ScheduleAppointmentModal
        isOpen={isScheduleModalOpen}
        onClose={() => setIsScheduleModalOpen(false)}
        patient={patient}
        clinicId={currentClinic?.id || ""}
      />

      <FHIRDataModal
        isOpen={isFHIRModalOpen}
        onClose={() => setIsFHIRModalOpen(false)}
        patient={patient}
        fhirData={fhirData}
        vitals={vitals || []}
        conditions={conditions || []}
        medications={medications || []}
        labResults={labResults || []}
        allergies={allergies || []}
        procedures={procedures || []}
        loading={fhirLoading}
      />

      <VitalsModal
        isOpen={isVitalsModalOpen}
        onClose={() => setIsVitalsModalOpen(false)}
        patient={patient}
        onVitalsSaved={handleVitalsSaved}
      />

      <MedicationsModal
        isOpen={isMedicationsModalOpen}
        onClose={() => setIsMedicationsModalOpen(false)}
        patient={patient}
      />

      <AddConditionModal
        isOpen={isAddConditionModalOpen}
        onClose={() => setIsAddConditionModalOpen(false)}
        patient={patient}
        onConditionAdded={handleVitalsSaved}
      />

      <AddLabResultsModal
        isOpen={isAddLabResultsModalOpen}
        onClose={() => setIsAddLabResultsModalOpen(false)}
        patient={patient}
        onLabResultAdded={handleVitalsSaved}
      />

      <AddAllergyModal
        isOpen={isAddAllergyModalOpen}
        onClose={() => setIsAddAllergyModalOpen(false)}
        patient={patient}
        onAllergyAdded={handleVitalsSaved}
      />

      <AddProcedureModal
        isOpen={isAddProcedureModalOpen}
        onClose={() => setIsAddProcedureModalOpen(false)}
        patient={patient}
        onProcedureAdded={handleVitalsSaved}
      />

      <AddClinicalNotesModal
        isOpen={isAddClinicalNotesModalOpen}
        onClose={() => setIsAddClinicalNotesModalOpen(false)}
        patient={patient}
        onNotesAdded={handleVitalsSaved}
      />

      <ManageCarePlanModal
        isOpen={isManageCarePlanModalOpen}
        onClose={() => setIsManageCarePlanModalOpen(false)}
        patient={patient}
        onCarePlanAdded={handleVitalsSaved}
      />
    </div>
  );
}
