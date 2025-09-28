import { Sidenav } from "../components";
import { Routes, Route } from "react-router";
import {
  Dashboard,
  Patients,
  Appointments,
  FHIRQuery,
  PatientDetail,
} from "./subpages";

export function Clinical() {
  return (
    <div className="flex h-full flex-1 gap-2">
      <Sidenav type="clinical" />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="patients" element={<Patients />} />
            <Route path="patients/:patientId" element={<PatientDetail />} />
            <Route path="appointments" element={<Appointments />} />
            <Route path="fhir-query" element={<FHIRQuery />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
