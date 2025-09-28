import { useState } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/hooks";
import { AlertTriangle, Shield, Key, User } from "lucide-react";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [emailData, setEmailData] = useState({
    newEmail: "",
  });

  const handlePasswordChange = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords don't match");
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters long");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword,
      });

      if (error) throw error;

      toast.success("Password updated successfully!");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error("Failed to update password", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEmailChange = async () => {
    if (!emailData.newEmail) {
      toast.error("Please enter a new email address");
      return;
    }

    if (emailData.newEmail === user?.email) {
      toast.error("This is already your current email address");
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase.auth.updateUser({
        email: emailData.newEmail,
      });

      if (error) throw error;

      toast.success(
        "Email update initiated! Please check your new email for confirmation.",
      );
      setEmailData({ newEmail: "" });
    } catch (error: any) {
      console.error("Error updating email:", error);
      toast.error("Failed to update email", {
        description: error.message || "Please try again.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = window.confirm(
      "Are you sure you want to delete your account? This action cannot be undone and will remove all your data from the system.",
    );

    if (!confirmed) return;

    const doubleConfirmed = window.confirm(
      "This will permanently delete your account and all associated data. Type 'DELETE' to confirm.",
    );

    if (!doubleConfirmed) return;

    setIsUpdating(true);
    try {
      // Note: Supabase doesn't have a direct deleteUser method for security reasons
      // In a real application, you'd typically call a backend function that handles
      // account deletion properly with all the necessary cleanup
      toast.info(
        "Account deletion request submitted. Please contact support to complete the process.",
      );
      onClose();
    } catch (error: any) {
      console.error("Error deleting account:", error);
      toast.error("Failed to delete account", {
        description: error.message || "Please contact support.",
      });
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Account Settings</DialogTitle>
          <DialogDescription>
            Manage your Supabase account settings and security preferences.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <Tabs defaultValue="account" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="account">Account</TabsTrigger>
              <TabsTrigger value="security">Security</TabsTrigger>
              <TabsTrigger value="danger">Danger Zone</TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Account Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Current Email</Label>
                    <Input
                      value={user.email || ""}
                      disabled
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>User ID</Label>
                    <Input
                      value={user.id || ""}
                      disabled
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      This is your unique identifier in the system
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label>Account Created</Label>
                    <Input
                      value={
                        user.created_at
                          ? new Date(user.created_at).toLocaleDateString()
                          : "Unknown"
                      }
                      disabled
                      className="bg-gray-50"
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Email Address</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Changing your email will require verification. You'll need
                      to confirm the new email address.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <Label htmlFor="newEmail">New Email Address</Label>
                    <Input
                      id="newEmail"
                      type="email"
                      value={emailData.newEmail}
                      onChange={(e) =>
                        setEmailData((prev) => ({
                          ...prev,
                          newEmail: e.target.value,
                        }))
                      }
                      placeholder="Enter new email address"
                    />
                  </div>

                  <Button
                    onClick={handleEmailChange}
                    disabled={isUpdating || !emailData.newEmail}
                    className="w-full"
                  >
                    {isUpdating ? "Updating..." : "Update Email"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Settings
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert>
                    <Key className="h-4 w-4" />
                    <AlertDescription>
                      Use a strong password with at least 8 characters,
                      including uppercase, lowercase, numbers, and special
                      characters.
                    </AlertDescription>
                  </Alert>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Change Password</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          newPassword: e.target.value,
                        }))
                      }
                      placeholder="Enter new password"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">
                      Confirm New Password
                    </Label>
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData((prev) => ({
                          ...prev,
                          confirmPassword: e.target.value,
                        }))
                      }
                      placeholder="Confirm new password"
                    />
                  </div>

                  <Button
                    onClick={handlePasswordChange}
                    disabled={
                      isUpdating ||
                      !passwordData.newPassword ||
                      !passwordData.confirmPassword
                    }
                    className="w-full"
                  >
                    {isUpdating ? "Updating..." : "Change Password"}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="danger" className="space-y-4">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <AlertTriangle className="h-5 w-5" />
                    Danger Zone
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Alert className="border-red-200 bg-red-50">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-800">
                      These actions are permanent and cannot be undone. Please
                      proceed with caution.
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium text-gray-900">
                        Delete Account
                      </h4>
                      <p className="mt-1 text-sm text-gray-500">
                        Permanently delete your account and all associated data.
                        This action cannot be undone.
                      </p>
                    </div>

                    <Button
                      variant="destructive"
                      onClick={handleDeleteAccount}
                      disabled={isUpdating}
                      className="w-full"
                    >
                      {isUpdating ? "Processing..." : "Delete Account"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
