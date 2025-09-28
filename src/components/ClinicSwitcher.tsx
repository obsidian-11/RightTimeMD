import React, { useState } from "react";
import {
  Building,
  Building2,
  Heart,
  Stethoscope,
  Eye,
  Brain,
  Activity,
  Zap,
  Check,
  ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useClinic } from "@/hooks";
import { useNavigate, useLocation } from "react-router";
import type { Clinic, ClinicType } from "@/types";

interface ClinicSwitcherProps {
  onClinicChange?: (clinic: Clinic) => void;
}

export function ClinicSwitcher({ onClinicChange }: ClinicSwitcherProps) {
  const {
    currentClinic,
    availableClinics,
    switchClinic,
    loading,
    patientClinics,
    staffClinics,
    updateClinicFromRoute,
  } = useClinic();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Debug logging
  React.useEffect(() => {
    if (availableClinics.length > 0) {
      console.log("Available clinics:", availableClinics);
      console.log("First clinic type:", availableClinics[0]?.type);
    }
  }, [availableClinics]);

  // Update current clinic when route changes
  React.useEffect(() => {
    const isInClinicDashboard = /\/(patient|clinical|admin|support)\//.test(
      location.pathname,
    );
    if (isInClinicDashboard) {
      updateClinicFromRoute(location.pathname);
    }
  }, [location.pathname, updateClinicFromRoute]);

  const getClinicTypeIcon = (type: ClinicType) => {
    const iconClass = "h-4 w-4";
    switch (type) {
      case "hospital":
        return <Building2 className={iconClass} />;
      case "family_practice":
        return <Stethoscope className={iconClass} />;
      case "urgent_care":
        return <Zap className={iconClass} />;
      case "specialty_clinic":
        return <Building className={iconClass} />;
      case "mental_health":
        return <Brain className={iconClass} />;
      case "dental":
        return <Activity className={iconClass} />;
      case "optometry":
        return <Eye className={iconClass} />;
      case "cardiology":
        return <Heart className={iconClass} />;
      case "dermatology":
      case "orthopedic":
      case "other":
      default:
        return <Building className={iconClass} />;
    }
  };

  const getClinicTypeName = (type: ClinicType) => {
    const typeNames: Record<ClinicType, string> = {
      hospital: "Hospital",
      family_practice: "Family Practice",
      urgent_care: "Urgent Care",
      specialty_clinic: "Specialty Clinic",
      mental_health: "Mental Health",
      dental: "Dental",
      optometry: "Optometry",
      dermatology: "Dermatology",
      cardiology: "Cardiology",
      orthopedic: "Orthopedic",
      other: "Other",
    };
    return typeNames[type] || "Unknown";
  };

  // Get user's role at a specific clinic
  const getUserRoleAtClinic = (clinicId: string) => {
    const isPatient = patientClinics.some(
      (p: any) => p.clinic?.id === clinicId,
    );
    if (isPatient) return "patient";

    const staffRecord = staffClinics.find(
      (s: any) => s.clinic?.id === clinicId,
    );
    if (staffRecord) return staffRecord.type || "staff";

    return "patient"; // default fallback
  };

  const handleClinicSelect = (clinic: Clinic) => {
    switchClinic(clinic);
    setIsOpen(false);
    onClinicChange?.(clinic);

    // Navigate to the appropriate dashboard based on user's role at this clinic
    const userRole = getUserRoleAtClinic(clinic.id);
    const newPath = `/dashboard/${userRole}/${clinic.id}`;

    // Only navigate if we're not already on this path
    if (
      location.pathname !== newPath &&
      !location.pathname.startsWith(newPath)
    ) {
      navigate(newPath);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
      </div>
    );
  }

  if (!currentClinic) {
    return (
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            Select Clinic
            <ChevronDown className="h-4 w-4 text-gray-400" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="start" className="w-80" sideOffset={8}>
          <DropdownMenuLabel className="text-xs font-medium tracking-wide text-gray-500 uppercase">
            Select Clinic
          </DropdownMenuLabel>
          <DropdownMenuSeparator />

          <div className="max-h-64 overflow-y-auto">
            {availableClinics.map((clinic) => (
              <DropdownMenuItem
                key={clinic.id}
                className="flex cursor-pointer items-center gap-3 p-3 focus:bg-gray-50"
                onClick={() => handleClinicSelect(clinic)}
              >
                <Avatar className="h-10 w-10 flex-shrink-0">
                  <AvatarImage src={clinic.icon_url} alt={clinic.name} />
                  <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                    {clinic.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex w-full items-center gap-2">
                    <span className="truncate font-medium text-gray-900">
                      {clinic.name}
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                    {getClinicTypeIcon(clinic.type)}
                    <span>{getClinicTypeName(clinic.type)}</span>
                  </div>
                  <div className="mt-1 truncate text-xs text-gray-400">
                    {clinic.city}, {clinic.state}
                  </div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="flex h-auto max-w-64 items-center gap-3 px-3 py-2 hover:bg-gray-50"
        >
          <Avatar className="h-8 w-8">
            <AvatarImage
              src={currentClinic.icon_url}
              alt={currentClinic.name}
            />
            <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
              {currentClinic.name.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className="flex min-w-0 flex-1 flex-col items-start">
            <div className="flex w-full items-center gap-2">
              <span className="truncate font-medium text-gray-900">
                {currentClinic.name}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs text-gray-500">
              {getClinicTypeIcon(currentClinic.type)}
              <span className="truncate">
                {getClinicTypeName(currentClinic.type)}
              </span>
            </div>
          </div>

          <ChevronDown className="h-4 w-4 text-gray-400" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-80" sideOffset={8}>
        <DropdownMenuLabel className="text-xs font-medium tracking-wide text-gray-500 uppercase">
          Switch Clinic
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <div className="max-h-64 overflow-y-auto">
          {availableClinics.map((clinic) => (
            <DropdownMenuItem
              key={clinic.id}
              className="flex cursor-pointer items-center gap-3 p-3 focus:bg-gray-50"
              onClick={() => handleClinicSelect(clinic)}
            >
              <Avatar className="h-10 w-10 flex-shrink-0">
                <AvatarImage src={clinic.icon_url} alt={clinic.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">
                  {clinic.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex min-w-0 flex-1 flex-col">
                <div className="flex w-full items-center gap-2">
                  <span className="truncate font-medium text-gray-900">
                    {clinic.name}
                  </span>
                  {currentClinic?.id === clinic.id && (
                    <Check className="text-primary h-4 w-4 flex-shrink-0" />
                  )}
                </div>
                <div className="mt-1 flex items-center gap-1 text-xs text-gray-500">
                  {getClinicTypeIcon(clinic.type)}
                  <span>{getClinicTypeName(clinic.type)}</span>
                </div>
                <div className="mt-1 truncate text-xs text-gray-400">
                  {clinic.city}, {clinic.state}
                </div>
              </div>
            </DropdownMenuItem>
          ))}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
