import { useEffect, useState } from "react";
import { supabase } from "@supa";
import { useAtom } from "jotai";
import { sessionAtom, userAtom, onboardingCompletedAtom } from "@/state";

export function useAuth() {
  const [session, setSession] = useAtom(sessionAtom);
  const [user, setUser] = useAtom(userAtom);
  const [onboardingCompleted, setOnboardingCompleted] = useAtom(
    onboardingCompletedAtom,
  );
  const [loading, setLoading] = useState(true);

  const checkOnboardingStatus = async (userId: string) => {
    try {
      // Check if user exists as either patient or staff in any clinic
      let isOnboarded = false;

      try {
        // Check patient table
        const { data: patientData, error: patientError } = await supabase
          .from("patient")
          .select("id")
          .eq("id", userId)
          .single();

        if (!patientError && patientData) {
          isOnboarded = true;
        }
      } catch (patientError) {
        // Ignore permission errors for patient table
        console.log("Patient check failed (expected for staff users)");
      }

      if (!isOnboarded) {
        try {
          // Check staff table
          const { data: staffData, error: staffError } = await supabase
            .from("staff")
            .select("id")
            .eq("id", userId)
            .single();

          if (!staffError && staffData) {
            isOnboarded = true;
          }
        } catch (staffError) {
          // Ignore permission errors for staff table
          console.log("Staff check failed (expected for patient users)");
        }
      }

      setOnboardingCompleted(isOnboarded);
    } catch (error) {
      console.error("Error checking onboarding status:", error);
      setOnboardingCompleted(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      } else {
        setOnboardingCompleted(null);
      }

      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);

      if (session?.user) {
        checkOnboardingStatus(session.user.id);
      } else {
        setOnboardingCompleted(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) throw error;
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  };

  return {
    user,
    session,
    loading,
    onboardingCompleted,
    checkOnboardingStatus,
    signUp,
    signIn,
    signOut,
  };
}
