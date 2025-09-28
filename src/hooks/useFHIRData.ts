import { useState } from "react";
import { storage, supabase } from "../lib/supabase";
import type { FHIR, FHIRResourceType } from "../types";

interface FHIRResource {
  resourceType: FHIRResourceType;
  id: string;
  [key: string]: any;
}

interface FHIRBundle {
  resourceType: "Bundle";
  type: string;
  entry: Array<{
    fullUrl: string;
    resource: FHIRResource;
  }>;
}

interface ProcessedFHIRData {
  patient: FHIRResource | null;
  encounters: FHIRResource[];
  conditions: FHIRResource[];
  observations: FHIRResource[];
  medications: FHIRResource[];
  [key: string]: FHIRResource[] | FHIRResource | null;
}

export function useFHIRData() {
  const [data, setData] = useState<ProcessedFHIRData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const processFHIRBundle = (bundle: FHIRBundle): ProcessedFHIRData => {
    const processed: ProcessedFHIRData = {
      patient: null,
      encounters: [],
      conditions: [],
      observations: [],
      medications: [],
    };

    if (!bundle.entry) return processed;

    bundle.entry.forEach((entry) => {
      const resource = entry.resource;

      switch (resource.resourceType) {
        case "Patient":
          processed.patient = resource;
          break;
        case "Encounter":
          processed.encounters.push(resource);
          break;
        case "Condition":
          processed.conditions.push(resource);
          break;
        case "Observation":
          processed.observations.push(resource);
          break;
        case "MedicationRequest":
        case "MedicationStatement":
          processed.medications.push(resource);
          break;
        default:
          // Group other resource types
          const resourceType = resource.resourceType.toLowerCase();
          if (!processed[resourceType]) {
            processed[resourceType] = [];
          }
          (processed[resourceType] as FHIRResource[]).push(resource);
      }
    });

    return processed;
  };

  const loadPatientFHIRData = async (filePath: string) => {
    try {
      setLoading(true);
      setError(null);

      // Load the FHIR bundle from storage
      const bundle = await storage.loadJson<FHIRBundle>("FHIR", filePath);

      if (!bundle) {
        throw new Error("Failed to load FHIR bundle");
      }

      // Process the bundle
      const processedData = processFHIRBundle(bundle);
      setData(processedData);

      return processedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error loading FHIR data:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const loadPatientFHIRDataById = async (
    patientId: string,
  ): Promise<ProcessedFHIRData | null> => {
    try {
      setLoading(true);
      setError(null);

      // Query the fhir table for all records with this patient_id
      const { data: fhirRecords, error: queryError } = await supabase
        .from("fhir")
        .select("*")
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false });

      if (queryError) {
        throw new Error(`Database query failed: ${queryError.message}`);
      }

      if (!fhirRecords || fhirRecords.length === 0) {
        throw new Error("No FHIR data found for this patient");
      }

      // Type the records properly
      const typedFhirRecords = fhirRecords as FHIR[];

      // Initialize processed data structure
      const processedData: ProcessedFHIRData = {
        patient: null,
        encounters: [],
        conditions: [],
        observations: [],
        medications: [],
      };

      // Process each FHIR record
      for (const record of typedFhirRecords) {
        try {
          let resourcesToProcess: FHIRResource[] = [];

          // Check if this is a bundle reference (has file_path) or individual resource
          if (record.resource_type === "Bundle") {
            // This is bundle metadata - extract file_path and load the bundle

            let metadata;
            if (typeof record.resource_json === "string") {
              try {
                metadata = JSON.parse(record.resource_json);
              } catch (parseError) {
                console.error(
                  "FHIR: Failed to parse bundle metadata:",
                  parseError,
                );
                continue; // Skip this record and continue with the next one
              }
            } else if (
              typeof record.resource_json === "object" &&
              record.resource_json !== null
            ) {
              metadata = record.resource_json;
            } else {
              console.error(
                "Unexpected resource_json type:",
                typeof record.resource_json,
                record.resource_json,
              );
              continue;
            }
            if (metadata.file_path) {
              // Fix: Remove "FHIR/" prefix from file_path since we're already specifying the bucket
              const cleanPath = metadata.file_path.startsWith("FHIR/")
                ? metadata.file_path.substring(5) // Remove "FHIR/" prefix
                : metadata.file_path;

              try {
                const bundle = await storage.loadJson<FHIRBundle>(
                  "FHIR",
                  cleanPath,
                );
                if (bundle && bundle.entry) {
                  const resources = bundle.entry
                    .map((entry) => entry.resource)
                    .filter((resource) => resource && resource.resourceType);
                  console.log(
                    `FHIR: Successfully loaded bundle with ${resources.length} resources`,
                  );
                  resourcesToProcess = resources;
                } else {
                  console.warn("FHIR: Bundle loaded but has no entries");
                }
              } catch (loadError) {
                console.error("FHIR: Error loading bundle:", loadError);
              }
            } else {
              console.warn("Bundle metadata has no file_path:", metadata);
            }
          } else if (
            record.resource_json &&
            typeof record.resource_json === "object"
          ) {
            // This is an individual FHIR resource
            resourcesToProcess = [record.resource_json as FHIRResource];
          } else if (
            record.resource_json &&
            typeof record.resource_json === "string"
          ) {
            try {
              const parsedResource = JSON.parse(
                record.resource_json,
              ) as FHIRResource;
              resourcesToProcess = [parsedResource];
            } catch (parseError) {
              console.warn(
                "Failed to parse resource_json for record:",
                record.id,
              );
            }
          }

          // Process each resource
          for (const resource of resourcesToProcess) {
            switch (resource.resourceType) {
              case "Patient":
                if (!processedData.patient) {
                  processedData.patient = resource;
                }
                break;
              case "Encounter":
                processedData.encounters.push(resource);
                break;
              case "Condition":
                processedData.conditions.push(resource);
                break;
              case "Observation":
                processedData.observations.push(resource);
                break;
              case "MedicationRequest":
              case "MedicationStatement":
                processedData.medications.push(resource);
                break;
              case "Procedure":
              case "DiagnosticReport":
              case "AllergyIntolerance":
              case "Immunization":
              case "CarePlan":
              case "Goal":
              case "ServiceRequest":
              case "Appointment":
              case "DocumentReference":
              case "Organization":
              case "Practitioner":
              case "PractitionerRole":
              case "Location":
              case "CareTeam":
              case "Claim":
              case "ExplanationOfBenefit":
                // Group other standard FHIR resource types
                const resourceType = resource.resourceType.toLowerCase();
                if (!processedData[resourceType]) {
                  processedData[resourceType] = [];
                }
                (processedData[resourceType] as FHIRResource[]).push(resource);
                break;
              default:
                // Handle any other FHIR resource types
                const otherResourceType = resource.resourceType.toLowerCase();
                if (!processedData[otherResourceType]) {
                  processedData[otherResourceType] = [];
                }
                (processedData[otherResourceType] as FHIRResource[]).push(
                  resource,
                );
                break;
            }
          }
        } catch (recordError) {
          console.warn(
            "Failed to process FHIR record:",
            record.id,
            recordError,
          );
          // Continue processing other records
        }
      }

      // Sort arrays by date for consistency
      processedData.encounters.sort(
        (a, b) =>
          new Date(b.period?.start || "").getTime() -
          new Date(a.period?.start || "").getTime(),
      );
      processedData.conditions.sort(
        (a, b) =>
          new Date(b.recordedDate || b.onsetDateTime || "").getTime() -
          new Date(a.recordedDate || a.onsetDateTime || "").getTime(),
      );
      processedData.observations.sort(
        (a, b) =>
          new Date(b.effectiveDateTime || "").getTime() -
          new Date(a.effectiveDateTime || "").getTime(),
      );
      processedData.medications.sort(
        (a, b) =>
          new Date(b.authoredOn || "").getTime() -
          new Date(a.authoredOn || "").getTime(),
      );

      setData(processedData);
      return processedData;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      console.error("Error loading FHIR data by ID:", err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getVitalSigns = () => {
    if (!data?.observations) return [];

    return data.observations.filter((obs) =>
      obs.category?.some((cat: any) =>
        cat.coding?.some((c: any) => c.code === "vital-signs"),
      ),
    );
  };

  const getActiveConditions = () => {
    if (!data?.conditions) return [];

    return data.conditions.filter((condition) =>
      condition.clinicalStatus?.coding?.some((c: any) => c.code === "active"),
    );
  };

  const getLabResults = () => {
    if (!data?.observations) return [];

    return data.observations.filter((obs) =>
      obs.category?.some((cat: any) =>
        cat.coding?.some((c: any) => c.code === "laboratory"),
      ),
    );
  };

  const getMedications = () => {
    if (!data?.medications) return [];

    return data.medications.filter(
      (med) =>
        med.status === "active" || med.status === "intended" || !med.status,
    );
  };

  const getAllergies = () => {
    if (!data?.allergyintolerance) return [];
    return data.allergyintolerance as FHIRResource[];
  };

  const getProcedures = () => {
    if (!data?.procedure) return [];
    return data.procedure as FHIRResource[];
  };

  return {
    data,
    loading,
    error,
    loadPatientFHIRData,
    loadPatientFHIRDataById,
    getVitalSigns,
    getActiveConditions,
    getLabResults,
    getMedications,
    getAllergies,
    getProcedures,
  };
}
