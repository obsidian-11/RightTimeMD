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
      <div className="space-y-6 p-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
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
                <Skeleton className="h-8 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex h-96 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <Building className="h-5 w-5" />
              Error Loading Clinics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-600">
              Unable to load your clinic information. Please try refreshing the
              page.
            </p>
            <pre className="mt-4 rounded bg-gray-100 p-2 text-xs text-gray-800">
              {JSON.stringify(error, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    );
  }

  const hasPatientClinics = data?.patientClinics.length > 0;
  const hasStaffClinics = data?.staffClinics.length > 0;
  const totalClinics =
    (data?.patientClinics.length || 0) + (data?.staffClinics.length || 0);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Clinics</h1>
            <p className="text-sm text-gray-600">
              {totalClinics > 0
                ? `Manage your ${totalClinics} clinic ${totalClinics === 1 ? "relationship" : "relationships"}`
                : "You don't have any clinic relationships yet"}
            </p>
          </div>
        </div>
      </div>

      {!hasPatientClinics && !hasStaffClinics ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <Building2 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="mt-4 text-lg font-medium text-gray-900">
              No clinics found
            </h3>
            <p className="mt-2 text-center text-sm text-gray-600">
              You don't have any clinic relationships yet. Contact your
              healthcare provider to get started.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-8">
          {/* Patient Clinics */}
          {hasPatientClinics && (
            <section>
              <div className="mb-4 flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-green-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Patient Access
                </h2>
                <Badge variant="secondary" className="ml-2">
                  {data.patientClinics.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.patientClinics.map((record: any) => (
                  <Card
                    key={record.id}
                    className="group transition-all hover:shadow-md"
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
                          className="w-full bg-green-600 text-white hover:bg-green-700"
                          size="sm"
                        >
                          Access Patient Portal
                          <ArrowRight className="ml-2 h-4 w-4" />
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
              <div className="mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-blue-600" />
                <h2 className="text-xl font-semibold text-gray-900">
                  Staff Access
                </h2>
                <Badge variant="secondary" className="ml-2">
                  {data.staffClinics.length}
                </Badge>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {data.staffClinics.map((record: any) => (
                  <Card
                    key={record.id}
                    className="group transition-all hover:shadow-md"
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
                          className="w-full bg-blue-600 text-white hover:bg-blue-700"
                          size="sm"
                        >
                          Access Staff Dashboard
                          <ArrowRight className="ml-2 h-4 w-4" />
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
  );
}
