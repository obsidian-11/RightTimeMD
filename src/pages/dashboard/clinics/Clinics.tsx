import { useAuth } from "@/hooks";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";
import {
  Building,
  Building2,
  Heart,
  Stethoscope,
  Eye,
  Brain,
  Activity,
  Zap,
  MapPin,
  Phone,
  Mail,
  ArrowRight,
  Users,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import type { ClinicType } from "@/types";

export function Clinics() {
  const { user } = useAuth();

  const { status, data, error } = useQuery({
    queryKey: ["clinics"],
    queryFn: async () => {
      const patientClinics = await supabase
        .from("patient")
        .select(
          `
          *,
          clinic:clinic_id (
            id,
            name,
            type,
            email,
            phone_number,
            street,
            city,
            state,
            zip
          )
        `,
        )
        .eq("id", user?.id);

      const staffClinics = await supabase
        .from("staff")
        .select(
          `
          *,
          clinic:clinic_id (
            id,
            name,
            type,
            email,
            phone_number,
            street,
            city,
            state,
            zip
          )
        `,
        )
        .eq("id", user?.id);

      return {
        patientClinics: patientClinics.data || [],
        staffClinics: staffClinics.data || [],
      };
    },
  });

  const getClinicTypeIcon = (type: ClinicType) => {
    const iconClass = "h-5 w-5";
    switch (type) {
      case "hospital":
        return <Building2 className={iconClass} />;
      case "family_practice":
        return <Stethoscope className={iconClass} />;
      case "urgent_care":
        return <Zap className={iconClass} />;
      case "specialty_clinic":
        return <Building className={iconClass} />;
      case "mental_health":
        return <Brain className={iconClass} />;
      case "dental":
        return <Activity className={iconClass} />;
      case "optometry":
        return <Eye className={iconClass} />;
      case "cardiology":
        return <Heart className={iconClass} />;
      case "dermatology":
      case "orthopedic":
      case "other":
      default:
        return <Building className={iconClass} />;
    }
  };

  const getClinicTypeName = (type: ClinicType) => {
    const typeNames: Record<ClinicType, string> = {
      hospital: "Hospital",
      family_practice: "Family Practice",
      urgent_care: "Urgent Care",
      specialty_clinic: "Specialty Clinic",
      mental_health: "Mental Health",
      dental: "Dental",
      optometry: "Optometry",
      dermatology: "Dermatology",
      cardiology: "Cardiology",
      orthopedic: "Orthopedic",
      other: "Other",
    };
    return typeNames[type] || "Medical Clinic";
  };

  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "doctor":
        return "default";
      case "nurse":
      case "nurse_practitioner":
        return "secondary";
      case "physician_assistant":
        return "outline";
      default:
        return "secondary";
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames: Record<string, string> = {
      doctor: "Doctor",
      nurse: "Nurse",
      nurse_practitioner: "Nurse Practitioner",
      physician_assistant: "Physician Assistant",
      medical_assistant: "Medical Assistant",
      lab_technician: "Lab Technician",
      pharmacist: "Pharmacist",
      therapist: "Therapist",
      receptionist: "Receptionist",
      other_clinical: "Clinical Staff",
    };
    return roleNames[role] || "Staff";
  };

  if (status === "pending") {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-6 py-4">
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="text-center">
              <Skeleton className="mx-auto h-10 w-10 rounded-lg" />
              <Skeleton className="mx-auto mt-2 h-6 w-48" />
              <Skeleton className="mx-auto mt-1 h-4 w-96" />
            </div>

            {/* Cards Skeleton */}
            <div className="flex flex-wrap justify-center gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="overflow-hidden">
                  <CardHeader className="pb-3">
                    <div className="flex items-center space-x-4">
                      <Skeleton className="h-12 w-12 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-[200px]" />
                        <Skeleton className="h-3 w-[150px]" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-3/4" />
                    <Skeleton className="h-10 w-full" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="min-h-screen bg-gray-50/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex min-h-[40vh] items-center justify-center">
            <Card className="w-full max-w-md shadow-lg">
              <CardHeader className="text-center">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
                  <Building className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="mt-4 text-xl text-red-600">
                  Error Loading Clinics
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm text-gray-600">
                  Unable to load your clinic information. Please try refreshing
                  the page.
                </p>
                <details className="mt-4">
                  <summary className="cursor-pointer text-xs text-gray-500 hover:text-gray-700">
                    View error details
                  </summary>
                  <pre className="mt-2 rounded bg-gray-100 p-2 text-left text-xs text-gray-800">
                    {JSON.stringify(error, null, 2)}
                  </pre>
                </details>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  const validPatientClinics =
    data?.patientClinics.filter((record: any) => record.clinic) || [];
  const validStaffClinics =
    data?.staffClinics.filter((record: any) => record.clinic) || [];
  const hasPatientClinics = validPatientClinics.length > 0;
  const hasStaffClinics = validStaffClinics.length > 0;

  return (
    <div className="min-h-screen w-full bg-gray-50/50">
      <div className="container mx-auto px-6 py-4">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="mx-auto mt-4 flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-md">
              <Building2 className="h-10 w-10 text-white" />
            </div>
            <h1 className="mt-3 text-3xl font-bold text-gray-900">
              My Clinics
            </h1>
          </div>

          {!hasPatientClinics && !hasStaffClinics ? (
            <div className="flex justify-center">
              <Card className="w-full max-w-md border-2 border-dashed border-gray-300 bg-white shadow-sm">
                <CardContent className="flex flex-col items-center justify-center py-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100">
                    <Building2 className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">
                    No clinics found
                  </h3>
                  <p className="mt-2 max-w-sm text-center text-sm text-gray-600">
                    You don't have any clinic relationships yet. Contact your
                    healthcare provider to get started.
                  </p>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Patient Clinics */}
              {hasPatientClinics && (
                <section>
                  <div className="mb-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-100">
                        <UserCheck className="h-4 w-4 text-green-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Patient Access
                      </h2>
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-800"
                      >
                        {validPatientClinics.length}{" "}
                        {validPatientClinics.length === 1
                          ? "clinic"
                          : "clinics"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Access your patient portals and medical records
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {validPatientClinics.map((record: any) => (
                      <Card
                        key={record.id}
                        className="group w-full max-w-sm min-w-[300px] border-0 bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 text-green-600">
                                {getClinicTypeIcon(record.clinic.type)}
                              </div>
                              <div>
                                <CardTitle className="text-base leading-6">
                                  {record.clinic.name}
                                </CardTitle>
                                <p className="text-sm text-gray-600">
                                  {getClinicTypeName(record.clinic.type)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant="outline"
                              className="bg-green-50 text-green-700"
                            >
                              Patient
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                {record.clinic.street}, {record.clinic.city},{" "}
                                {record.clinic.state} {record.clinic.zip}
                              </span>
                            </div>
                            {record.clinic.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{record.clinic.phone_number}</span>
                              </div>
                            )}
                            {record.clinic.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {record.clinic.email}
                                </span>
                              </div>
                            )}
                          </div>
                          <Link
                            to={`/dashboard/patient/${record.clinic.id}`}
                            className="block"
                          >
                            <Button
                              className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white shadow-md transition-all duration-200 hover:from-green-700 hover:to-green-800"
                              size="sm"
                            >
                              Access Patient Portal
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}

              {/* Staff Clinics */}
              {hasStaffClinics && (
                <section>
                  <div className="mb-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100">
                        <Users className="h-4 w-4 text-blue-600" />
                      </div>
                      <h2 className="text-xl font-semibold text-gray-900">
                        Staff Access
                      </h2>
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        {validStaffClinics.length}{" "}
                        {validStaffClinics.length === 1 ? "role" : "roles"}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">
                      Access your clinical dashboards and administrative tools
                    </p>
                  </div>
                  <div className="flex flex-wrap justify-center gap-4">
                    {validStaffClinics.map((record: any) => (
                      <Card
                        key={record.id}
                        className="group w-full max-w-sm min-w-[300px] border-0 bg-white shadow-md transition-all duration-200 hover:-translate-y-1 hover:shadow-lg"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                                {getClinicTypeIcon(record.clinic.type)}
                              </div>
                              <div>
                                <CardTitle className="text-base leading-6">
                                  {record.clinic.name}
                                </CardTitle>
                                <p className="text-sm text-gray-600">
                                  {getClinicTypeName(record.clinic.type)}
                                </p>
                              </div>
                            </div>
                            <Badge
                              variant={getRoleBadgeVariant(record.type)}
                              className="bg-blue-50 text-blue-700"
                            >
                              {getRoleDisplayName(record.type)}
                            </Badge>
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="space-y-2 text-sm text-gray-600">
                            <div className="flex items-center gap-2">
                              <MapPin className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">
                                {record.clinic.street}, {record.clinic.city},{" "}
                                {record.clinic.state} {record.clinic.zip}
                              </span>
                            </div>
                            {record.clinic.phone_number && (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 flex-shrink-0" />
                                <span>{record.clinic.phone_number}</span>
                              </div>
                            )}
                            {record.clinic.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 flex-shrink-0" />
                                <span className="truncate">
                                  {record.clinic.email}
                                </span>
                              </div>
                            )}
                          </div>
                          <Link
                            to={`/dashboard/${record.type}/${record.clinic.id}`}
                            className="block"
                          >
                            <Button
                              className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-md transition-all duration-200 hover:from-blue-700 hover:to-blue-800"
                              size="sm"
                            >
                              Access Staff Dashboard
                              <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
                            </Button>
                          </Link>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </section>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
