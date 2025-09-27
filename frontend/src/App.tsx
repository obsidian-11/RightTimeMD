import { useAuth } from "./context/AuthContext";
import { Auth } from "./components/Auth";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router";
import Fuck from "./Fuck";
import Json from "./Json";

export default function App() {
  const { user, loading, signOut } = useAuth();

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/*"
          element={
            <div className="p-4">
              <h1 className="text-2xl font-bold mb-4">RightTimeMD Dashboard</h1>
              <p>Welcome back, {user.email}!</p>
              <button onClick={signOut}>Sign Out</button>
              <Link to="/bucket">JSON</Link>

              {/* Your existing dashboard content here */}
              <div className="mt-8">
                <Fuck />
              </div>
            </div>
          }
        />
        <Route path="/bucket" element={<Json />} />
      </Routes>
    </Router>
  );
}
