import { Routes, Route } from "react-router";
import { useAuth } from "@hooks";
import {
  P404,
  LandingPage,
  LoginPage,
  SignupPage,
  Home,
  InvitationAcceptance,
  PatientOnboarding,
  StaffOnboarding,
} from "@pages";

export default function App() {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  // Onboarding now happens when joining a clinic, not immediately after signup

  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/auth/invitation" element={<InvitationAcceptance />} />
      <Route path="/onboarding/patient" element={<PatientOnboarding />} />
      <Route path="/onboarding/staff" element={<StaffOnboarding />} />
      {user ? (
        <>
          <Route path="/home/*" element={<Home />} />
          <Route path="/dashboard/*" element={<Home />} />
        </>
      ) : (
        <Route path="*" element={<LoginPage />} />
      )}
      <Route path="/*" element={<P404 />} />
    </Routes>
  );
}
