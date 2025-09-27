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

## Database Implementation

### **✅ Schema Status: DEPLOYED**

- **Database**: Supabase PostgreSQL with FHIR-optimized schema
- **Security**: HIPAA-compliant Row Level Security (RLS) policies
- **Multi-tenancy**: Clinic isolation with patient consent management
- **FHIR Storage**: Efficient JSONB storage with proper indexing

### **🔐 Key Security Features**

- **Zero Trust**: Assignment-based access with patient consent
- **Audit Trail**: Comprehensive logging for HIPAA compliance
- **Invitation System**: Secure clinic onboarding workflow
- **Multi-clinic Support**: Patients can belong to multiple clinics

---

---

## Backend/Frontend Integration Setup

### **🔗 Next Phase: Connecting Schema to Application**

- **Backend**: Node.js with Supabase client and FHIR operations
- **Frontend**: Next.js with TypeScript and Supabase auth
- **Integration**: Real-time data sync and secure API endpoints
