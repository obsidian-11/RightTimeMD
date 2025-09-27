# Schema Planning

## clinic (Health care providers)

- id: uuid
- hin: text
- medicare_id: text
- medicade_id: text
- name: text
- type: text
- email: text
- phonenumber: text
- faxnumber: text
- zip: int
- state: text
- city: text
- street: text
- suite: text
- icon_url: text
- created_at: timestamp

## user (from supabase)

- uid: uuid
- display_name: text
- email: text
- phone: text
- providers: idk
- provider_type: idk
- created_at: timestamp
- last_sign_in_at: timestamp

## staff

- uid: FK
- clinic_id: FK
- firstname: text
- lastname: text
- permissions: json
- created_at: timestamp

## patient

- uid: FK
- clinic_id: FK
- mrn: text
- ssn_encrypted: text
- firstname: text
- lastname: text
- sex: text
- date_of_birth: timestamp
- phone_primary: text
- phone_secondary: text
- email: text
- emergency_contact_name: text
- emergency_contact_phone: text
- insurance_primary: json
- insurance_secondary: json
- allergies: text[]
- medical_alerts: text[]
- preferred_language: text
- zip: int
- state: text
- city: text
- street: text
- suite: text
- icon_url: text
- created_at: timestamp
- updated_at: timestamp

## audit_log

- id: uuid
- user_id: FK
- patient_id: FK
- action: text
- resource_type: text
- resource_id: text
- ip_address: inet
- user_agent: text
- timestamp: timestamp

## patient_consent

- id: uuid
- patient_id: FK
- clinic_id: FK
- consent_type: text
- granted: boolean
- granted_at: timestamp
- expires_at: timestamp

## appointment

- id: uuid
- patient_id: FK
- clinic_id: FK
- provider_id: FK
- appointment_type: text
- scheduled_start: timestamp
- scheduled_end: timestamp
- actual_start: timestamp
- actual_end: timestamp
- status: text
- notes: text
- created_at: timestamp

## fhir

- id: uuid (primary key)
- resource_type: text (Patient, Observation, MedicationRequest, etc.)
- resource_id: text (the FHIR logical ID)
- resource_json: jsonb (the complete FHIR resource as JSON)
- patient_id: FK (links to patient table)
- clinic_id: FK (links to clinic table)
- version: int (for resource versioning)
- last_updated: timestamp
- created_at: timestamp
