import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks";
import type { PatientSex, PatientPreferredLanguage } from "@/types";

interface PatientOnboardingData {
  firstname: string;
  lastname: string;
  date_of_birth: string;
  sex: PatientSex;
  phone_primary: string;
  phone_secondary: string;
  emergency_contact_name: string;
  emergency_contact_phone: string;
  preferred_language: PatientPreferredLanguage;
  street: string;
  suite: string;
  city: string;
  state: string;
  zip: string;
}

export function PatientOnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const clinicId = searchParams.get("clinic");
  const token = searchParams.get("token");

  const [formData, setFormData] = useState<PatientOnboardingData>({
    firstname: "",
    lastname: "",
    date_of_birth: "",
    sex: "unknown",
    phone_primary: "",
    phone_secondary: "",
    emergency_contact_name: "",
    emergency_contact_phone: "",
    preferred_language: "english",
    street: "",
    suite: "",
    city: "",
    state: "",
    zip: "",
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: PatientOnboardingData) => {
      if (!user || !clinicId) throw new Error("Missing required data");

      // Create patient record
      const { error: patientError } = await supabase.from("patient").insert({
        id: user.id, // Use user's auth ID as patient ID
        clinic_id: clinicId,
        ...data,
        zip: parseInt(data.zip) || 0,
        mrn: `P-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, // Generate MRN
        ssn_encrypted: "", // Will be added later in secure flow
        email: user.email || "",
        insurance_primary: null,
        insurance_secondary: null,
        allergies: [],
        medical_alerts: [],
        icon_url: "",
      });

      if (patientError) throw patientError;

      // Create initial FHIR Patient resource
      const fhirPatientResource = {
        resourceType: "Patient",
        id: user.id,
        active: true,
        name: [
          {
            use: "official",
            family: data.lastname,
            given: [data.firstname],
          },
        ],
        telecom: [
          {
            system: "phone",
            value: data.phone_primary,
            use: "home",
          },
          {
            system: "email",
            value: user.email,
            use: "home",
          },
        ],
        gender:
          data.sex === "male"
            ? "male"
            : data.sex === "female"
              ? "female"
              : "unknown",
        birthDate: data.date_of_birth,
        address: [
          {
            use: "home",
            line: [data.street, data.suite].filter(Boolean),
            city: data.city,
            state: data.state,
            postalCode: data.zip,
            country: "US",
          },
        ],
        contact: data.emergency_contact_name
          ? [
              {
                relationship: [
                  {
                    coding: [
                      {
                        system: "http://terminology.hl7.org/CodeSystem/v2-0131",
                        code: "C",
                        display: "Emergency Contact",
                      },
                    ],
                  },
                ],
                name: {
                  text: data.emergency_contact_name,
                },
                telecom: [
                  {
                    system: "phone",
                    value: data.emergency_contact_phone,
                    use: "home",
                  },
                ],
              },
            ]
          : [],
      };

      // Insert FHIR Patient resource
      const { error: fhirError } = await supabase.from("fhir").insert({
        id: crypto.randomUUID(),
        patient_id: user.id,
        clinic_id: clinicId,
        resource_type: "Patient",
        resource_id: user.id,
        resource_json: fhirPatientResource,
        version: 1,
      });

      if (fhirError) {
        console.error("Failed to create FHIR Patient resource:", fhirError);
        // Don't throw error - FHIR creation is not critical for onboarding
      }

      // Create default consents
      const consents = [
        { consent_type: "general_treatment", granted: true },
        { consent_type: "data_sharing", granted: true },
        { consent_type: "emergency_contact", granted: true },
      ];

      const { error: consentError } = await supabase
        .from("patient_consent")
        .insert(
          consents.map((consent) => ({
            patient_id: user.id,
            clinic_id: clinicId,
            ...consent,
            granted_at: new Date().toISOString(),
            expires_at: new Date(
              Date.now() + 365 * 24 * 60 * 60 * 1000,
            ).toISOString(), // 1 year
          })),
        );

      if (consentError) throw consentError;
    },
    onSuccess: () => {
      toast.success("Patient onboarding completed successfully!");
      navigate(`/dashboard/patient/${clinicId}`);
    },
    onError: (error: any) => {
      toast.error(`Onboarding failed: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    completeOnboardingMutation.mutate(formData);
  };

  const handleInputChange = (
    field: keyof PatientOnboardingData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!clinicId || !token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold text-red-600">
                Invalid Onboarding Link
              </h2>
              <p className="mb-4 text-gray-600">
                Missing clinic or token information.
              </p>
              <Button onClick={() => navigate("/auth/login")}>
                Go to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Complete Your Patient Profile
            </CardTitle>
            <p className="text-center text-gray-600">
              Please provide your information to complete registration.
            </p>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Personal Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstname">First Name *</Label>
                    <Input
                      id="firstname"
                      value={formData.firstname}
                      onChange={(e) =>
                        handleInputChange("firstname", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastname">Last Name *</Label>
                    <Input
                      id="lastname"
                      value={formData.lastname}
                      onChange={(e) =>
                        handleInputChange("lastname", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date_of_birth">Date of Birth *</Label>
                    <Input
                      id="date_of_birth"
                      type="date"
                      value={formData.date_of_birth}
                      onChange={(e) =>
                        handleInputChange("date_of_birth", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sex">Sex *</Label>
                    <Select
                      value={formData.sex}
                      onValueChange={(value: PatientSex) =>
                        handleInputChange("sex", value)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                        <SelectItem value="unknown">
                          Prefer not to say
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Contact Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone_primary">Primary Phone *</Label>
                    <Input
                      id="phone_primary"
                      value={formData.phone_primary}
                      onChange={(e) =>
                        handleInputChange("phone_primary", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone_secondary">Secondary Phone</Label>
                    <Input
                      id="phone_secondary"
                      value={formData.phone_secondary}
                      onChange={(e) =>
                        handleInputChange("phone_secondary", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_name">
                      Emergency Contact Name *
                    </Label>
                    <Input
                      id="emergency_contact_name"
                      value={formData.emergency_contact_name}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency_contact_name",
                          e.target.value,
                        )
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="emergency_contact_phone">
                      Emergency Contact Phone *
                    </Label>
                    <Input
                      id="emergency_contact_phone"
                      value={formData.emergency_contact_phone}
                      onChange={(e) =>
                        handleInputChange(
                          "emergency_contact_phone",
                          e.target.value,
                        )
                      }
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="preferred_language">Preferred Language</Label>
                  <Select
                    value={formData.preferred_language}
                    onValueChange={(value: PatientPreferredLanguage) =>
                      handleInputChange("preferred_language", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="english">English</SelectItem>
                      <SelectItem value="spanish">Spanish</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Address Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Address Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="street">Street Address *</Label>
                    <Input
                      id="street"
                      value={formData.street}
                      onChange={(e) =>
                        handleInputChange("street", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="suite">Suite/Unit</Label>
                    <Input
                      id="suite"
                      value={formData.suite}
                      onChange={(e) =>
                        handleInputChange("suite", e.target.value)
                      }
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City *</Label>
                    <Input
                      id="city"
                      value={formData.city}
                      onChange={(e) =>
                        handleInputChange("city", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="state">State *</Label>
                    <Input
                      id="state"
                      value={formData.state}
                      onChange={(e) =>
                        handleInputChange("state", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="zip">ZIP Code *</Label>
                    <Input
                      id="zip"
                      value={formData.zip}
                      onChange={(e) => handleInputChange("zip", e.target.value)}
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/auth/login")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={completeOnboardingMutation.isPending}
                >
                  {completeOnboardingMutation.isPending
                    ? "Completing..."
                    : "Complete Registration"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
