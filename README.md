# 🏥 RightTimeMD

> Modern healthcare records made simple

A sleek, FHIR-compliant electronic health record system built for today's healthcare providers. Our goal is to create a healthcare platform that's both powerful and pleasant to use.

## 🌟 What's This About?

RightTimeMD is a full-stack healthcare management platform designed to streamline patient records, appointments, and clinical workflows. We focused on creating a beautiful, intuitive interface with real-time updates that healthcare professionals will actually enjoy using.

## ✨ The Cool Stuff

### 🔐 **Smart Authentication**

- Supabase auth with invitation-based onboarding
- Role-based access (admin, clinical staff, patients)
- Profile management with clinic context
- Real-time notifications for invites

### 🏥 **For Healthcare Providers**

- **Clinical Dashboard**: Patient lists, appointments, FHIR data viewer
- **Patient Details**: Complete medical history, vitals, medications
- **FHIR Management**: Add conditions, lab results, allergies, procedures
- **Appointment Scheduling**: Smart calendar with patient search
- **Admin Panel**: Manage staff, patients, audit logs, clinic settings

### 👤 **For Patients**

- Clean patient portal with medical history
- Appointment booking and management
- FHIR data visualization (no more cryptic medical records)
- Secure messaging and notifications

### ⚡ **Technical Features**

- **FHIR R4 Compliant**: Adheres to healthcare data standards
- **Real-time Updates**: Live data synchronization with Supabase
- **Performance Optimized**: Tanstack Query for efficient caching
- **Type-Safe**: Full TypeScript implementation
- **Scalable Architecture**: Well-organized, maintainable codebase

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- pnpm (package manager)
- Supabase account for backend services

### Quick Start

```bash
# Install deps (frontend)
pnpm install

# Fire it up
pnpm dev
```

## 🔧 Tech Stack

**Frontend:**

- React 18 with TypeScript
- Vite for fast development
- Tailwind CSS + shadcn/ui components
- Tanstack Query for state management
- React Router for navigation
- Supabase integration

**Backend:**

- Supabase (PostgreSQL + Authentication + Real-time)
- Row Level Security for data protection
- FHIR R4 compliant data structures
- Supabase Storage for file management

## 🎯 Features Breakdown

### Landing Experience

- Beautiful animated background with floating circles
- Professional healthcare branding
- Responsive design from mobile to desktop
- Modern glassmorphism UI effects

### Authentication Flow

- Email/password signup with strength validation
- Invitation-based clinic onboarding
- Role-specific dashboards (patient/clinical/admin)
- Profile management within clinic context

### Clinical Workflow

- Patient search with pagination and filtering
- Comprehensive patient detail views
- FHIR data management (add/edit medical records)
- Appointment scheduling with real-time availability
- Clinical notes and documentation

### Admin Experience

- Staff and patient management
- Clinic settings and configuration
- Audit logs for compliance
- Analytics and reporting dashboards

### Patient Portal

- Personal health record access
- Appointment booking and history
- Medication tracking
- Secure communication with providers
