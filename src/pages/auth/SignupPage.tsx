import { useAuth } from "@hooks";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

export function SignupPage() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signUp(email, password);
      // After signup, redirect to home - onboarding happens when joining a clinic
      navigate("/home");
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (user) {
    navigate("/home");
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h2 className="mb-4 text-2xl font-bold">Sign Up</h2>

      <form onSubmit={handleSignup} className="space-y-4">
        <div>
          <label htmlFor="email" className="mb-1 block text-sm font-medium">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="mb-1 block text-sm font-medium">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2"
            required
            minLength={6}
          />
        </div>

        {error && <div className="text-sm text-red-600">{error}</div>}

        <button
          type="submit"
          className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
        >
          Sign Up
        </button>
      </form>

      <Link
        to="/login"
        className="mt-4 text-sm text-blue-600 hover:text-blue-800"
      >
        Already have an account? Sign In
      </Link>
    </div>
  );
}
