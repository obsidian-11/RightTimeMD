# RightTimeMD

## Frontend planning

src/
pages/
auth/
LoginPage.tsx
SignupPage.tsx
ClinicRegistration.tsx
clinical/
ClinicalDashboard.tsx
PatientListPage.tsx
PatientDetailPage.tsx # ⭐ FHIR showcase page
AppointmentsPage.tsx
patient/
PatientDashboard.tsx
MedicalHistoryPage.tsx # ⭐ Patient timeline
MedicationsPage.tsx
admin/
AdminDashboard.tsx
StaffManagementPage.tsx
shared/
ProfilePage.tsx
SettingsPage.tsx
components/
clinical/
FHIRTimeline.tsx # ⭐ Key component
PatientCard.tsx
AppointmentCalendar.tsx
patient/
HealthOverview.tsx
MedicationCard.tsx
shared/
Navigation.tsx
RoleGuard.tsx

### Auth

- /auth
  - /login
  - /signup
  - /clinic-registration # New clinic signup
  - /staff-invitation # Accept staff invite
  - /password-reset

### All Accounts

- /profile # User profile settings -- Modal
- /settings # App preferences, notifications -- Modal
- /help # Support & documentation -- Modal
- /privacy # Privacy policy, terms -- Modal

### Clinical Admin

- /admin
  - /dashboard # Overview metrics, urgent items
  - /staff # Manage staff, invitations, roles
    - /staff/new # Invite new staff member -- Modal
    - /staff/:id # Individual staff details
  - /patients # All clinic patients overview
    - /patients/new # Add new patient -- Modal
    - /patients/:id # Patient detail page
  - /clinic-settings # Clinic info, billing, integrations -- Modal
  - /analytics # Usage stats, patient flow
  - /audit-logs # HIPAA compliance logs

### Clinical Staff

- /clinical
  - /dashboard # Today's appointments, action items
  - /patients # Patient list with search/filters
    - /patients/:id # Patient detail (FHIR timeline)
    - /patients/:id/history # Medical history deep dive
    - /patients/:id/meds # Medications management
    - /patients/:id/notes # Clinical notes
  - /appointments # Schedule management
    - /appointments/new # Create appointment -- Modal
    - /appointments/:id # Appointment details
  - /messages # Patient communication
  - /fhir-query # FHIR data search tool

### Support Staff

- /support
  - /dashboard # Today's schedule, check-ins
  - /appointments # Appointment scheduling
    - /appointments/new # Book appointment -- Modal
    - /appointments/:id/checkin # Patient check-in
  - /patients # Limited patient info for scheduling
  - /messages # Basic patient communication

### Patient

- /patient
  - /dashboard # Health overview, upcoming appointments
  - /medical-history # FHIR timeline, past visits
    - /history/timeline # Interactive health timeline
    - /history/conditions # Condition tracking
    - /history/procedures # Procedure history
  - /medications # Current & past medications
    - /medications/current # Active prescriptions
    - /medications/history # Medication timeline
  - /appointments # Appointment management
    - /appointments/request # Request new appointment -- Modal
    - /appointments/:id # Appointment details
  - /care-team # List of doctors/clinics
  - /messages # Communication with providers
  - /health-data # Lab results, vitals, trends
  - /ai-assistant # Simple data queries
