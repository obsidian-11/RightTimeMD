import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Building,
  Phone,
  MapPin,
  Save,
  Shield,
  Bell,
  CreditCard,
} from "lucide-react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/lib/supabase";
import { useClinic } from "@/hooks";
import type { Clinic, ClinicType } from "@/types";

export function Settings() {
  const { currentClinic } = useClinic();
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<Clinic>>({});

  // Query for clinic details
  const { data: clinicData, isLoading } = useQuery({
    queryKey: ["clinic-settings", currentClinic?.id],
    queryFn: async () => {
      if (!currentClinic?.id) return null;

      const { data, error } = await supabase
        .from("clinic")
        .select("*")
        .eq("id", currentClinic.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!currentClinic?.id,
  });

  // Update form data when clinic data changes
  useEffect(() => {
    if (clinicData) {
      setFormData(clinicData);
    }
  }, [clinicData]);

  // Update clinic mutation
  const updateClinicMutation = useMutation({
    mutationFn: async (data: Partial<Clinic>) => {
      if (!currentClinic?.id) throw new Error("No clinic selected");

      const { error } = await supabase
        .from("clinic")
        .update(data)
        .eq("id", currentClinic.id);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Clinic settings updated successfully");
      queryClient.invalidateQueries({
        queryKey: ["clinic-settings", currentClinic?.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["user-clinics"],
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to update settings: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!formData) return;
    updateClinicMutation.mutate(formData);
  };

  const handleInputChange = (field: keyof Clinic, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  if (!currentClinic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">
          Please select a clinic to manage settings.
        </p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-48" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  // Add debug logging
  console.log("Settings debug:", {
    currentClinic,
    clinicData,
    formData,
    isLoading,
  });

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Clinic Settings</h1>
          <p className="text-sm text-gray-600">
            Configure settings for {currentClinic.name}
          </p>
        </div>
        <Button
          className="gap-2"
          onClick={handleSave}
          disabled={updateClinicMutation.isPending}
        >
          <Save className="h-4 w-4" />
          {updateClinicMutation.isPending ? "Saving..." : "Save Changes"}
        </Button>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="contact">Contact Info</TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Clinic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Clinic Name *</Label>
                  <Input
                    id="name"
                    value={formData.name || ""}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    placeholder="Enter clinic name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Clinic Type *</Label>
                  <Select
                    value={formData.type || ""}
                    onValueChange={(value: ClinicType) =>
                      handleInputChange("type", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select clinic type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hospital">Hospital</SelectItem>
                      <SelectItem value="family_practice">
                        Family Practice
                      </SelectItem>
                      <SelectItem value="urgent_care">Urgent Care</SelectItem>
                      <SelectItem value="specialty_clinic">
                        Specialty Clinic
                      </SelectItem>
                      <SelectItem value="mental_health">
                        Mental Health
                      </SelectItem>
                      <SelectItem value="dental">Dental</SelectItem>
                      <SelectItem value="optometry">Optometry</SelectItem>
                      <SelectItem value="dermatology">Dermatology</SelectItem>
                      <SelectItem value="cardiology">Cardiology</SelectItem>
                      <SelectItem value="orthopedic">Orthopedic</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="npi">NPI Number</Label>
                  <Input
                    id="npi"
                    value={formData.npi || ""}
                    onChange={(e) => handleInputChange("npi", e.target.value)}
                    placeholder="National Provider Identifier"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicare_id">Medicare ID</Label>
                  <Input
                    id="medicare_id"
                    value={formData.medicare_id || ""}
                    onChange={(e) =>
                      handleInputChange("medicare_id", e.target.value)
                    }
                    placeholder="Medicare Provider ID"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="medicade_id">Medicaid ID</Label>
                  <Input
                    id="medicade_id"
                    value={formData.medicade_id || ""}
                    onChange={(e) =>
                      handleInputChange("medicade_id", e.target.value)
                    }
                    placeholder="Medicaid Provider ID"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="state_license">State License Number</Label>
                <Input
                  id="state_license"
                  value={formData.state_license || ""}
                  onChange={(e) =>
                    handleInputChange("state_license", e.target.value)
                  }
                  placeholder="State medical license number"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ""}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    placeholder="clinic@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number *</Label>
                  <Input
                    id="phone_number"
                    value={formData.phone_number || ""}
                    onChange={(e) =>
                      handleInputChange("phone_number", e.target.value)
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="fax_number">Fax Number</Label>
                <Input
                  id="fax_number"
                  value={formData.fax_number || ""}
                  onChange={(e) =>
                    handleInputChange("fax_number", e.target.value)
                  }
                  placeholder="(555) 123-4568"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Address Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="street">Street Address *</Label>
                  <Input
                    id="street"
                    value={formData.street || ""}
                    onChange={(e) =>
                      handleInputChange("street", e.target.value)
                    }
                    placeholder="123 Main Street"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="suite">Suite/Unit</Label>
                  <Input
                    id="suite"
                    value={formData.suite || ""}
                    onChange={(e) => handleInputChange("suite", e.target.value)}
                    placeholder="Suite 100"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city || ""}
                    onChange={(e) => handleInputChange("city", e.target.value)}
                    placeholder="City"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Input
                    id="state"
                    value={formData.state || ""}
                    onChange={(e) => handleInputChange("state", e.target.value)}
                    placeholder="State"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP Code *</Label>
                  <Input
                    id="zip"
                    value={formData.zip?.toString() || ""}
                    onChange={(e) =>
                      handleInputChange("zip", parseInt(e.target.value) || 0)
                    }
                    placeholder="12345"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Billing Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">Coming Soon</span>
                </div>
                <p className="mt-1 text-sm text-yellow-700">
                  Billing configuration features will be available in a future
                  update. This will include payment processing, insurance
                  integration, and invoicing settings.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Security Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
                <div className="flex items-center gap-2 text-yellow-800">
                  <Bell className="h-4 w-4" />
                  <span className="font-medium">Coming Soon</span>
                </div>
                <p className="mt-1 text-sm text-yellow-700">
                  Advanced security settings will be available in a future
                  update. This will include two-factor authentication, access
                  logs, and security policies.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
