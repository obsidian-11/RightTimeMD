import { Routes, Route } from "react-router";
import { useAuth } from "@hooks";
import { P404, LandingPage, LoginPage, SignupPage, Home } from "@pages";

export default function App() {
  const { loading, user } = useAuth();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <Routes>
      <Route index element={<LandingPage />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />
      <Route path="/password-reset" element={<></>} />
      {user ? (
        <>
          <Route path="/clinic-registration" element={<></>} />
          <Route path="/staff-invitation" element={<></>} />
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
