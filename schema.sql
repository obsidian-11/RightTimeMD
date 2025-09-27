-- RightTimeMD Database Schema
-- HIPAA-Compliant Multi-Tenant FHIR Platform
-- Compatible with Supabase PostgreSQL

-- =====================================================
-- EXTENSIONS AND SETUP
-- =====================================================

-- Enable UUID extension for generating UUIDs
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- CUSTOM TYPES
-- =====================================================

-- User roles within clinics
CREATE TYPE clinic_role AS ENUM ('owner', 'admin', 'doctor', 'nurse', 'staff', 'patient');

-- Consent types
CREATE TYPE consent_type AS ENUM ('data_access', 'treatment', 'sharing');

-- Appointment status types
CREATE TYPE appointment_status AS ENUM ('scheduled', 'completed', 'cancelled', 'no_show');

-- Audit action types
CREATE TYPE audit_action AS ENUM ('CREATE', 'READ', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT');

-- =====================================================
-- CORE TABLES
-- =====================================================

-- Extended user profiles (Supabase auth.users table is built-in)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    license_number TEXT, -- for healthcare providers
    specialization TEXT, -- doctor specialty
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic validation
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~ '^\+?[\d\s\-\(\)\.]+$'),
    CONSTRAINT non_empty_names CHECK (length(trim(first_name)) > 0 AND length(trim(last_name)) > 0)
);

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
    created_by UUID REFERENCES auth.users(id),
    
    -- Basic validation
    CONSTRAINT non_empty_name CHECK (length(trim(name)) > 0),
    CONSTRAINT valid_email CHECK (email IS NULL OR email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT valid_phone CHECK (phone IS NULL OR phone ~ '^\+?[\d\s\-\(\)\.]+$')
);

-- User roles within clinics (many-to-many with roles)
CREATE TABLE clinic_memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
    role clinic_role NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, clinic_id, role) -- Users can have multiple roles per clinic
);

-- =====================================================
-- FHIR DATA STORAGE
-- =====================================================

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

-- =====================================================
-- PATIENT-PROVIDER RELATIONSHIPS
-- =====================================================

-- Mapping between Supabase users and FHIR Patient resources
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

-- =====================================================
-- CONSENT MANAGEMENT (HIPAA)
-- =====================================================

-- Patient consent for data sharing
CREATE TABLE patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID REFERENCES auth.users(id) NOT NULL,
    clinic_id UUID REFERENCES clinics(id) NOT NULL,
    provider_user_id UUID REFERENCES auth.users(id) NOT NULL, -- Specific provider consent
    consent_type consent_type NOT NULL,
    consent_given BOOLEAN NOT NULL,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE, -- Some consents may expire
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    
    -- Ensure only one active consent per type
    UNIQUE(patient_user_id, clinic_id, provider_user_id, consent_type),
    
    -- Validation constraints
    CONSTRAINT valid_consent_dates CHECK (
        expires_at IS NULL OR expires_at > consent_date
    ),
    CONSTRAINT valid_withdrawal CHECK (
        withdrawn_at IS NULL OR withdrawn_at >= consent_date
    )
);

-- =====================================================
-- INVITATION SYSTEM
-- =====================================================

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

-- =====================================================
-- APPOINTMENTS & SCHEDULING
-- =====================================================

-- Appointments
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_user_id UUID REFERENCES auth.users(id) NOT NULL, -- Patient's user account
    provider_user_id UUID REFERENCES auth.users(id) NOT NULL, -- Doctor/provider
    clinic_id UUID REFERENCES clinics(id) NOT NULL,
    scheduled_for TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_minutes INTEGER DEFAULT 30,
    status appointment_status DEFAULT 'scheduled',
    appointment_type TEXT, -- consultation, follow_up, procedure
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Validation
    CONSTRAINT valid_duration CHECK (duration_minutes > 0 AND duration_minutes <= 480) -- Max 8 hours
    -- Note: No constraint on appointment timing to allow historical data entry and same-day scheduling
);

-- =====================================================
-- AUDIT TRAIL (HIPAA COMPLIANCE)
-- =====================================================

-- Comprehensive audit logging
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    patient_user_id UUID REFERENCES auth.users(id), -- Which patient's data was accessed
    resource_type TEXT,
    resource_id TEXT,
    action audit_action NOT NULL,
    clinic_id UUID REFERENCES clinics(id),
    ip_address INET,
    user_agent TEXT,
    session_id TEXT,
    additional_data JSONB, -- Any extra context
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- PERFORMANCE INDEXES
-- =====================================================

-- FHIR Resources indexes
CREATE INDEX idx_fhir_resource_type ON fhir_resources(resource_type);
CREATE INDEX idx_fhir_resource_content ON fhir_resources USING GIN(resource);
CREATE INDEX idx_fhir_last_updated ON fhir_resources(last_updated);
CREATE INDEX idx_fhir_clinic_type ON fhir_resources(clinic_id, resource_type);

-- Patient mapping indexes
CREATE INDEX idx_patient_mapping_user ON patient_user_mapping(user_id, is_active);
CREATE INDEX idx_patient_mapping_fhir ON patient_user_mapping(fhir_patient_id, clinic_id);

-- Assignment indexes
CREATE INDEX idx_patient_assignments_provider ON patient_assignments(provider_user_id, is_active);
CREATE INDEX idx_patient_assignments_patient ON patient_assignments(patient_user_id, clinic_id);

-- Consent indexes
CREATE INDEX idx_patient_consents_active ON patient_consents(patient_user_id, provider_user_id, consent_given);

-- Audit indexes
CREATE INDEX idx_audit_patient_access ON audit_logs(patient_user_id, timestamp);
CREATE INDEX idx_audit_user_activity ON audit_logs(user_id, timestamp);

-- Appointment indexes
CREATE INDEX idx_appointments_provider_date ON appointments(provider_user_id, scheduled_for);
CREATE INDEX idx_appointments_patient_date ON appointments(patient_user_id, scheduled_for);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all sensitive tables
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinics ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE fhir_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_user_mapping ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- CRITICAL: Doctors can only see FHIR data for patients assigned to them with consent
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
                -- Resources that reference this patient (improved pattern matching)
                fhir_resources.resource->>'subject' = ('Patient/' || pum.fhir_patient_id)
                OR
                fhir_resources.resource->'subject'->>'reference' = ('Patient/' || pum.fhir_patient_id)
                OR
                fhir_resources.resource->>'subject' = pum.fhir_patient_id
                OR
                fhir_resources.resource->'subject'->>'reference' LIKE ('%Patient/' || pum.fhir_patient_id)
            )
        )
    );

-- Patients can see their own FHIR data
CREATE POLICY "patient_own_data_access" ON fhir_resources
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM patient_user_mapping pum
            WHERE pum.user_id = auth.uid()
            AND pum.clinic_id = fhir_resources.clinic_id
            AND pum.is_active = true
            AND (
                (fhir_resources.resource_type = 'Patient' AND fhir_resources.resource_id = pum.fhir_patient_id)
                OR
                fhir_resources.resource->>'subject' = ('Patient/' || pum.fhir_patient_id)
                OR
                fhir_resources.resource->'subject'->>'reference' = ('Patient/' || pum.fhir_patient_id)
                OR
                fhir_resources.resource->>'subject' = pum.fhir_patient_id
                OR
                fhir_resources.resource->'subject'->>'reference' LIKE ('%Patient/' || pum.fhir_patient_id)
            )
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

-- Users can see their own assignments
CREATE POLICY "user_own_assignments" ON patient_assignments
    FOR ALL USING (
        provider_user_id = auth.uid() OR patient_user_id = auth.uid()
    );

-- Users can manage their own consents
CREATE POLICY "user_own_consents" ON patient_consents
    FOR ALL USING (
        patient_user_id = auth.uid() OR provider_user_id = auth.uid()
    );

-- Users can see their own appointments
CREATE POLICY "user_own_appointments" ON appointments
    FOR ALL USING (
        patient_user_id = auth.uid() OR provider_user_id = auth.uid()
    );

-- Users can see their own patient mapping
CREATE POLICY "user_own_patient_mapping" ON patient_user_mapping
    FOR ALL USING (
        user_id = auth.uid()
    );

-- Users can only see their own profiles
CREATE POLICY "user_own_profile" ON user_profiles
    FOR ALL USING (id = auth.uid());

-- Users can see clinics they belong to
CREATE POLICY "clinic_member_access" ON clinics
    FOR SELECT USING (
        id IN (
            SELECT clinic_id FROM clinic_memberships 
            WHERE user_id = auth.uid() AND is_active = true
        )
    );

-- Clinic owners/admins can manage their clinics
CREATE POLICY "clinic_admin_modify" ON clinics
    FOR ALL USING (
        id IN (
            SELECT clinic_id FROM clinic_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND is_active = true
        )
    );

-- Clinic admins can manage invitations
CREATE POLICY "clinic_invitation_management" ON clinic_invitations
    FOR ALL USING (
        clinic_id IN (
            SELECT clinic_id FROM clinic_memberships 
            WHERE user_id = auth.uid() 
            AND role IN ('owner', 'admin')
            AND is_active = true
        )
    );

-- Public access to use invitations (for joining)
CREATE POLICY "invitation_public_use" ON clinic_invitations
    FOR SELECT USING (
        is_active = true 
        AND expires_at > NOW() 
        AND used_at IS NULL
    );

-- Audit logs are read-only for compliance officers and users can see their own
CREATE POLICY "audit_log_access" ON audit_logs
    FOR SELECT USING (
        user_id = auth.uid() OR patient_user_id = auth.uid()
    );

-- =====================================================
-- FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get all FHIR data for a patient (used by providers)
-- Fixed security model - no longer bypasses RLS
CREATE OR REPLACE FUNCTION get_patient_fhir_data(
    p_patient_user_id UUID,
    p_provider_user_id UUID
)
RETURNS TABLE (
    id UUID,
    resource_type TEXT,
    resource_id TEXT,
    resource JSONB,
    last_updated TIMESTAMP WITH TIME ZONE,
    clinic_name TEXT
) 
LANGUAGE sql
SECURITY INVOKER  -- Uses caller's permissions, respects RLS
AS $$
    WITH patient_clinics AS (
        SELECT DISTINCT pum.clinic_id, pum.fhir_patient_id, c.name as clinic_name
        FROM patient_user_mapping pum
        JOIN clinics c ON c.id = pum.clinic_id
        WHERE pum.user_id = p_patient_user_id
        AND pum.is_active = true
    )
    SELECT 
        fr.id,
        fr.resource_type,
        fr.resource_id,
        fr.resource,
        fr.last_updated,
        pc.clinic_name
    FROM fhir_resources fr
    JOIN patient_clinics pc ON fr.clinic_id = pc.clinic_id
    JOIN patient_assignments pa ON (
        pa.patient_user_id = p_patient_user_id
        AND pa.provider_user_id = p_provider_user_id
        AND pa.clinic_id = fr.clinic_id
        AND pa.is_active = true
    )
    JOIN patient_consents cons ON (
        cons.patient_user_id = p_patient_user_id
        AND cons.provider_user_id = p_provider_user_id
        AND cons.clinic_id = fr.clinic_id
        AND cons.consent_given = true
        AND (cons.expires_at IS NULL OR cons.expires_at > NOW())
        AND cons.withdrawn_at IS NULL
    )
    WHERE (
        -- Patient's own resources
        fr.resource_type = 'Patient' AND fr.resource_id = pc.fhir_patient_id
        OR
        -- All other resources linked to this patient (improved matching)
        fr.resource->>'subject' = ('Patient/' || pc.fhir_patient_id)
        OR 
        fr.resource->'subject'->>'reference' = ('Patient/' || pc.fhir_patient_id)
        OR
        fr.resource->>'subject' = pc.fhir_patient_id
        OR
        fr.resource->'subject'->>'reference' LIKE ('%Patient/' || pc.fhir_patient_id)
    )
    AND fr.is_deleted = false
    ORDER BY fr.last_updated DESC;
$$;

-- Helper function to create a secure invitation code
CREATE OR REPLACE FUNCTION generate_invitation_code()
RETURNS TEXT
LANGUAGE sql
AS $$
    SELECT encode(gen_random_bytes(16), 'base64')::text;
$$;

-- Function to automatically handle user profile creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO user_profiles (id, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Unknown'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User')
    );
    RETURN NEW;
END;
$$;

-- Trigger to create user profile when new user signs up
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- COMMENTS AND DOCUMENTATION
-- =====================================================

COMMENT ON TABLE fhir_resources IS 'Stores all FHIR resources with multi-tenant isolation and versioning';
COMMENT ON TABLE patient_user_mapping IS 'Maps Supabase auth users to FHIR Patient resources across clinics';
COMMENT ON TABLE patient_assignments IS 'Defines which providers can access which patients data';
COMMENT ON TABLE patient_consents IS 'HIPAA-compliant consent management for data access';
COMMENT ON TABLE audit_logs IS 'Comprehensive audit trail for HIPAA compliance';
COMMENT ON TABLE clinic_invitations IS 'Secure invitation system for clinic onboarding';

-- Schema creation complete
-- Remember to set up Supabase environment variables:
-- SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_SERVICE_KEY
