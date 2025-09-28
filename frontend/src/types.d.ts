export type UserRole =
  | "admin"
  | "clinical_admin"
  | "staff"
  | "support_staff"
  | "patient";

export interface Clinic {
  id: string;
  npi: string;
  medicare_id: string;
  medicade_id: string;
  state_license: string;
  name: string;
  type: ClinicType;
  email: string;
  phone_number: string;
  fax_number: string;
  zip: number;
  state: string;
  city: string;
  street: string;
  suite: string;
  icon_url: string;
  created_at: Date;
  verified: ClinicVerifiedStatus;
}

export type ClinicType =
  | "hospital"
  | "family_practice"
  | "urgent_care"
  | "specialty_clinic"
  | "mental_health"
  | "dental"
  | "optometry"
  | "dermatology"
  | "cardiology"
  | "orthopedic"
  | "other";

export type ClinicVerifiedStatus =
  | "pending"
  | "verified"
  | "rejected"
  | "suspended";

export interface Staff {
  id: string;
  clinic_id: string;
  type: StaffType;
  firstname: string;
  lastname: string;
  ssn_encrypted: string;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  zip: number;
  state: string;
  city: string;
  street: string;
  suite: string;
  icon_url: string;
  permissions: StaffPermissions;
  created_at: Date;
}

export type StaffType =
  | "doctor"
  | "nurse"
  | "nurse_practitioner"
  | "physician_assistant"
  | "medical_assistant"
  | "lab_technician"
  | "pharmacist"
  | "therapist"
  | "receptionist"
  | "other_clinical";

export interface StaffPermissions {
  canReadAllPatients: boolean;
  canWritePrescriptions: boolean;
  canScheduleAppointments: boolean;
  canAccessBilling: boolean;
  canManageStaff: boolean;
  canViewAuditLogs: boolean;
  canCreatePatients: boolean;
  canUpdatePatients: boolean;
  canDeletePatients: boolean;
  canAccessFHIR: boolean;
  canManageConsent: boolean;
}

export interface Patient {
  id: string;
  clinic_id: string;
  mrn: string;
  ssn_encrypted: string;
  firstname: string;
  lastname: string;
  sex: PatientSex;
  date_of_birth: Date;
  phone_primary: string;
  phone_secondary: string;
  email: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  insurance_primary: PatientInsurance | null;
  insurance_secondary: PatientInsurance | null;
  allergies: PatientAllergies[];
  medical_alerts: PatientMedicalAlerts[];
  preferred_language: PatientPreferredLanguage;
  zip: number;
  state: string;
  city: string;
  street: string;
  suite: string;
  icon_url: string;
  created_at: Date;
  updated_at: Date;
}

export type PatientSex = "male" | "female" | "other" | "unknown";

export interface PatientInsurance {
  company_name: string;
  policy_number: string;
  group_number?: string;
  subscriber_name: string;
  subscriber_relationship: "self" | "spouse" | "child" | "parent" | "other";
  effective_date: Date;
  expiration_date?: Date;
  copay_amount?: number;
  deductible_amount?: number;
}

export interface PatientAllergies {
  allergen: string;
  reaction: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  onset_date?: Date;
  notes?: string;
}

export interface PatientMedicalAlerts {
  alert_type:
    | "allergy"
    | "medication"
    | "condition"
    | "emergency"
    | "behavioral"
    | "other";
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  active: boolean;
  created_date: Date;
  notes?: string;
}
export type PatientPreferredLanguage = "english" | "spanish";

export interface PatientConsent {
  id: string;
  patient_id: string;
  clinic_id: string;
  consent_type: PatientConsentType;
  granted: boolean;
  granted_at: Date;
  expires_at: Date;
}

export type PatientConsentType =
  | "general_treatment"
  | "data_sharing"
  | "emergency_contact"
  | "medication_administration"
  | "procedure_specific"
  | "research_participation"
  | "telemedicine"
  | "marketing_communications"
  | "third_party_disclosure";

export interface FHIR {
  id: string;
  patient_id: string;
  clinic_id: string;
  resource_type: FHIRResourceType;
  resource_id: string;
  resource_json: Record<string, any>;
  version: number;
  created_at: Date;
  updated_at: Date;
}

export type FHIRResourceType =
  | "Patient"
  | "Observation"
  | "MedicationRequest"
  | "MedicationStatement"
  | "Condition"
  | "Procedure"
  | "DiagnosticReport"
  | "Encounter"
  | "AllergyIntolerance"
  | "Immunization"
  | "CarePlan"
  | "Goal"
  | "ServiceRequest"
  | "Appointment"
  | "DocumentReference"
  | "Organization"
  | "Practitioner"
  | "PractitionerRole"
  | "Location";

export interface Appointment {
  id: string;
  patient_id: string;
  clinic_id: string;
  type: string;
  start_time: Date;
  end_time: Date;
  status: AppointmentStatus;
  notes?: string;
  created_at: Date;
}

export type AppointmentType =
  | "routine_checkup"
  | "follow_up"
  | "consultation"
  | "procedure"
  | "lab_work"
  | "imaging"
  | "emergency"
  | "telemedicine";

export type AppointmentStatus =
  | "scheduled"
  | "confirmed"
  | "arrived"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "no_show"
  | "rescheduled";

export interface AuditLog {
  id: string;
  user_id: string;
  patient_id: string;
  action: AuditLogAction;
  resource_id: string;
  resource_type: string;
  ip_address: string;
  user_agent: string;
  timestamp: Date;
}

export type AuditLogAction =
  | "create"
  | "read"
  | "update"
  | "delete"
  | "search"
  | "export"
  | "login"
  | "logout"
  | "failed_login"
  | "password_change"
  | "consent_granted"
  | "consent_revoked"
  | "emergency_access"
  | "bulk_operation";

export interface Address {
  street: string;
  suite?: string;
  city: string;
  state: string;
  zip: number;
}

export interface ContactInfo {
  phone_primary: string;
  phone_secondary?: string;
  email: string;
}
