import {
  Activity,
  CalendarDays,
  History,
  Home,
  // MessageCircle,
  PersonStanding,
  Pill,
  Search,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import { NavLink, useParams, useLocation } from "react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export function Sidenav({ type }: { type: string }) {
  const { id } = useParams();
  const location = useLocation();

  const rootPath = location.pathname.split("/")[1];
  const baseUrl = `/${rootPath}/${type}/${id}`;

  const navLinks = () => {
    switch (type) {
      case "patient":
        return [
          { label: "Dashboard", icon: <Home />, link: baseUrl },
          {
            label: "Medical History",
            icon: <History />,
            link: `${baseUrl}/medical-history`,
          },
          {
            label: "Medications",
            icon: <Pill />,
            link: `${baseUrl}/medications`,
          },
          {
            label: "Health Data",
            icon: <Activity />,
            link: `${baseUrl}/health-data`,
          },
          {
            label: "Appointments",
            icon: <CalendarDays />,
            link: `${baseUrl}/appointments`,
          },
          // {
          //   label: "Care Team",
          //   icon: <PersonStanding />,
          //   link: `${baseUrl}/care-team`,
          // },
          // {
          //   label: "Messages",
          //   icon: <MessageCircle />,
          //   link: `${baseUrl}/messages`,
          // },
          // {
          //   label: "AI Assistant",
          //   icon: <Search />,
          //   link: `${baseUrl}/ai-assistant`,
          // },
        ];
      case "clinical":
        return [
          { label: "Dashboard", icon: <Home />, link: baseUrl },
          {
            label: "Patients",
            icon: <Users />,
            link: `${baseUrl}/patients`,
          },
          {
            label: "Appointments",
            icon: <CalendarDays />,
            link: `${baseUrl}/appointments`,
          },
          // {
          //   label: "Messages",
          //   icon: <MessageCircle />,
          //   link: `${baseUrl}/messages`,
          // },
          {
            label: "FHIR Query",
            icon: <Search />,
            link: `${baseUrl}/fhir-query`,
          },
        ];
      case "admin":
        return [
          { label: "Dashboard", icon: <Home />, link: baseUrl },
          {
            label: "Staff",
            icon: <PersonStanding />,
            link: `${baseUrl}/staff`,
          },
          {
            label: "Patients",
            icon: <Users />,
            link: `${baseUrl}/patients`,
          },
          {
            label: "Audit Logs",
            icon: <ShieldCheck />,
            link: `${baseUrl}/logs`,
          },
          {
            label: "Clinic Settings",
            icon: <Settings />,
            link: `${baseUrl}/settings`,
          },
        ];
      case "support":
        return [
          { label: "Dashboard", icon: <Home />, link: baseUrl },
          {
            label: "Appointments",
            icon: <CalendarDays />,
            link: `${baseUrl}/appointments`,
          },
          {
            label: "Patients",
            icon: <Users />,
            link: `${baseUrl}/patients`,
          },
          // {
          //   label: "Messages",
          //   icon: <MessageCircle />,
          //   link: `${baseUrl}/messages`,
          // },
        ];
      default:
        return [];
    }
  };

  const getNavTypeLabel = () => {
    switch (type) {
      case "patient":
        return "Patient Portal";
      case "clinical":
        return "Clinical Dashboard";
      case "admin":
        return "Admin Panel";
      case "support":
        return "Support Center";
      default:
        return "Navigation";
    }
  };

  const getNavTypeColor = () => {
    switch (type) {
      case "patient":
        return "bg-green-50 text-green-700 border-green-200";
      case "clinical":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "admin":
        return "bg-purple-50 text-purple-700 border-purple-200";
      case "support":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  return (
    <Card className="flex h-full min-w-64 flex-col rounded-none border-r bg-white py-0 shadow-sm">
      {/* Header */}
      <div className="border-b bg-gray-50/50 p-4">
        <div
          className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-medium ${getNavTypeColor()}`}
        >
          {getNavTypeLabel()}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-3">
        {navLinks().map((item) => (
          <NavLink
            key={item.label}
            to={item.link}
            end={item.link === baseUrl}
            className="block"
          >
            {({ isActive }) => (
              <Button
                variant={isActive ? "default" : "ghost"}
                size="sm"
                className={`h-10 w-full justify-start gap-3 font-medium ${
                  isActive
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                }`}
              >
                <span
                  className={`flex h-5 w-5 items-center justify-center ${
                    isActive ? "text-primary-foreground" : "text-gray-500"
                  }`}
                >
                  {item.icon}
                </span>
                <span className="flex-1 text-left">{item.label}</span>
              </Button>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t p-3">
        <div className="text-center text-xs text-gray-500">
          RightTimeMD v1.0
        </div>
      </div>
    </Card>
  );
}
