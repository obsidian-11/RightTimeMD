import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Trash2,
  Mail,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { supabase } from "@/lib/supabase";
import { useClinic, useAuth } from "@/hooks";
import type { Patient } from "@/types";

export function Patients() {
  const { currentClinic } = useClinic();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");

  // Query for patients
  const {
    data: patients,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-patients", currentClinic?.id, searchTerm],
    queryFn: async () => {
      if (!currentClinic?.id) return [];

      let query = supabase
        .from("patient")
        .select("*")
        .eq("clinic_id", currentClinic.id);

      if (searchTerm) {
        query = query.or(
          `firstname.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,mrn.ilike.%${searchTerm}%`,
        );
      }

      const { data, error } = await query.order("lastname", {
        ascending: true,
      });
      if (error) throw error;

      return data || [];
    },
    enabled: !!currentClinic?.id,
    staleTime: 2 * 60 * 1000,
  });

  // Invite patient mutation - now uses clinic_invitations table
  const invitePatientMutation = useMutation({
    mutationFn: async (email: string) => {
      if (!currentClinic?.id || !user?.id)
        throw new Error("Missing clinic or user");

      // Generate invitation token
      const invitationToken = crypto.randomUUID();

      // Create invitation record
      const { error } = await supabase.from("clinic_invitations").insert({
        clinic_id: currentClinic.id,
        invitation_token: invitationToken,
        email: email,
        invited_by: user.id,
        role: "patient",
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days
        max_uses: 1,
        current_uses: 0,
      });

      if (error) throw error;

      // Generate invitation URL
      const invitationUrl = `${window.location.origin}/auth/invitation?token=${invitationToken}`;

      // TODO: Send actual invitation email with URL
      console.log(
        `Patient invitation sent to ${email} with URL: ${invitationUrl}`,
      );

      return { email, invitationUrl };
    },
    onSuccess: (data) => {
      toast.success(`Patient invitation sent to ${data.email}`);
      queryClient.invalidateQueries({
        queryKey: ["admin-patients", currentClinic?.id],
      });
      setIsInviteModalOpen(false);
      setInviteEmail("");
    },
    onError: (error: any) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });

  // Delete patient mutation
  const deletePatientMutation = useMutation({
    mutationFn: async (patientId: string) => {
      // First delete all related records to avoid foreign key constraint violations

      // Delete patient consents
      const { error: consentError } = await supabase
        .from("patient_consent")
        .delete()
        .eq("patient_id", patientId);

      if (consentError) {
        console.error("Failed to delete patient consents:", consentError);
        // Continue anyway - consent deletion is not critical
      }

      // Delete FHIR records
      const { error: fhirError } = await supabase
        .from("fhir")
        .delete()
        .eq("patient_id", patientId);

      if (fhirError) {
        console.error("Failed to delete FHIR records:", fhirError);
        // Continue anyway - FHIR deletion is not critical
      }

      // Delete appointments
      const { error: appointmentError } = await supabase
        .from("appointment")
        .delete()
        .eq("patient_id", patientId);

      if (appointmentError) {
        console.error("Failed to delete appointments:", appointmentError);
        // Continue anyway - appointment deletion is not critical
      }

      // Finally delete the patient record
      const { error } = await supabase
        .from("patient")
        .delete()
        .eq("id", patientId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Patient removed successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin-patients", currentClinic?.id],
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove patient: ${error.message}`);
    },
  });

  const getAgeFromDOB = (dobString: string) => {
    const today = new Date();
    const birthDate = new Date(dobString);
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

  const isInvitationPending = (patient: Patient) => {
    return patient.firstname === "Pending" && patient.lastname === "Invitation";
  };

  const handleDeletePatient = (patient: Patient) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${patient.firstname} ${patient.lastname} from this clinic? This action cannot be undone.`,
    );
    if (confirmed) {
      deletePatientMutation.mutate(patient.id);
    }
  };

  const handleInvitePatient = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim()) {
      invitePatientMutation.mutate(inviteEmail.trim());
    }
  };

  if (!currentClinic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">
          Please select a clinic to manage patients.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Patient Management
          </h1>
          <p className="text-sm text-gray-600">
            Manage patient access and invitations for {currentClinic.name}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsInviteModalOpen(true)}>
          <Mail className="h-4 w-4" />
          Invite Patient
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Patients</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name, email, or MRN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Clinic Patients</CardTitle>
            <Badge variant="secondary">
              {patients?.length || 0} total patients
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="flex h-32 items-center justify-center text-red-600">
              Error loading patients: {error.message}
            </div>
          ) : patients && patients.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>MRN</TableHead>
                  <TableHead>Age</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {patients.map((patient: Patient) => {
                  const isPending = isInvitationPending(patient);
                  return (
                    <TableRow key={patient.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <div
                            className={`flex h-10 w-10 items-center justify-center rounded-full font-medium ${
                              isPending
                                ? "bg-yellow-100 text-yellow-600"
                                : "bg-blue-100 text-blue-600"
                            }`}
                          >
                            {patient.firstname?.charAt(0) || "U"}
                            {patient.lastname?.charAt(0) || "N"}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {patient.firstname || "Unknown"}{" "}
                              {patient.lastname || "Patient"}
                            </p>
                            <p className="text-sm text-gray-500">
                              {patient.email || "No email provided"}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {patient.mrn || "—"}
                      </TableCell>
                      <TableCell>
                        {patient.date_of_birth && !isPending
                          ? getAgeFromDOB(String(patient.date_of_birth))
                          : "—"}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm text-gray-600">
                          <div>{patient.phone_primary || "—"}</div>
                          <div>{patient.email || "—"}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {isPending ? (
                          <Badge
                            variant="outline"
                            className="gap-1 text-yellow-600"
                          >
                            <AlertTriangle className="h-3 w-3" />
                            Invitation Pending
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="gap-1 text-green-600"
                          >
                            <CheckCircle className="h-3 w-3" />
                            Active
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!isPending && (
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeletePatient(patient)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-gray-500">
              <p className="text-lg font-medium">No patients found</p>
              <p className="text-sm">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "Start by inviting your first patient"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Patient Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Patient</DialogTitle>
            <DialogDescription>
              Send an invitation to a patient to join {currentClinic.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInvitePatient} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="email" className="text-sm font-medium">
                Patient Email Address
              </label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="patient@example.com"
                required
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteEmail("");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={invitePatientMutation.isPending}>
                {invitePatientMutation.isPending
                  ? "Sending..."
                  : "Send Invitation"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
