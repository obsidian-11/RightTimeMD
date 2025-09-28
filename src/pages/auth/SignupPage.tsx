import { useAuth } from "@hooks";
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Stethoscope,
  ArrowLeft,
  Eye,
  EyeOff,
  Mail,
  Lock,
  CheckCircle,
} from "lucide-react";

export function SignupPage() {
  const { user, signUp } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordRequirements = [
    { test: password.length >= 6, text: "At least 6 characters" },
    { test: /[A-Z]/.test(password), text: "One uppercase letter" },
    { test: /[a-z]/.test(password), text: "One lowercase letter" },
    { test: /[0-9]/.test(password), text: "One number" },
  ];

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (!passwordRequirements.every((req) => req.test)) {
      setError("Please meet all password requirements");
      return;
    }

    setIsLoading(true);

    try {
      await signUp(email, password);
      // After signup, redirect to home - onboarding happens when joining a clinic
      navigate("/home");
    } catch (error: any) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    navigate("/home");
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      <AnimatedBackground />

      {/* Back to Home Button */}
      <Link
        to="/"
        className="absolute top-6 left-6 z-20 flex items-center gap-2 text-slate-700 transition-colors hover:text-slate-900"
      >
        <Button
          variant="ghost"
          size="sm"
          className="text-slate-700 hover:bg-white/20"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Home
        </Button>
      </Link>

      {/* Logo */}
      <Link
        to="/"
        className="absolute top-6 right-6 z-20 flex items-center gap-3"
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-green-600">
          <Stethoscope className="h-5 w-5 text-white" />
        </div>
        <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-xl font-bold text-transparent">
          RightTimeMD
        </span>
      </Link>

      {/* Signup Form */}
      <Card className="relative z-10 w-full max-w-md border-white/30 bg-white/80 shadow-2xl backdrop-blur-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-green-600 shadow-lg">
            <Stethoscope className="h-8 w-8 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-slate-800">
            Create your account
          </CardTitle>
          <CardDescription className="text-slate-600">
            Join thousands of healthcare professionals using RightTimeMD
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-700">
                Email address
              </Label>
              <div className="relative">
                <Mail className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="border-slate-200 bg-white/70 pl-10 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-700">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="border-slate-200 bg-white/70 pr-10 pl-10 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Create a password"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Password Requirements */}
              {password && (
                <div className="mt-2 space-y-1">
                  {passwordRequirements.map((req, index) => (
                    <div
                      key={index}
                      className="flex items-center gap-2 text-xs"
                    >
                      <CheckCircle
                        className={`h-3 w-3 ${req.test ? "text-green-500" : "text-gray-300"}`}
                      />
                      <span
                        className={
                          req.test ? "text-green-600" : "text-gray-500"
                        }
                      >
                        {req.text}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password" className="text-slate-700">
                Confirm password
              </Label>
              <div className="relative">
                <Lock className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="confirm-password"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="border-slate-200 bg-white/70 pr-10 pl-10 focus:border-blue-500 focus:ring-blue-500"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute top-1/2 right-3 -translate-y-1/2 text-slate-400 transition-colors hover:text-slate-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-600">Passwords don't match</p>
              )}
            </div>

            {error && (
              <Alert className="border-red-200 bg-red-50">
                <AlertDescription className="text-red-700">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="terms"
                className="mt-1 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                required
              />
              <label htmlFor="terms" className="text-xs text-slate-600">
                I agree to the{" "}
                <Link
                  to="/terms"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-medium text-blue-600 hover:text-blue-700"
                >
                  Privacy Policy
                </Link>
              </label>
            </div>

            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-green-600 py-6 text-base text-white shadow-lg hover:from-blue-700 hover:to-green-700"
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                  Creating account...
                </div>
              ) : (
                "Create Account"
              )}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-600">
              Already have an account?{" "}
              <Link
                to="/login"
                className="font-medium text-blue-600 transition-colors hover:text-blue-700"
              >
                Sign in here
              </Link>
            </p>
          </div>

          <div className="mt-6 border-t border-slate-200 pt-6">
            <div className="text-center">
              <p className="text-xs text-slate-500">
                Your data is protected with enterprise-grade security and HIPAA
                compliance
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
