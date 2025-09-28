import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Search, UserPlus, Edit, Trash2, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/lib/supabase";
import { useClinic, useAuth } from "@/hooks";
import type { Staff } from "@/types";

export function Staff() {
  const { currentClinic } = useClinic();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [selectedStaffRole, setSelectedStaffRole] = useState<
    "admin" | "clinical"
  >("clinical");

  // Query for staff
  const {
    data: staff,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["admin-staff", currentClinic?.id, searchTerm],
    queryFn: async () => {
      if (!currentClinic?.id) return [];

      let query = supabase
        .from("staff")
        .select("*")
        .eq("clinic_id", currentClinic.id);

      if (searchTerm) {
        query = query.or(
          `firstname.ilike.%${searchTerm}%,lastname.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`,
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

  const getStaffTypeColor = (type: any) => {
    // Color based on the actual staff type from the Staff interface
    switch (type) {
      case "doctor":
        return "bg-blue-100 text-blue-800";
      case "nurse":
        return "bg-green-100 text-green-800";
      case "nurse_practitioner":
        return "bg-purple-100 text-purple-800";
      case "physician_assistant":
        return "bg-indigo-100 text-indigo-800";
      case "medical_assistant":
        return "bg-yellow-100 text-yellow-800";
      case "lab_technician":
        return "bg-orange-100 text-orange-800";
      case "pharmacist":
        return "bg-red-100 text-red-800";
      case "therapist":
        return "bg-pink-100 text-pink-800";
      case "receptionist":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStaffTypeLabel = (type: any) => {
    return type
      .replace(/_/g, " ")
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  };

  // Invite staff mutation
  const inviteStaffMutation = useMutation({
    mutationFn: async ({
      email,
      staffRole,
    }: {
      email: string;
      staffRole: "admin" | "clinical";
    }) => {
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
        role: staffRole,
        expires_at: new Date(
          Date.now() + 7 * 24 * 60 * 60 * 1000,
        ).toISOString(), // 7 days
        max_uses: 1,
        current_uses: 0,
      });

      if (error) throw error;

      // Generate invitation URL
      const invitationUrl = `${window.location.origin}/auth/invitation?token=${invitationToken}`;

      // TODO: Send actual invitation email
      console.log(
        `Staff invitation sent to ${email} with URL: ${invitationUrl}`,
      );

      return { email, invitationUrl, staffRole };
    },
    onSuccess: (data) => {
      toast.success(`Staff invitation sent to ${data.email}`);
      queryClient.invalidateQueries({
        queryKey: ["admin-staff", currentClinic?.id],
      });
      setIsInviteModalOpen(false);
      setInviteEmail("");
      setSelectedStaffRole("clinical");
    },
    onError: (error: any) => {
      toast.error(`Failed to send invitation: ${error.message}`);
    },
  });

  // Delete staff mutation
  const deleteStaffMutation = useMutation({
    mutationFn: async (staffId: string) => {
      const { error } = await supabase.from("staff").delete().eq("id", staffId);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff member removed successfully");
      queryClient.invalidateQueries({
        queryKey: ["admin-staff", currentClinic?.id],
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to remove staff member: ${error.message}`);
    },
  });

  const handleInviteStaff = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteEmail.trim() && selectedStaffRole) {
      inviteStaffMutation.mutate({
        email: inviteEmail.trim(),
        staffRole: selectedStaffRole,
      });
    }
  };

  const handleDeleteStaff = (staff: Staff) => {
    const confirmed = window.confirm(
      `Are you sure you want to remove ${staff.firstname} ${staff.lastname} from this clinic? This action cannot be undone.`,
    );
    if (confirmed) {
      deleteStaffMutation.mutate(staff.id);
    }
  };

  if (!currentClinic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">Please select a clinic to manage staff.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Staff Management</h1>
          <p className="text-sm text-gray-600">
            Manage staff members at {currentClinic.name}
          </p>
        </div>
        <Button className="gap-2" onClick={() => setIsInviteModalOpen(true)}>
          <UserPlus className="h-4 w-4" />
          Invite Staff Member
        </Button>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Search Staff</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute top-3 left-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Staff Members</CardTitle>
            <Badge variant="secondary">{staff?.length || 0} total staff</Badge>
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
              Error loading staff: {error.message}
            </div>
          ) : staff && staff.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Staff Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member: Staff) => (
                  <TableRow key={member.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 font-medium text-blue-600">
                          {member.firstname?.charAt(0) || "U"}
                          {member.lastname?.charAt(0) || "N"}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            {member.firstname || "Unknown"}{" "}
                            {member.lastname || "Staff"}
                          </p>
                          <p className="text-sm text-gray-500">
                            {member.email || "No email provided"}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={getStaffTypeColor(member.type)}
                        variant="secondary"
                      >
                        {getStaffTypeLabel(member.type)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-gray-600">
                        <div>{member.phone_primary || "—"}</div>
                        <div>{member.email || "—"}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {member.city}, {member.state}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="outline" size="sm">
                          <Shield className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteStaff(member)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="flex h-32 flex-col items-center justify-center text-gray-500">
              <p className="text-lg font-medium">No staff members found</p>
              <p className="text-sm">
                {searchTerm
                  ? "Try adjusting your search criteria"
                  : "Start by adding your first staff member"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invite Staff Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Staff Member</DialogTitle>
            <DialogDescription>
              Send an invitation to a staff member to join {currentClinic.name}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleInviteStaff} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Staff Email Address</Label>
              <Input
                id="email"
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="staff@example.com"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="staffRole">Staff Role</Label>
              <Select
                value={selectedStaffRole}
                onValueChange={(value: "admin" | "clinical") =>
                  setSelectedStaffRole(value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select staff role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="clinical">Clinical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsInviteModalOpen(false);
                  setInviteEmail("");
                  setSelectedStaffRole("clinical");
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={inviteStaffMutation.isPending}>
                {inviteStaffMutation.isPending
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
