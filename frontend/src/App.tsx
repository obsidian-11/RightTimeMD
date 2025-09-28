import { Routes, Route } from "react-router";
import { useAuth } from "@hooks";
import { P404, Dashboard, LandingPage, LoginPage, SignupPage } from "@pages";

export default function App() {
  const { loading } = useAuth();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/clinic-registration" element={<></>} />
      <Route path="/staff-invitation" element={<></>} />
      <Route path="/password-reset" element={<></>} />
      <Route path="/dashboard/*" element={<Dashboard />} />
      <Route path="/*" element={<P404 />} />
    </Routes>
  );
}
