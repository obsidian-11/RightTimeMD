import { useState } from "react";
import { useSearchParams, useNavigate } from "react-router";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks";
import type { StaffType, StaffPermissions, UserRole } from "@/types";

interface StaffOnboardingData {
  firstname: string;
  lastname: string;
  phone_primary: string;
  phone_secondary: string;
  street: string;
  suite: string;
  city: string;
  state: string;
  zip: string;
}

// Default permissions for UserRole types (admin/clinical)
const USER_ROLE_PERMISSIONS: Record<string, StaffPermissions> = {
  admin: {
    canReadAllPatients: true,
    canWritePrescriptions: false,
    canScheduleAppointments: true,
    canAccessBilling: true,
    canManageStaff: true,
    canViewAuditLogs: true,
    canCreatePatients: true,
    canUpdatePatients: true,
    canDeletePatients: true,
    canAccessFHIR: true,
    canManageConsent: true,
  },
  clinical: {
    canReadAllPatients: true,
    canWritePrescriptions: true,
    canScheduleAppointments: true,
    canAccessBilling: false,
    canManageStaff: false,
    canViewAuditLogs: false,
    canCreatePatients: true,
    canUpdatePatients: true,
    canDeletePatients: false,
    canAccessFHIR: true,
    canManageConsent: true,
  },
};

// Map UserRole to default StaffType for database storage
const USER_ROLE_TO_STAFF_TYPE: Record<string, UserRole> = {
  admin: "admin", // Admin users typically handle administrative tasks
  clinical: "clinical", // Clinical users default to nurse permissions
};

export function StaffOnboarding() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const clinicId = searchParams.get("clinic");
  const token = searchParams.get("token");
  const userRole = searchParams.get("role"); // This is "admin" or "clinical"
  const role = userRole ? USER_ROLE_TO_STAFF_TYPE[userRole] : "clinical"; // Map to StaffType

  const [formData, setFormData] = useState<StaffOnboardingData>({
    firstname: "",
    lastname: "",
    phone_primary: "",
    phone_secondary: "",
    street: "",
    suite: "",
    city: "",
    state: "",
    zip: "",
  });

  const completeOnboardingMutation = useMutation({
    mutationFn: async (data: StaffOnboardingData) => {
      if (!user || !clinicId || !role || !userRole)
        throw new Error("Missing required data");

      // Permissions removed - not used in database schema

      // Create staff record
      const { error: staffError } = await supabase.from("staff").insert({
        id: user.id, // Use user's auth ID as staff ID
        clinic_id: clinicId,
        type: role,
        ...data,
        zip: parseInt(data.zip) || 0,
        ssn_encrypted: "", // Will be added later in secure flow
        email: user.email || "",
        icon_url: "",
      });

      if (staffError) throw staffError;
    },
    onSuccess: () => {
      toast.success("Staff onboarding completed successfully!");
      navigate(`/dashboard/clinical/${clinicId}`);
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
    field: keyof StaffOnboardingData,
    value: string,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (!clinicId || !token || !role) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold text-red-600">
                Invalid Onboarding Link
              </h2>
              <p className="mb-4 text-gray-600">
                Missing clinic, token, or role information.
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

  const getStaffTypeLabel = (type: StaffType | string) => {
    if (userRole === "admin") return "Administrator";
    if (userRole === "clinical") return "Clinical Staff";
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle className="text-center">
              Complete Your Staff Profile
            </CardTitle>
            <p className="text-center text-gray-600">
              Role:{" "}
              <span className="font-semibold">{getStaffTypeLabel(role)}</span>
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

              {/* Permissions Summary */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Role Permissions</h3>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-2 text-sm text-gray-600">
                    As a {getStaffTypeLabel(userRole || role)}, you will have
                    the following permissions:
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(
                      (userRole && USER_ROLE_PERMISSIONS[userRole]) || {},
                    ).map(([permission, enabled]) => (
                      <div
                        key={permission}
                        className={`flex items-center gap-2 ${enabled ? "text-green-600" : "text-gray-400"}`}
                      >
                        <span>{enabled ? "✓" : "×"}</span>
                        <span>
                          {permission
                            .replace(/([A-Z])/g, " $1")
                            .replace(/^./, (str) => str.toUpperCase())}
                        </span>
                      </div>
                    ))}
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
