import { useState } from "react";
import { supabase, storage } from "@/lib/supabase";
import type { Patient, PatientConsent, FHIR } from "@/types";

interface OnboardingProfile {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  phone: string;
  emergencyContact: string;
  emergencyPhone: string;
}

interface OnboardingConsent {
  dataSharing: boolean;
  treatment: boolean;
  emergency: boolean;
  research: boolean;
}

interface OnboardingData {
  profile: OnboardingProfile;
  fileUpload?: File;
  consent: OnboardingConsent;
}

export function useOnboarding() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFHIRFile = async (
    file: File,
    userId: string,
  ): Promise<string | null> => {
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `FHIR/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("fhir-data")
        .upload(filePath, file);

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      return filePath;
    } catch (error) {
      console.error("Error uploading FHIR file:", error);
      throw error;
    }
  };

  const processFHIRBundle = async (
    filePath: string,
    userId: string,
    clinicId: string,
  ) => {
    try {
      // Load the FHIR bundle from storage
      const bundle = await storage.loadJson("fhir-data", filePath);

      if (!bundle || !bundle.entry) {
        throw new Error("Invalid FHIR bundle");
      }

      const fhirRecords: FHIR[] = [];

      // Process each resource in the bundle
      for (const entry of bundle.entry) {
        if (!entry.resource) continue;

        const resource = entry.resource;

        // Generate a unique ID for the resource if it doesn't have one
        const resourceId =
          resource.id ||
          `${resource.resourceType.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        const fhirRecord: FHIR = {
          id: crypto.randomUUID(),
          patient_id: userId,
          clinic_id: clinicId,
          resource_type: resource.resourceType as any,
          resource_id: resourceId,
          resource_json: resource,
          version: 1,
          created_at: new Date(),
          updated_at: new Date(),
        };

        fhirRecords.push(fhirRecord);
      }

      // Batch insert FHIR records
      if (fhirRecords.length > 0) {
        const { error: insertError } = await supabase
          .from("fhir")
          .insert(fhirRecords);

        if (insertError) {
          throw new Error(`Failed to save FHIR data: ${insertError.message}`);
        }
      }

      return {
        totalResources: fhirRecords.length,
        resourceTypes: [...new Set(fhirRecords.map((r) => r.resource_type))],
      };
    } catch (error) {
      console.error("Error processing FHIR bundle:", error);
      throw error;
    }
  };

  const createPatientProfile = async (
    profile: OnboardingProfile,
    clinicId: string,
  ): Promise<Patient> => {
    try {
      // Generate MRN (Medical Record Number)
      const mrn = `MRN${Date.now()}${Math.random().toString(36).substr(2, 5)}`;

      const patientData = {
        clinic_id: clinicId,
        mrn,
        ssn_encrypted: "", // TODO: Encrypt SSN if provided
        firstname: profile.firstName,
        lastname: profile.lastName,
        sex: profile.gender as any,
        date_of_birth: new Date(profile.dateOfBirth),
        phone_primary: profile.phone,
        phone_secondary: profile.emergencyPhone,
        email: "", // TODO: Get from auth user
        emergency_contact_name: profile.emergencyContact,
        emergency_contact_phone: profile.emergencyPhone,
        insurance_primary: null,
        insurance_secondary: null,
        allergies: [],
        medical_alerts: [],
        preferred_language: "english",
        zip: 0, // TODO: Add address fields to profile
        state: "",
        city: "",
        street: "",
        suite: "",
        icon_url: "",
      };

      const { data: patient, error: patientError } = await supabase
        .from("patient")
        .insert(patientData)
        .select()
        .single();

      if (patientError) {
        throw new Error(
          `Failed to create patient profile: ${patientError.message}`,
        );
      }

      return patient as Patient;
    } catch (error) {
      console.error("Error creating patient profile:", error);
      throw error;
    }
  };

  const saveConsentPreferences = async (
    consent: OnboardingConsent,
    patientId: string,
    clinicId: string,
  ): Promise<PatientConsent[]> => {
    try {
      const consentTypes: Array<{
        type: keyof OnboardingConsent;
        consentType: any;
      }> = [
        { type: "treatment", consentType: "general_treatment" },
        { type: "emergency", consentType: "emergency_contact" },
        { type: "dataSharing", consentType: "data_sharing" },
        { type: "research", consentType: "research_participation" },
      ];

      const consentRecords: Omit<PatientConsent, "id">[] = consentTypes
        .filter(({ type }) => consent[type])
        .map(({ consentType }) => ({
          patient_id: patientId,
          clinic_id: clinicId,
          consent_type: consentType,
          granted: true,
          granted_at: new Date(),
          expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
        }));

      if (consentRecords.length > 0) {
        const { data: consents, error: consentError } = await supabase
          .from("patient_consents")
          .insert(consentRecords)
          .select();

        if (consentError) {
          throw new Error(
            `Failed to save consent preferences: ${consentError.message}`,
          );
        }

        return consents as PatientConsent[];
      }

      return [];
    } catch (error) {
      console.error("Error saving consent preferences:", error);
      throw error;
    }
  };

  const completeOnboarding = async (
    data: OnboardingData,
    userId: string,
    clinicId: string,
  ) => {
    setLoading(true);
    setError(null);

    try {
      // 1. Create patient profile for this clinic
      const patient = await createPatientProfile(data.profile, clinicId);

      // 2. Upload and process FHIR file if provided
      let fhirSummary = null;
      if (data.fileUpload) {
        const filePath = await uploadFHIRFile(data.fileUpload, userId);
        if (filePath) {
          fhirSummary = await processFHIRBundle(filePath, patient.id, clinicId);
        }
      }

      // 3. Save consent preferences
      await saveConsentPreferences(data.consent, patient.id, clinicId);

      return {
        patient,
        fhirSummary,
        success: true,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error occurred";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const checkUserHasPatientProfile = async (
    userId: string,
  ): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("patient")
        .select("id")
        .eq("id", userId)
        .single();

      return !!data && !error;
    } catch (error) {
      return false;
    }
  };

  const validateInvitation = async (token: string) => {
    try {
      const { data, error } = await supabase
        .from("clinic_invitations")
        .select("clinic_id, expires_at, max_uses, current_uses")
        .eq("invitation_token", token)
        .single();

      if (error || !data) {
        throw new Error("Invalid invitation token");
      }

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        throw new Error("Invitation has expired");
      }

      // Check if invitation has been used too many times
      if (data.max_uses && data.current_uses >= data.max_uses) {
        throw new Error("Invitation has been used maximum number of times");
      }

      return data.clinic_id;
    } catch (error) {
      console.error("Error validating invitation:", error);
      throw error;
    }
  };

  const markInvitationUsed = async (token: string, userId: string) => {
    try {
      const { error } = await supabase
        .from("clinic_invitations")
        .update({
          used_at: new Date().toISOString(),
          used_by: userId,
        })
        .eq("invitation_token", token);

      // Then increment the usage count
      const { error: rpcError } = await supabase.rpc("increment_uses", {
        invitation_token: token,
      });

      if (error) {
        console.error("Error marking invitation as used:", error);
      }

      if (rpcError) {
        console.error("Error incrementing invitation uses:", rpcError);
      }
    } catch (error) {
      console.error("Error updating invitation:", error);
    }
  };

  return {
    loading,
    error,
    completeOnboarding,
    checkUserHasPatientProfile,
    validateInvitation,
    markInvitationUsed,
  };
}
