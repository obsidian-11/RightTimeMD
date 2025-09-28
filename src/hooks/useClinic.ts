import React from "react";
import { atom, useAtom } from "jotai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "./useAuth";
import type { Clinic } from "@/types";

// Atoms for clinic state
export const currentClinicAtom = atom<Clinic | null>(null);

// Query keys
export const clinicQueryKeys = {
  userClinics: (userId: string) => ["user-clinics", userId] as const,
};

// Main hook for clinic operations
export function useClinic() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentClinic, setCurrentClinic] = useAtom(currentClinicAtom);

  // Query for user's clinics using the same pattern as Clinics.tsx
  const {
    data,
    isLoading: loading,
    error: queryError,
    refetch: refetchClinics,
  } = useQuery({
    queryKey: clinicQueryKeys.userClinics(user?.id || ""),
    queryFn: async () => {
      if (!user?.id) return { patientClinics: [], staffClinics: [] };

      let patientClinics: any = { data: [], error: null };
      let staffClinics: any = { data: [], error: null };

      try {
        // Try to fetch patient clinics
        patientClinics = await supabase
          .from("patient")
          .select(
            `
            *,
            clinic:clinic_id (
              id,
              name,
              type,
              email,
              phone_number,
              street,
              city,
              state,
              zip,
              icon_url,
              verified
            )
          `,
          )
          .eq("id", user.id);
      } catch (error) {
        // Ignore permission errors for patient table
        console.log("Patient clinics query failed (expected for staff users)");
        patientClinics = { data: [], error: null };
      }

      try {
        // Try to fetch staff clinics
        staffClinics = await supabase
          .from("staff")
          .select(
            `
            *,
            clinic:clinic_id (
              id,
              name,
              type,
              email,
              phone_number,
              street,
              city,
              state,
              zip,
              icon_url,
              verified
            )
          `,
          )
          .eq("id", user.id);
      } catch (error) {
        // Ignore permission errors for staff table
        console.log("Staff clinics query failed (expected for patient users)");
        staffClinics = { data: [], error: null };
      }

      return {
        patientClinics: patientClinics.data || [],
        staffClinics: staffClinics.data || [],
      };
    },
    enabled: !!user?.id,
    retry: false, // Don't retry on permission errors
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });

  // Extract all unique clinics from both patient and staff relationships
  const availableClinics: Clinic[] = React.useMemo(() => {
    if (!data) return [];

    const clinics = new Map<string, Clinic>();

    // Add patient clinics
    data.patientClinics.forEach((record: any) => {
      if (record.clinic) {
        console.log("Patient clinic record:", record.clinic);
        clinics.set(record.clinic.id, record.clinic);
      }
    });

    // Add staff clinics
    data.staffClinics.forEach((record: any) => {
      if (record.clinic) {
        console.log("Staff clinic record:", record.clinic);
        clinics.set(record.clinic.id, record.clinic);
      }
    });

    const result = Array.from(clinics.values());
    console.log("Final processed availableClinics:", result);
    return result;
  }, [data]);

  // Set current clinic when available clinics change
  React.useEffect(() => {
    if (!availableClinics.length) {
      setCurrentClinic(null);
      return;
    }

    // Load saved clinic from localStorage or default to first
    const savedClinicId = localStorage.getItem("selectedClinicId");
    let selectedClinic: Clinic | null = null;

    if (savedClinicId) {
      selectedClinic =
        availableClinics.find((c) => c.id === savedClinicId) || null;
    }

    // Fallback to first clinic if no saved selection or saved clinic not found
    if (!selectedClinic) {
      selectedClinic = availableClinics[0];
    }

    setCurrentClinic(selectedClinic);

    // Save selection to localStorage
    if (selectedClinic) {
      localStorage.setItem("selectedClinicId", selectedClinic.id);
    }
  }, [availableClinics, setCurrentClinic]);

  // Function to update current clinic based on route
  const updateClinicFromRoute = React.useCallback(
    (pathname: string) => {
      // Extract clinic ID from route like /dashboard/patient/clinic-id or /dashboard/staff-role/clinic-id
      const routeMatch = pathname.match(
        /\/dashboard\/(?:patient|clinical|admin|support)\/([^\/]+)/,
      );
      if (routeMatch && availableClinics.length > 0) {
        const routeClinicId = routeMatch[1];
        const routeClinic = availableClinics.find(
          (c) => c.id === routeClinicId,
        );

        if (routeClinic && routeClinic.id !== currentClinic?.id) {
          console.log(
            "Route changed - updating current clinic to:",
            routeClinic.name,
          );
          setCurrentClinic(routeClinic);
          localStorage.setItem("selectedClinicId", routeClinic.id);
        }
      }
    },
    [availableClinics, currentClinic, setCurrentClinic],
  );

  const switchClinic = (clinic: Clinic) => {
    setCurrentClinic(clinic);
    localStorage.setItem("selectedClinicId", clinic.id);

    // Dispatch custom event for other components that might need to react
    window.dispatchEvent(new CustomEvent("clinicChanged", { detail: clinic }));
  };

  const invalidateClinics = () => {
    if (user?.id) {
      queryClient.invalidateQueries({
        queryKey: clinicQueryKeys.userClinics(user.id),
      });
    }
  };

  const error = queryError instanceof Error ? queryError.message : null;

  return {
    currentClinic,
    availableClinics,
    switchClinic,
    loading,
    error,
    refetchClinics,
    invalidateClinics,
    updateClinicFromRoute,
    // Additional context from the data
    patientClinics: data?.patientClinics || [],
    staffClinics: data?.staffClinics || [],
  };
}

// Utility hook for clinic operations
export function useClinicOperations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const invalidateUserClinics = () => {
    if (user?.id) {
      queryClient.invalidateQueries({
        queryKey: clinicQueryKeys.userClinics(user.id),
      });
    }
  };

  const refetchUserClinics = () => {
    if (user?.id) {
      return queryClient.refetchQueries({
        queryKey: clinicQueryKeys.userClinics(user.id),
      });
    }
  };

  const prefetchUserClinics = () => {
    if (user?.id) {
      return queryClient.prefetchQuery({
        queryKey: clinicQueryKeys.userClinics(user.id),
        queryFn: async () => {
          let patientClinics: any = { data: [], error: null };
          let staffClinics: any = { data: [], error: null };

          try {
            patientClinics = await supabase
              .from("patient")
              .select(
                `
                *,
                clinic:clinic_id (
                  id,
                  name,
                  type,
                  email,
                  phone_number,
                  street,
                  city,
                  state,
                  zip,
                  icon_url,
                  verified
                )
              `,
              )
              .eq("id", user.id);
          } catch (error) {
            console.log(
              "Patient clinics prefetch failed (expected for staff users)",
            );
            patientClinics = { data: [], error: null };
          }

          try {
            staffClinics = await supabase
              .from("staff")
              .select(
                `
                *,
                clinic:clinic_id (
                  id,
                  name,
                  type,
                  email,
                  phone_number,
                  street,
                  city,
                  state,
                  zip,
                  icon_url,
                  verified
                )
              `,
              )
              .eq("id", user.id);
          } catch (error) {
            console.log(
              "Staff clinics prefetch failed (expected for patient users)",
            );
            staffClinics = { data: [], error: null };
          }

          return {
            patientClinics: patientClinics.data || [],
            staffClinics: staffClinics.data || [],
          };
        },
        staleTime: 5 * 60 * 1000,
      });
    }
  };

  return {
    invalidateUserClinics,
    refetchUserClinics,
    prefetchUserClinics,
  };
}
