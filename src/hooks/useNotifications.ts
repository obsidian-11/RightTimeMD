import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks";
import type { ClinicInvitation } from "@/types";

export function useNotifications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Fetch pending invitations for current user
  const {
    data: invitations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["notifications", user?.email],
    queryFn: async () => {
      if (!user?.email) return [];

      const { data, error } = await supabase
        .from("clinic_invitations")
        .select(
          `
          *,
          clinic:clinic_id (
            id,
            name,
            type,
            city,
            state
          )
        `,
        )
        .eq("email", user.email)
        .is("used_at", null)
        .gte("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.email,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });

  // Accept invitation mutation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("clinic_invitations")
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id,
          current_uses: 1,
        })
        .eq("id", invitationId);

      if (error) throw error;

      // Get the invitation details for navigation
      const invitation = invitations?.find((inv) => inv.id === invitationId);
      return invitation;
    },
    onSuccess: (invitation) => {
      if (!invitation) return;

      toast.success("Invitation accepted! Redirecting to onboarding...");

      // Invalidate notifications to refresh the list
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.email],
      });

      // Navigate based on role
      if (invitation.role === "patient") {
        navigate(
          `/onboarding/patient?clinic=${invitation.clinic_id}&token=${invitation.invitation_token}`,
        );
      } else {
        navigate(
          `/onboarding/staff?clinic=${invitation.clinic_id}&token=${invitation.invitation_token}&role=${invitation.role}`,
        );
      }
    },
    onError: (error: any) => {
      toast.error(`Failed to accept invitation: ${error.message}`);
    },
  });

  // Decline invitation mutation
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      if (!user?.id) throw new Error("User not authenticated");

      const { error } = await supabase
        .from("clinic_invitations")
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id,
          current_uses: 1, // Mark as used to hide it
        })
        .eq("id", invitationId);

      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Invitation declined");
      queryClient.invalidateQueries({
        queryKey: ["notifications", user?.email],
      });
    },
    onError: (error: any) => {
      toast.error(`Failed to decline invitation: ${error.message}`);
    },
  });

  const unreadCount = invitations?.length || 0;

  return {
    invitations: invitations as
      | (ClinicInvitation & { clinic: any })[]
      | undefined,
    isLoading,
    error,
    unreadCount,
    acceptInvitation: acceptInvitationMutation.mutate,
    declineInvitation: declineInvitationMutation.mutate,
    isAccepting: acceptInvitationMutation.isPending,
    isDeclining: declineInvitationMutation.isPending,
  };
}
