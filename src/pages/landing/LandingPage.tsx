import { Link } from "react-router";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Stethoscope,
  Shield,
  Users,
  Clock,
  Heart,
  Star,
  CheckCircle,
  ArrowRight,
} from "lucide-react";

export function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between border-b border-white/20 bg-white/10 p-6 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-green-600 shadow-lg">
            <Stethoscope className="h-6 w-6 text-white" />
          </div>
          <span className="bg-gradient-to-r from-blue-600 to-green-600 bg-clip-text text-2xl font-bold text-transparent">
            RightTimeMD
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/login">
            <Button
              variant="ghost"
              className="text-slate-700 hover:bg-white/20"
            >
              Sign In
            </Button>
          </Link>
          <Link to="/signup">
            <Button className="bg-gradient-to-r from-blue-600 to-green-600 text-white shadow-lg hover:from-blue-700 hover:to-green-700">
              Get Started
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 container mx-auto px-6 py-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-blue-100 to-green-100 px-4 py-2 text-sm font-medium text-slate-700">
              <Star className="h-4 w-4 text-yellow-500" />
              Trusted by healthcare professionals nationwide
            </div>
          </div>

          <h1 className="mb-8 bg-gradient-to-r from-slate-800 via-blue-700 to-green-700 bg-clip-text text-6xl leading-tight font-bold text-transparent md:text-7xl">
            Healthcare Records
            <br />
            <span className="text-5xl md:text-6xl">Made Simple</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-xl leading-relaxed text-slate-600">
            Streamline patient care with our comprehensive FHIR-compliant
            electronic health record system. Secure, efficient, and designed for
            modern healthcare.
          </p>

          <div className="mb-16 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup">
              <Button
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-green-600 px-8 py-4 text-lg text-white shadow-xl hover:from-blue-700 hover:to-green-700"
              >
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button
              variant="outline"
              size="lg"
              className="border-slate-300 px-8 py-4 text-lg text-slate-700 hover:bg-white/50"
            >
              Watch Demo
            </Button>
          </div>

          {/* Feature Cards */}
          <div className="mb-16 grid gap-6 md:grid-cols-3">
            <Card className="border-white/30 bg-white/60 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white/70">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100 text-blue-600">
                <Shield className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-slate-800">
                HIPAA Compliant
              </h3>
              <p className="text-slate-600">
                Enterprise-grade security with end-to-end encryption to protect
                sensitive patient data.
              </p>
            </Card>

            <Card className="border-white/30 bg-white/60 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white/70">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-green-100 text-green-600">
                <Clock className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-slate-800">
                Real-Time Updates
              </h3>
              <p className="text-slate-600">
                Instant synchronization across all devices with live patient
                data updates.
              </p>
            </Card>

            <Card className="border-white/30 bg-white/60 p-8 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white/70">
              <div className="mx-auto mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100 text-purple-600">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="mb-4 text-xl font-semibold text-slate-800">
                Team Collaboration
              </h3>
              <p className="text-slate-600">
                Seamless workflow management for multi-provider healthcare
                teams.
              </p>
            </Card>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-8 text-center md:grid-cols-4">
            <div>
              <div className="mb-2 text-3xl font-bold text-slate-800">10K+</div>
              <div className="text-slate-600">Healthcare Providers</div>
            </div>
            <div>
              <div className="mb-2 text-3xl font-bold text-slate-800">1M+</div>
              <div className="text-slate-600">Patient Records</div>
            </div>
            <div>
              <div className="mb-2 text-3xl font-bold text-slate-800">
                99.9%
              </div>
              <div className="text-slate-600">Uptime</div>
            </div>
            <div>
              <div className="mb-2 text-3xl font-bold text-slate-800">24/7</div>
              <div className="text-slate-600">Support</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative z-10 bg-gradient-to-r from-slate-50/80 to-white/80 py-20 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="mb-16 text-center">
            <h2 className="mb-6 text-4xl font-bold text-slate-800">
              Everything you need for modern healthcare
            </h2>
            <p className="mx-auto max-w-2xl text-xl text-slate-600">
              Comprehensive tools designed to streamline your workflow and
              improve patient outcomes.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Heart,
                title: "Patient Management",
                description:
                  "Complete patient profiles with medical history, allergies, and treatment plans.",
              },
              {
                icon: Stethoscope,
                title: "Clinical Documentation",
                description:
                  "FHIR-compliant records with structured data entry and templates.",
              },
              {
                icon: Shield,
                title: "Security & Compliance",
                description:
                  "Bank-level encryption with full HIPAA and SOC 2 compliance.",
              },
              {
                icon: Clock,
                title: "Appointment Scheduling",
                description:
                  "Smart scheduling system with automated reminders and confirmations.",
              },
              {
                icon: Users,
                title: "Multi-Provider Access",
                description:
                  "Role-based permissions for seamless team collaboration.",
              },
              {
                icon: CheckCircle,
                title: "Quality Assurance",
                description:
                  "Built-in checks and validations to ensure data accuracy.",
              },
            ].map((feature, index) => (
              <Card
                key={index}
                className="border-white/30 bg-white/70 p-6 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white/80"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-green-500 text-white">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-3 text-xl font-semibold text-slate-800">
                  {feature.title}
                </h3>
                <p className="text-slate-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20">
        <div className="container mx-auto px-6 text-center">
          <div className="mx-auto max-w-3xl rounded-3xl bg-gradient-to-r from-blue-600 to-green-600 p-12 text-white shadow-2xl">
            <h2 className="mb-6 text-4xl font-bold">
              Ready to transform your healthcare practice?
            </h2>
            <p className="mb-8 text-xl text-blue-100">
              Join thousands of healthcare providers already using RightTimeMD
              to deliver better patient care.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/signup">
                <Button
                  size="lg"
                  variant="secondary"
                  className="bg-white px-8 py-4 text-lg text-blue-600 hover:bg-gray-50"
                >
                  Get Started Today
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                className="border-white/30 px-8 py-4 text-lg text-white hover:bg-white/10"
              >
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-slate-900/90 py-12 text-white backdrop-blur-sm">
        <div className="container mx-auto px-6 text-center">
          <div className="mb-6 flex items-center justify-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-600 to-green-600">
              <Stethoscope className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold">RightTimeMD</span>
          </div>
          <p className="mb-4 text-slate-400">
            Empowering healthcare providers with modern, secure, and efficient
            EHR solutions.
          </p>
          <div className="flex items-center justify-center gap-8 text-sm text-slate-500">
            <span>© 2024 RightTimeMD. All rights reserved.</span>
            <span>Privacy Policy</span>
            <span>Terms of Service</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
