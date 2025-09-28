import { useState } from "react";
import {
  User,
  Activity,
  Stethoscope,
  Pill,
  FileText,
  AlertCircle,
  Calendar,
  Search,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";

interface FHIRViewerProps {
  fhirData: any;
  vitals: any[];
  conditions: any[];
  medications: any[];
  labResults: any[];
  allergies: any[];
  procedures: any[];
  loading: boolean;
}

export function FHIRViewer({
  fhirData,
  vitals,
  conditions,
  medications,
  labResults,
  allergies,
  procedures,
  loading,
}: FHIRViewerProps) {
  // Search states for each section
  const [vitalsSearch, setVitalsSearch] = useState("");
  const [conditionsSearch, setConditionsSearch] = useState("");
  const [medicationsSearch, setMedicationsSearch] = useState("");
  const [labResultsSearch, setLabResultsSearch] = useState("");
  const [allergiesSearch, setAllergiesSearch] = useState("");
  const [proceduresSearch, setProceduresSearch] = useState("");

  // Filter functions
  const filterVitals = (vitals: any[]) => {
    if (!vitalsSearch) return vitals;
    return vitals.filter((vital) =>
      (vital.code?.text || vital.code?.coding?.[0]?.display || "")
        .toLowerCase()
        .includes(vitalsSearch.toLowerCase()),
    );
  };

  const filterConditions = (conditions: any[]) => {
    if (!conditionsSearch) return conditions;
    return conditions.filter((condition) =>
      (condition.code?.text || condition.code?.coding?.[0]?.display || "")
        .toLowerCase()
        .includes(conditionsSearch.toLowerCase()),
    );
  };

  const filterMedications = (medications: any[]) => {
    if (!medicationsSearch) return medications;
    return medications.filter((med) =>
      (
        med.medicationCodeableConcept?.text ||
        med.medicationCodeableConcept?.coding?.[0]?.display ||
        med.medication?.display ||
        ""
      )
        .toLowerCase()
        .includes(medicationsSearch.toLowerCase()),
    );
  };

  const filterLabResults = (labResults: any[]) => {
    if (!labResultsSearch) return labResults;
    return labResults.filter((lab) =>
      (lab.code?.text || lab.code?.coding?.[0]?.display || "")
        .toLowerCase()
        .includes(labResultsSearch.toLowerCase()),
    );
  };

  const filterAllergies = (allergies: any[]) => {
    if (!allergiesSearch) return allergies;
    return allergies.filter((allergy) =>
      (allergy.code?.text || allergy.code?.coding?.[0]?.display || "")
        .toLowerCase()
        .includes(allergiesSearch.toLowerCase()),
    );
  };

  const filterProcedures = (procedures: any[]) => {
    if (!proceduresSearch) return procedures;
    return procedures.filter((procedure) =>
      (procedure.code?.text || procedure.code?.coding?.[0]?.display || "")
        .toLowerCase()
        .includes(proceduresSearch.toLowerCase()),
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (!fhirData) {
    return <p className="text-gray-500">No FHIR data available</p>;
  }

  const filteredVitals = filterVitals(vitals || []);
  const filteredConditions = filterConditions(conditions || []);
  const filteredMedications = filterMedications(medications || []);
  const filteredLabResults = filterLabResults(labResults || []);
  const filteredAllergies = filterAllergies(allergies || []);
  const filteredProcedures = filterProcedures(procedures || []);

  return (
    <div className="space-y-6">
      {/* Patient Demographics */}
      {fhirData.patient && (
        <div className="space-y-3">
          <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
            <User className="h-5 w-5" />
            Patient Information
          </h3>
          <div className="rounded-lg border bg-gray-50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium">Name:</span>{" "}
                {fhirData.patient.name?.[0]?.given?.join(" ")}{" "}
                {fhirData.patient.name?.[0]?.family}
              </div>
              <div>
                <span className="font-medium">Gender:</span>{" "}
                {fhirData.patient.gender}
              </div>
              <div>
                <span className="font-medium">Birth Date:</span>{" "}
                {fhirData.patient.birthDate}
              </div>
              <div>
                <span className="font-medium">ID:</span> {fhirData.patient.id}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vital Signs */}
      {vitals && vitals.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Activity className="h-5 w-5" />
              Vital Signs ({vitals.length})
              {vitalsSearch && ` (${filteredVitals.length} filtered)`}
            </h3>
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search vitals..."
                value={vitalsSearch}
                onChange={(e) => setVitalsSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredVitals.map((vital: any, index: number) => (
              <div key={index} className="rounded-lg border bg-gray-50 p-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {vital.code?.text || vital.code?.coding?.[0]?.display}
                  </div>
                  <div className="mt-1 text-gray-600">
                    {vital.valueQuantity ? (
                      <span>
                        {vital.valueQuantity.value} {vital.valueQuantity.unit}
                      </span>
                    ) : vital.component ? (
                      <div className="space-y-1">
                        {vital.component.map((comp: any, i: number) => (
                          <div key={i}>
                            {comp.code?.text}: {comp.valueQuantity?.value}{" "}
                            {comp.valueQuantity?.unit}
                          </div>
                        ))}
                      </div>
                    ) : (
                      "No value recorded"
                    )}
                  </div>
                  {vital.effectiveDateTime && (
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(vital.effectiveDateTime).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Conditions */}
      {conditions && conditions.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Stethoscope className="h-5 w-5" />
              Active Conditions ({conditions.length})
              {conditionsSearch && ` (${filteredConditions.length} filtered)`}
            </h3>
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search conditions..."
                value={conditionsSearch}
                onChange={(e) => setConditionsSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredConditions.map((condition: any, index: number) => (
              <div key={index} className="rounded-lg border bg-gray-50 p-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {condition.code?.text ||
                      condition.code?.coding?.[0]?.display}
                  </div>
                  <div className="mt-1 text-gray-600">
                    Status:{" "}
                    <span className="capitalize">
                      {condition.clinicalStatus?.coding?.[0]?.code}
                    </span>
                  </div>
                  {condition.onsetDateTime && (
                    <div className="mt-1 text-xs text-gray-500">
                      Onset:{" "}
                      {new Date(condition.onsetDateTime).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Medications */}
      {medications && medications.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Pill className="h-5 w-5" />
              Medications ({medications.length})
              {medicationsSearch && ` (${filteredMedications.length} filtered)`}
            </h3>
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search medications..."
                value={medicationsSearch}
                onChange={(e) => setMedicationsSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredMedications.map((med: any, index: number) => (
              <div key={index} className="rounded-lg border bg-gray-50 p-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {med.medicationCodeableConcept?.text ||
                      med.medicationCodeableConcept?.coding?.[0]?.display ||
                      med.medication?.display ||
                      "Unknown medication"}
                  </div>
                  <div className="mt-1 space-y-1 text-gray-600">
                    {med.dosageInstruction?.[0]?.text && (
                      <div>Dosage: {med.dosageInstruction[0].text}</div>
                    )}
                    {med.status && (
                      <div>
                        Status: <span className="capitalize">{med.status}</span>
                      </div>
                    )}
                  </div>
                  {med.authoredOn && (
                    <div className="mt-1 text-xs text-gray-500">
                      Prescribed:{" "}
                      {new Date(med.authoredOn).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lab Results */}
      {labResults && labResults.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <FileText className="h-5 w-5" />
              Lab Results ({labResults.length})
              {labResultsSearch && ` (${filteredLabResults.length} filtered)`}
            </h3>
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search lab results..."
                value={labResultsSearch}
                onChange={(e) => setLabResultsSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredLabResults.map((lab: any, index: number) => (
              <div key={index} className="rounded-lg border bg-gray-50 p-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {lab.code?.text || lab.code?.coding?.[0]?.display}
                  </div>
                  <div className="mt-1 text-gray-600">
                    {lab.valueQuantity ? (
                      <span>
                        {lab.valueQuantity.value} {lab.valueQuantity.unit}
                      </span>
                    ) : lab.valueString ? (
                      <span>{lab.valueString}</span>
                    ) : (
                      "No value recorded"
                    )}
                  </div>
                  {lab.effectiveDateTime && (
                    <div className="mt-1 text-xs text-gray-500">
                      {new Date(lab.effectiveDateTime).toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Allergies */}
      {allergies && allergies.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <AlertCircle className="h-5 w-5" />
              Allergies & Intolerances ({allergies.length})
              {allergiesSearch && ` (${filteredAllergies.length} filtered)`}
            </h3>
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search allergies..."
                value={allergiesSearch}
                onChange={(e) => setAllergiesSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredAllergies.map((allergy: any, index: number) => (
              <div key={index} className="rounded-lg border bg-red-50 p-3">
                <div className="text-sm">
                  <div className="font-medium text-red-900">
                    {allergy.code?.text || allergy.code?.coding?.[0]?.display}
                  </div>
                  <div className="mt-1 text-red-700">
                    Type: {allergy.type} | Category: {allergy.category?.[0]}
                  </div>
                  {allergy.criticality && (
                    <div className="mt-1 text-xs text-red-600">
                      Criticality:{" "}
                      <span className="capitalize">{allergy.criticality}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Procedures */}
      {procedures && procedures.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
              <Calendar className="h-5 w-5" />
              Procedures ({procedures.length})
              {proceduresSearch && ` (${filteredProcedures.length} filtered)`}
            </h3>
            <div className="relative w-64">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search procedures..."
                value={proceduresSearch}
                onChange={(e) => setProceduresSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <div className="max-h-64 space-y-2 overflow-y-auto">
            {filteredProcedures.map((procedure: any, index: number) => (
              <div key={index} className="rounded-lg border bg-gray-50 p-3">
                <div className="text-sm">
                  <div className="font-medium">
                    {procedure.code?.text ||
                      procedure.code?.coding?.[0]?.display}
                  </div>
                  <div className="mt-1 text-gray-600">
                    Status:{" "}
                    <span className="capitalize">{procedure.status}</span>
                  </div>
                  {procedure.performedDateTime && (
                    <div className="mt-1 text-xs text-gray-500">
                      Performed:{" "}
                      {new Date(
                        procedure.performedDateTime,
                      ).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Raw Data Toggle */}
      <details className="mt-6">
        <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
          View Raw FHIR Data (JSON)
        </summary>
        <pre className="mt-3 overflow-auto rounded-lg bg-gray-100 p-4 text-xs">
          {JSON.stringify(fhirData, null, 2)}
        </pre>
      </details>
    </div>
  );
}
