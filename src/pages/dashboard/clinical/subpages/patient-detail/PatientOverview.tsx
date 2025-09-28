import { Calendar, User, Phone, Mail, MapPin } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { Patient } from "@/types";

interface PatientOverviewProps {
  patient: Patient;
}

export function PatientOverview({ patient }: PatientOverviewProps) {
  const calculateAge = (dob: string) => {
    const today = new Date();
    const birthDate = new Date(dob);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Patient Overview</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Date of Birth</p>
              <p className="text-sm text-gray-600">
                {patient.date_of_birth
                  ? formatDate(patient.date_of_birth.toString())
                  : "Not provided"}
                {patient.date_of_birth &&
                  ` (${calculateAge(patient.date_of_birth.toString())} years old)`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Gender</p>
              <p className="text-sm text-gray-600 capitalize">
                {patient.sex || "Not specified"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Primary Phone</p>
              <p className="text-sm text-gray-600">
                {patient.phone_primary || "Not provided"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-gray-400" />
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="text-sm text-gray-600">
                {patient.email || "Not provided"}
              </p>
            </div>
          </div>
        </div>
        <Separator />
        <div className="flex items-start gap-3">
          <MapPin className="mt-0.5 h-4 w-4 text-gray-400" />
          <div>
            <p className="text-sm font-medium">Address</p>
            <p className="text-sm text-gray-600">
              {patient.street}, {patient.suite && `${patient.suite}, `}
              {patient.city}, {patient.state} {patient.zip}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
