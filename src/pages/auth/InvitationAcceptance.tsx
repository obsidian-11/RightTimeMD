import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks";
import type { ClinicInvitation } from "@/types";

export function InvitationAcceptance() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isAccepting, setIsAccepting] = useState(false);

  const token = searchParams.get("token");

  // Query for invitation details
  const {
    data: invitation,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invitation", token],
    queryFn: async () => {
      if (!token) throw new Error("No invitation token provided");

      const { data, error } = await supabase
        .from("clinic_invitations")
        .select(
          `
          *,
          clinic:clinic_id (
            id,
            name,
            type,
            street,
            city,
            state
          )
        `,
        )
        .eq("invitation_token", token)
        .single();

      if (error) throw error;

      // Check if invitation is expired
      if (new Date(data.expires_at) < new Date()) {
        throw new Error("This invitation has expired");
      }

      // Check if invitation has been used too many times
      if (data.max_uses && data.current_uses >= data.max_uses) {
        throw new Error(
          "This invitation has been used maximum number of times",
        );
      }

      return data as ClinicInvitation & { clinic: any };
    },
    enabled: !!token,
  });

  const handleAcceptInvitation = async () => {
    if (!invitation || !user) return;

    setIsAccepting(true);
    try {
      // Mark invitation as used
      const { error: updateError } = await supabase
        .from("clinic_invitations")
        .update({
          used_at: new Date().toISOString(),
          used_by: user.id,
          current_uses: invitation.current_uses + 1,
        })
        .eq("invitation_token", token);

      if (updateError) throw updateError;

      toast.success("Invitation accepted! Redirecting to onboarding...");

      // Redirect based on invitation role
      if (invitation.role === "patient") {
        navigate(
          `/onboarding/patient?clinic=${invitation.clinic_id}&token=${token}`,
        );
      } else {
        navigate(
          `/onboarding/staff?clinic=${invitation.clinic_id}&token=${token}&role=${invitation.role}`,
        );
      }
    } catch (error: any) {
      toast.error(`Failed to accept invitation: ${error.message}`);
    } finally {
      setIsAccepting(false);
    }
  };

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold text-red-600">
                Invalid Invitation
              </h2>
              <p className="mb-4 text-gray-600">
                No invitation token found in the URL.
              </p>
              <Button onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <Skeleton className="mx-auto h-8 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-4 w-56" />
              <Skeleton className="mx-auto h-10 w-32" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold text-red-600">
                Invitation Error
              </h2>
              <p className="mb-4 text-gray-600">{error.message}</p>
              <Button onClick={() => navigate("/login")}>Go to Login</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <h2 className="mb-2 text-xl font-semibold">Login Required</h2>
              <p className="mb-4 text-gray-600">
                Please log in to accept this invitation.
              </p>
              <Button
                onClick={() =>
                  navigate(`/login?redirect=/auth/invitation?token=${token}`)
                }
              >
                Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-center">Clinic Invitation</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold">
              You're invited to join {invitation?.clinic?.name}
            </h3>
            <p className="text-gray-600">
              {invitation?.clinic?.street}, {invitation?.clinic?.city},{" "}
              {invitation?.clinic?.state}
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Invitation Type:</span>
              <Badge variant="default">Clinic Access</Badge>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Invited by:</span>
              <span className="text-sm text-gray-600">
                {invitation?.invited_by}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-sm font-medium">Expires:</span>
              <span className="text-sm text-gray-600">
                {new Date(invitation?.expires_at || "").toLocaleDateString()}
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => navigate("/login")}
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={handleAcceptInvitation}
              disabled={isAccepting}
            >
              {isAccepting ? "Accepting..." : "Accept Invitation"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
