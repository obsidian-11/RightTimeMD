import { useAuth } from "@hooks";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

export function LoginPage() {
  const { user, signIn } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSignin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      await signIn(email, password);
    } catch (error: any) {
      setError(error.message);
    }
  };

  if (user) {
    navigate("/dashboard");
  }

  return (
    <div className="p-4 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Sign In</h2>

      <form onSubmit={handleSignin} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium mb-1">
            Password
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            required
            minLength={6}
          />
        </div>

        {error && <div className="text-red-600 text-sm">{error}</div>}

        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Sign In
        </button>
      </form>

      <Link
        to="/signup"
        className="mt-4 text-sm text-blue-600 hover:text-blue-800"
      >
        Don't have an account? Sign Up
      </Link>
    </div>
  );
}
