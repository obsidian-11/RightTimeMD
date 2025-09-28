import { useAuth, useClinic } from "@/hooks";
import { Link, useLocation } from "react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, Settings, LogOut, Stethoscope } from "lucide-react";
import { ClinicSwitcher } from "@/components/ClinicSwitcher";
import { ProfileModal } from "./ProfileModal";
import { SettingsModal } from "./SettingsModal";
import { NotificationsPopover } from "./NotificationsPopover";
import type { Clinic } from "@/types";

export function Topbar() {
  const { signOut } = useAuth();
  const { updateClinicFromRoute, currentClinic } = useClinic();
  const location = useLocation();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // Check if we're inside a clinic dashboard (not on the main clinics page)
  const isInClinicDashboard = /\/(patient|clinical|admin|support)\//.test(
    location.pathname,
  );

  // Update current clinic when route changes
  useEffect(() => {
    if (isInClinicDashboard) {
      updateClinicFromRoute(location.pathname);
    }
  }, [location.pathname, isInClinicDashboard, updateClinicFromRoute]);

  const handleClinicChange = (clinic: Clinic) => {
    // Additional logic when clinic changes can be added here
    console.log("Switched to clinic:", clinic.name);
  };

  return (
    <Card className="flex min-h-[84px] w-full flex-row items-center justify-between rounded-none border-0 border-b bg-white px-6 py-4 shadow-sm">
      {/* Logo/Brand and Clinic Switcher */}
      <div className="flex min-h-[48px] items-center gap-6">
        <Link
          to="/home"
          className="text-primary hover:text-primary/90 flex items-center gap-3 text-xl font-bold transition-colors"
        >
          <div className="bg-primary flex h-8 w-8 items-center justify-center rounded-lg text-white">
            <Stethoscope className="h-5 w-5" />
          </div>
          RightTimeMD
        </Link>

        {/* Clinic Switcher - Only show when inside a clinic dashboard */}
        <div className="min-w-0">
          {isInClinicDashboard && (
            <ClinicSwitcher onClinicChange={handleClinicChange} />
          )}
        </div>
      </div>

      {/* User Actions */}
      <div className="flex items-center gap-2">
        <NotificationsPopover />
        {/* Profile Button - Only show when inside a clinic */}
        {isInClinicDashboard && currentClinic && (
          <Button
            variant="ghost"
            size="sm"
            className="gap-2 text-gray-600 hover:text-gray-900"
            onClick={() => setIsProfileModalOpen(true)}
          >
            <User className="h-4 w-4" />
            Profile
          </Button>
        )}

        <Button
          variant="ghost"
          size="sm"
          className="gap-2 text-gray-600 hover:text-gray-900"
          onClick={() => setIsSettingsModalOpen(true)}
        >
          <Settings className="h-4 w-4" />
          Settings
        </Button>

        <div className="mx-2 h-6 w-px bg-gray-200" />

        <Button
          onClick={signOut}
          variant="ghost"
          size="sm"
          className="gap-2 text-red-600 hover:bg-red-50 hover:text-red-700"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>

      {/* Modals */}
      {currentClinic && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          clinic={currentClinic}
        />
      )}

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
    </Card>
  );
}
