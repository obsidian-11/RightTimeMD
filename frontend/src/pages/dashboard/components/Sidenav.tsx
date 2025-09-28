import {
  Activity,
  BarChart3,
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
          {
            label: "Health Data",
            icon: <Activity />,
            link: `${baseUrl}/health-data`,
          },
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
            label: "Clinic Settings",
            icon: <Settings />,
            link: `${baseUrl}/clinic-settings`,
          },
          {
            label: "Analytics",
            icon: <BarChart3 />,
            link: `${baseUrl}/analytics`,
          },
          {
            label: "Audit Logs",
            icon: <ShieldCheck />,
            link: `${baseUrl}/audit-logs`,
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

  return (
    <div className="flex flex-col bg-neutral-300 p-3 pr-10">
      <div className="mb-2 text-lg font-bold">Navigation</div>
      <nav className="flex flex-col space-y-2">
        {navLinks().map((item) => (
          <NavLink
            key={item.label}
            to={item.link}
            end={item.link === baseUrl}
            className={({ isActive }) =>
              `flex items-center space-x-2 rounded p-2 transition-colors ${
                isActive ? "bg-neutral-500 text-white" : "hover:bg-neutral-400"
              }`
            }
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
