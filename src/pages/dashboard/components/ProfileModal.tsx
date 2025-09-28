import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks";
import type { Clinic, Patient, Staff } from "@/types";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  clinic: Clinic;
}

export function ProfileModal({ isOpen, onClose, clinic }: ProfileModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);
  const [editedData, setEditedData] = useState<Partial<Patient & Staff>>({});

  // Query to get user's profile in this clinic
  const { data: profileData, isLoading } = useQuery({
    queryKey: ["clinic-profile", user?.id, clinic.id],
    queryFn: async () => {
      if (!user?.id) return null;

      try {
        // Check if user is a patient in this clinic
        const { data: patientData, error: patientError } = await supabase
          .from("patient")
          .select("*")
          .eq("id", user.id)
          .eq("clinic_id", clinic.id)
          .single();

        if (!patientError && patientData) {
          return { type: "patient" as const, data: patientData };
        }
      } catch (error) {
        // Ignore permission errors for patient table
        console.log("Patient query failed (expected for staff users):", error);
      }

      try {
        // Check if user is staff in this clinic
        const { data: staffData, error: staffError } = await supabase
          .from("staff")
          .select("*")
          .eq("id", user.id)
          .eq("clinic_id", clinic.id)
          .single();

        if (!staffError && staffData) {
          return { type: "staff" as const, data: staffData };
        }
      } catch (error) {
        // Ignore permission errors for staff table
        console.log("Staff query failed (expected for patient users):", error);
      }

      return null;
    },
    enabled: !!user?.id && isOpen,
    retry: false, // Don't retry on permission errors
  });

  // Initialize form data when profile data loads
  useEffect(() => {
    if (profileData?.data) {
      setEditedData(profileData.data);
    }
  }, [profileData]);

  const handleSave = async () => {
    if (!profileData || !user?.id) return;

    setIsSaving(true);
    try {
      const tableName = profileData.type === "patient" ? "patient" : "staff";

      // Only update editable fields
      const updateData: Record<string, any> = {};

      // Common editable fields
      if (editedData.phone_primary !== profileData.data.phone_primary) {
        updateData.phone_primary = editedData.phone_primary;
      }
      if (editedData.phone_secondary !== profileData.data.phone_secondary) {
        updateData.phone_secondary = editedData.phone_secondary;
      }
      if (editedData.email !== profileData.data.email) {
        updateData.email = editedData.email;
      }
      if (editedData.street !== profileData.data.street) {
        updateData.street = editedData.street;
      }
      if (editedData.suite !== profileData.data.suite) {
        updateData.suite = editedData.suite;
      }
      if (editedData.city !== profileData.data.city) {
        updateData.city = editedData.city;
      }
      if (editedData.state !== profileData.data.state) {
        updateData.state = editedData.state;
      }
      if (editedData.zip !== profileData.data.zip) {
        updateData.zip = editedData.zip;
      }

      // Patient-specific editable fields
      if (profileData.type === "patient") {
        if (
          editedData.emergency_contact_name !==
          profileData.data.emergency_contact_name
        ) {
          updateData.emergency_contact_name = editedData.emergency_contact_name;
        }
        if (
          editedData.emergency_contact_phone !==
          profileData.data.emergency_contact_phone
        ) {
          updateData.emergency_contact_phone =
            editedData.emergency_contact_phone;
        }
        if (
          editedData.preferred_language !== profileData.data.preferred_language
        ) {
          updateData.preferred_language = editedData.preferred_language;
        }
      }

      // Only proceed if there are changes
      if (Object.keys(updateData).length === 0) {
        toast.info("No changes to save");
        onClose();
        return;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq("id", user.id)
        .eq("clinic_id", clinic.id);

      if (error) throw error;

      toast.success("Profile updated successfully!");

      // Refresh the profile data
      queryClient.invalidateQueries({
        queryKey: ["clinic-profile", user.id, clinic.id],
      });

      onClose();
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Profile - {clinic.name}</DialogTitle>
          <DialogDescription>
            Update your {profileData?.type || "profile"} information for this
            clinic. Only certain fields can be edited for security reasons.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 py-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        ) : !profileData ? (
          <div className="py-8 text-center">
            <p className="text-gray-500">
              No profile found for this clinic. You may not be registered as a
              patient or staff member here.
            </p>
          </div>
        ) : (
          <div className="space-y-6 py-4">
            {/* Profile Type Badge */}
            <div className="flex items-center gap-2">
              <Badge
                variant={
                  profileData.type === "patient" ? "default" : "secondary"
                }
              >
                {profileData.type === "patient" ? "Patient" : "Staff"}
              </Badge>
              {profileData.type === "staff" && (
                <Badge variant="outline" className="capitalize">
                  {profileData.data.type?.replace(/_/g, " ")}
                </Badge>
              )}
            </div>

            <Tabs defaultValue="contact" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="contact">Contact Info</TabsTrigger>
                <TabsTrigger value="address">Address</TabsTrigger>
                {profileData.type === "patient" && (
                  <TabsTrigger value="emergency">Emergency</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="contact" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Contact Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Read-only fields */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input
                          value={profileData.data.firstname || ""}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">
                          Cannot be changed
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input
                          value={profileData.data.lastname || ""}
                          disabled
                          className="bg-gray-50"
                        />
                        <p className="text-xs text-gray-500">
                          Cannot be changed
                        </p>
                      </div>
                    </div>

                    {/* Editable fields */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <Input
                        id="email"
                        type="email"
                        value={editedData.email || ""}
                        onChange={(e) =>
                          setEditedData((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone_primary">Primary Phone</Label>
                        <Input
                          id="phone_primary"
                          value={editedData.phone_primary || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              phone_primary: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone_secondary">Secondary Phone</Label>
                        <Input
                          id="phone_secondary"
                          value={editedData.phone_secondary || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              phone_secondary: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="address" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Address Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2 space-y-2">
                        <Label htmlFor="street">Street Address</Label>
                        <Input
                          id="street"
                          value={editedData.street || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              street: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="suite">Suite/Apt</Label>
                        <Input
                          id="suite"
                          value={editedData.suite || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              suite: e.target.value,
                            }))
                          }
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city">City</Label>
                        <Input
                          id="city"
                          value={editedData.city || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              city: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="state">State</Label>
                        <Input
                          id="state"
                          value={editedData.state || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              state: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip">ZIP Code</Label>
                        <Input
                          id="zip"
                          type="number"
                          value={editedData.zip || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              zip: Number(e.target.value),
                            }))
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {profileData.type === "patient" && (
                <TabsContent value="emergency" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        Emergency Contact
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_name">
                          Emergency Contact Name
                        </Label>
                        <Input
                          id="emergency_contact_name"
                          value={editedData.emergency_contact_name || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              emergency_contact_name: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="emergency_contact_phone">
                          Emergency Contact Phone
                        </Label>
                        <Input
                          id="emergency_contact_phone"
                          value={editedData.emergency_contact_phone || ""}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              emergency_contact_phone: e.target.value,
                            }))
                          }
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="preferred_language">
                          Preferred Language
                        </Label>
                        <select
                          id="preferred_language"
                          className="border-input placeholder:text-muted-foreground focus-visible:ring-ring flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-1 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
                          value={editedData.preferred_language || "english"}
                          onChange={(e) =>
                            setEditedData((prev) => ({
                              ...prev,
                              preferred_language: e.target.value as
                                | "english"
                                | "spanish",
                            }))
                          }
                        >
                          <option value="english">English</option>
                          <option value="spanish">Spanish</option>
                        </select>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          {profileData && (
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
