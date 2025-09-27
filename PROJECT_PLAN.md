# RightTimeMD - HCP Engagement App

## Hackathon Project Plan

### 🎯 **Project Overview**

A multi-sided platform that connects healthcare providers, patients, and insurance companies through FHIR data integration. The goal is to coordinate care between providers and patients while reducing administrative friction (especially insurance documentation) that currently consumes significant clinic resources.

### 🎭 **Key Stakeholders**

- **Doctors**: View/manage patient FHIR data, coordinate care
- **Patients**: View their clinics, medications, health info, appointments, notifications
- **Clinics**: Manage doctors, handle insurance workflows, reduce paperwork
- **Insurance Companies**: Access patient data for claims, streamline approvals

### 🏗️ **Architecture**

- **Frontend**: Next.js
- **Backend**: Node.js
- **Database**: Supabase PostgreSQL
- **Auth**: Supabase Auth

---

## Planning Session Notes

### **Core Problem Identified**

Multi-sided healthcare coordination platform addressing:

- Care coordination between providers and patients
- Administrative burden reduction (insurance documentation)
- Fragmented patient data across systems
- Friction between clinics and insurance companies

### **Target Users**

1. **Primary**: Doctors and Patients (direct care relationship)
2. **Secondary**: Clinics (management layer)
3. **Tertiary**: Insurance companies (claims/approvals)

---

## MVP Scope Definition

### **Feature Priority (Hackathon Focus)**

1. **🎯 PRIMARY: FHIR Data Visualization** (High impact, shows technical depth)
2. **🔔 SECONDARY: Real-time Notifications** (Great demo factor, user engagement)
3. **🏥 NICE-TO-HAVE: Multi-clinic coordination** (If time permits)
4. **💰 FUTURE: Insurance integration** (Post-hackathon)

### **Demo Strategy Focus**

- Lead with FHIR visualization capabilities
- Showcase real-time coordination between doctor and patient
- Prove technical competency with healthcare data standards

---

## Core Features Defined

### **🎯 Primary FHIR Visualizations**

1. **Patient Health Timeline**: Interactive timeline showing medical history, visits, treatments
2. **Clinical Dashboard**: Multi-patient overview for doctors with key indicators
3. **Health Trends & Graphs**: Visual charts for vitals, lab values, medication adherence

### **💊 Care Management Features**

- **Treatment Assignment**: Doctors can assign medications/treatments to patients
- **Treatment Tracking**: Patients can update progress and adherence
- **Real-time Updates**: Both sides see changes immediately

### **💬 Communication Features**

- **Real-time Chat**: Doctor-patient messaging
- **Video Calling**: Direct telemedicine integration
- **Notifications**: Updates on treatment progress, appointment reminders

### **🏥 Platform Approach**

- **Provider Agnostic**: Any clinic can create account and start admitting patients
- **Multi-tenant Architecture**: Each clinic operates independently
- **FHIR Standards**: Ensure interoperability across different health systems

---

## Demo Strategy: Administrative Efficiency Focus

### **🎯 Key Message**: "This eliminates so much administrative overhead for doctors"

### **📋 Feature Priority (From Plan.md)**

1. **FHIR Data Visualization** (Show complex data simply)
2. **FHIR CRUD + Update Notifications** (Reduce manual updates, automate alerts)
3. **Appointment Management** (Streamline scheduling workflows)
4. **AI-Powered Doctor-Patient Chat** (Reduce routine inquiries)

### **🏥 Administrative Pain Points to Address**

- Time spent switching between multiple systems to view patient data
- Manual documentation and data entry
- Coordinating care updates between doctor and patient
- Managing appointment scheduling and follow-ups
- Responding to routine patient questions

---

## Doctor Interface Design

### **🏥 Doctor Dashboard Views**

#### **1. Main Dashboard (Landing Page)**

- **Upcoming Appointments**: Today's scheduled patients with key info
- **Action Items**: Medication refills, lab follow-ups, pending tasks
- **Quick Notes**: Reminders and priority alerts
- **Overview Metrics**: Patient census, urgent cases, etc.

#### **2. Patient Management Dashboard**

- **Patient List**: All current patients with search/filter capabilities
- **Sort Options**: Priority level, name, condition type, last visit, treatment status
- **Quick Actions**: Message patient, schedule appointment, view records
- **Status Indicators**: Urgent care needed, overdue follow-ups, medication adherence

#### **3. Patient Detail Page (FHIR Focus)**

- **Main View**: Interactive FHIR data timeline (visits, labs, medications, conditions)
- **Medical History**: Comprehensive health record visualization
- **Current Status**: Active conditions, ongoing treatments, recent observations
- **AI Research Sidebar**: Query assistant to scan FHIR data and suggest:
  - Relevant clinical studies
  - Treatment protocols
  - Drug interactions
  - Condition-specific research
  - Care guidelines

#### **4. Clinic Management Page**

- **Clinic Information**: Settings, provider roster, operational data
- **Analytics**: Patient flow, treatment outcomes, efficiency metrics

---

## Patient Interface Design

### **👤 Patient Dashboard Views**

#### **1. Patient Dashboard (Landing Page)**

- **Health Overview**: Summary of current health status and key metrics
- **Upcoming Appointments**: Scheduled visits with doctors/clinics
- **Recent Updates**: New lab results, medication changes, doctor notes
- **Quick Actions**: Message doctor, request appointment, update symptoms

#### **2. Medical History Page**

- **FHIR Data Timeline**: Patient-friendly visualization of their health journey
- **Past Visits**: Encounter history with visit summaries
- **Lab Results**: Test results over time with trend visualization
- **Condition Tracking**: Current and past diagnoses, treatment progress

#### **3. Medications & Treatments**

- **Current Medications**: Active prescriptions with dosage and instructions
- **Medication History**: Past prescriptions and changes
- **Treatment Plans**: Ongoing care plans and progress tracking
- **Adherence Tracking**: Medication compliance and reminders

#### **4. Care Team & Communication**

- **My Doctors**: List of healthcare providers and clinics
- **Appointment Management**: Schedule, reschedule, or request appointments
- **Direct Messaging**: Chat with care team (if time permits in hackathon)
- **Contact Information**: Clinic details and emergency contacts

#### **5. Data Query (Limited AI)**

- **Simple Data Search**: "When was my last blood test?" or "Show my blood pressure trends"
- **NO Medical Advice**: Strictly data retrieval, no clinical recommendations
- **Plain Language**: Convert FHIR data into understandable summaries

---

## Development Phase

_Demo planning on hold - focusing on building the application_

---

## Database Schema Design

### **🏗️ Core Tables Structure**

#### **1. User Management & Authentication**

```sql
-- Supabase auth.users table (built-in)
-- id, email, phone, created_at, etc.

-- Extended user profiles
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    license_number TEXT, -- for healthcare providers
    specialization TEXT, -- doctor specialty
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

#### **2. Clinic Management**

```sql
-- Clinics/Organizations
CREATE TABLE clinics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    address JSONB, -- structured address data
    phone TEXT,
    email TEXT,
    license_number TEXT,
    npi_number TEXT, -- National Provider Identifier
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);
```

#### **3. User-Clinic Relationships & Roles**

```sql
-- User roles within clinics
CREATE TYPE clinic_role AS ENUM ('owner', 'admin', 'doctor', 'nurse', 'staff', 'patient');

CREATE TABLE clinic_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    role clinic_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

    UNIQUE(user_id, clinic_id, role) -- Users can have multiple roles per clinic
);
```

#### **4. FHIR Resource Storage**

```sql
-- Main FHIR resources table
CREATE TABLE fhir_resources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type TEXT NOT NULL, -- Patient, Practitioner, Observation, etc.
    resource_id TEXT NOT NULL, -- FHIR resource ID
    version_id INTEGER NOT NULL DEFAULT 1,
    resource JSONB NOT NULL, -- The actual FHIR resource
    clinic_id UUID REFERENCES clinics(id), -- Multi-tenancy
    created_by UUID REFERENCES auth.users(id),
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_deleted BOOLEAN DEFAULT FALSE,

    UNIQUE(resource_type, resource_id, clinic_id, version_id)
);
```

---

#### **5. Patient-Provider Assignments**

```sql
-- Only assigned doctors can see patient data
CREATE TABLE patient_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID REFERENCES auth.users(id), -- Patient's user account
    provider_user_id UUID REFERENCES auth.users(id), -- Doctor/Nurse assigned
    clinic_id UUID REFERENCES clinics(id),
    assignment_type TEXT DEFAULT 'primary', -- primary, specialist, consulting
    is_active BOOLEAN DEFAULT TRUE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by UUID REFERENCES auth.users(id), -- Who made the assignment

    UNIQUE(patient_user_id, provider_user_id, clinic_id)
);
```

#### **6. Invitation System**

```sql
-- Clinic invitation links
CREATE TABLE clinic_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID REFERENCES clinics(id),
    invite_code TEXT UNIQUE NOT NULL, -- URL-safe random string
    invited_email TEXT,
    invited_phone TEXT,
    role clinic_role NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE,
    used_by UUID REFERENCES auth.users(id),
    is_active BOOLEAN DEFAULT TRUE,

    CHECK (invited_email IS NOT NULL OR invited_phone IS NOT NULL)
);
```

#### **7. Consent Management (HIPAA)**

```sql
-- Patient consent for data sharing
CREATE TABLE patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID REFERENCES auth.users(id),
    clinic_id UUID REFERENCES clinics(id),
    provider_user_id UUID REFERENCES auth.users(id), -- Specific provider consent
    consent_type TEXT NOT NULL, -- 'data_access', 'treatment', 'sharing'
    consent_given BOOLEAN NOT NULL,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Some consents may expire
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,

    -- Ensure only one active consent per type
    UNIQUE(patient_user_id, clinic_id, provider_user_id, consent_type)
);
```

#### **8. Enhanced Audit Trail (HIPAA Compliance)**

```sql
-- Comprehensive audit logging
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    patient_user_id UUID REFERENCES auth.users(id), -- Which patient's data was accessed
    resource_type TEXT,
    resource_id TEXT,
    action TEXT NOT NULL, -- CREATE, READ, UPDATE, DELETE, LOGIN, EXPORT
    clinic_id UUID REFERENCES clinics(id),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    additional_data JSONB, -- Any extra context
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance and compliance queries
CREATE INDEX idx_audit_patient_access ON audit_logs(patient_user_id, timestamp);
CREATE INDEX idx_audit_user_activity ON audit_logs(user_id, timestamp);
```

#### **9. Row Level Security Policies (HIPAA-Compliant)**

```sql
-- Enable RLS on all sensitive tables
ALTER TABLE fhir_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_memberships ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Doctors can only see FHIR data for patients assigned to them
CREATE POLICY "provider_assigned_patient_access" ON fhir_resources
    FOR ALL USING (
        -- Must be an assigned provider with active consent
        EXISTS (
            SELECT 1 FROM patient_assignments pa
            JOIN patient_consents pc ON (
                pc.patient_user_id = pa.patient_user_id
                AND pc.provider_user_id = pa.provider_user_id
                AND pc.consent_given = true
                AND (pc.expires_at IS NULL OR pc.expires_at > NOW())
                AND pc.withdrawn_at IS NULL
            )
            WHERE pa.provider_user_id = auth.uid()
            AND pa.is_active = true
            AND pa.clinic_id = fhir_resources.clinic_id
            -- Link FHIR resource to patient user via Patient resource
            AND (
                fhir_resources.resource_type != 'Patient'
                OR fhir_resources.resource->>'id' IN (
                    SELECT resource_id FROM some_patient_mapping_logic
                )
            )
        )
    );

-- Patients can see their own FHIR data
CREATE POLICY "patient_own_data_access" ON fhir_resources
    FOR SELECT USING (
        -- Complex logic to map FHIR Patient resource to auth.users
        -- This needs careful implementation based on your patient ID strategy
        auth.uid() IN (
            SELECT user_id FROM patient_user_mapping
            WHERE fhir_patient_id = fhir_resources.resource_id
        )
    );

-- Clinic owners/admins can manage clinic data but NOT patient FHIR data
CREATE POLICY "clinic_admin_management" ON clinic_memberships
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM clinic_memberships
            WHERE user_id = auth.uid()
            AND role IN ('owner', 'admin')
            AND is_active = true
        )
    );
```

---

## Key Security Features

### **🔐 HIPAA-Compliant Access Control**

- **Zero Trust**: Clinics cannot access patient FHIR data directly
- **Assignment-Based**: Doctors only see patients explicitly assigned to them
- **Consent-Required**: All data access requires active patient consent
- **Audit Everything**: Comprehensive logging of all patient data access
- **Time-Limited**: Consents can have expiration dates
- **Revocable**: Patients can withdraw consent at any time

### **🎫 Invitation-Based Onboarding**

- **Secure Links**: Time-limited, single-use invitation codes
- **Role-Specific**: Different invitation types for doctors vs patients
- **Email/SMS**: Flexible invitation delivery methods
- **Self-Service**: Patients create own accounts and join via invites

### **🔄 Multi-Tenancy**

- **Clinic Isolation**: Complete data separation between clinics
- **Cross-Clinic Patients**: Patients can belong to multiple clinics with separate consents
- **Provider Networks**: Doctors can work at multiple clinics

---

## Patient Identity Mapping Solution

### **🎯 Chosen Approach: Separate Mapping Table (Option B)**

```sql
-- Clean, efficient mapping between Supabase users and FHIR Patient resources
CREATE TABLE patient_user_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    fhir_patient_id TEXT NOT NULL, -- FHIR Patient resource ID
    clinic_id UUID REFERENCES clinics(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,

    UNIQUE(user_id, clinic_id), -- One Patient resource per user per clinic
    UNIQUE(fhir_patient_id, clinic_id) -- Each FHIR Patient belongs to one user
);

-- Performance indexes for common queries
CREATE INDEX idx_patient_mapping_user ON patient_user_mapping(user_id, is_active);
CREATE INDEX idx_patient_mapping_fhir ON patient_user_mapping(fhir_patient_id, clinic_id);
```

### **🚀 Efficient Doctor Query Pattern**

```sql
-- Get ALL FHIR data for an assigned patient (with consent)
WITH patient_clinics AS (
    -- Get all clinics where this patient has data
    SELECT DISTINCT pum.clinic_id, pum.fhir_patient_id
    FROM patient_user_mapping pum
    WHERE pum.user_id = $patient_user_id
    AND pum.is_active = true
)
SELECT fr.*
FROM fhir_resources fr
JOIN patient_clinics pc ON fr.clinic_id = pc.clinic_id
JOIN patient_assignments pa ON (
    pa.patient_user_id = $patient_user_id
    AND pa.provider_user_id = $doctor_user_id
    AND pa.clinic_id = fr.clinic_id
    AND pa.is_active = true
)
JOIN patient_consents cons ON (
    cons.patient_user_id = $patient_user_id
    AND cons.provider_user_id = $doctor_user_id
    AND cons.clinic_id = fr.clinic_id
    AND cons.consent_given = true
    AND (cons.expires_at IS NULL OR cons.expires_at > NOW())
    AND cons.withdrawn_at IS NULL
)
WHERE (
    -- Patient's own resources
    fr.resource_type = 'Patient' AND fr.resource_id = pc.fhir_patient_id
    OR
    -- All other resources linked to this patient
    fr.resource->>'subject' = ('Patient/' || pc.fhir_patient_id)
    OR
    fr.resource->'subject'->>'reference' = ('Patient/' || pc.fhir_patient_id)
)
AND fr.is_deleted = false
ORDER BY fr.last_updated DESC;
```

### **🔒 Updated RLS Policy**

```sql
-- Simplified and efficient RLS policy
CREATE POLICY "provider_assigned_patient_access" ON fhir_resources
    FOR ALL USING (
        EXISTS (
            SELECT 1
            FROM patient_user_mapping pum
            JOIN patient_assignments pa ON (
                pa.patient_user_id = pum.user_id
                AND pa.clinic_id = pum.clinic_id
                AND pa.provider_user_id = auth.uid()
                AND pa.is_active = true
            )
            JOIN patient_consents pc ON (
                pc.patient_user_id = pum.user_id
                AND pc.provider_user_id = auth.uid()
                AND pc.clinic_id = pum.clinic_id
                AND pc.consent_given = true
                AND (pc.expires_at IS NULL OR pc.expires_at > NOW())
                AND pc.withdrawn_at IS NULL
            )
            WHERE pum.clinic_id = fhir_resources.clinic_id
            AND pum.is_active = true
            AND (
                -- Patient resource itself
                (fhir_resources.resource_type = 'Patient' AND fhir_resources.resource_id = pum.fhir_patient_id)
                OR
                -- Resources that reference this patient
                fhir_resources.resource->>'subject' = ('Patient/' || pum.fhir_patient_id)
                OR
                fhir_resources.resource->'subject'->>'reference' = ('Patient/' || pum.fhir_patient_id)
            )
        )
    );
```

---

## Next: Implementation Setup
