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
    navigate("/home");
  }

  return (
    <div className="mx-auto max-w-md p-4">
      <h2 className="mb-4 text-2xl font-bold">Sign In</h2>

      <form onSubmit={handleSignin} className="space-y-4">
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
