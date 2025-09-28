import { Sidenav } from "../components";
import { Routes, Route } from "react-router";
import {
  Dashboard,
  MedicalHistory,
  Medications,
  HealthData,
  Appointments,
} from "./subpages";

export function Patient() {
  return (
    <div className="flex h-full flex-1 gap-2">
      <Sidenav type="patient" />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="medical-history" element={<MedicalHistory />} />
            <Route path="medications" element={<Medications />} />
            <Route path="health-data" element={<HealthData />} />
            <Route path="appointments" element={<Appointments />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
