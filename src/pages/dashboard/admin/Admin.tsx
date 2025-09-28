import { Sidenav } from "../components";
import { Routes, Route } from "react-router";
import { Dashboard, Staff, Patients, Settings, Logs } from "./subpages";

export function Admin() {
  return (
    <div className="flex h-full flex-1 gap-2">
      <Sidenav type="admin" />
      <div className="flex-1 overflow-hidden">
        <div className="h-full overflow-y-auto">
          <Routes>
            <Route index element={<Dashboard />} />
            <Route path="staff" element={<Staff />} />
            <Route path="patients" element={<Patients />} />
            <Route path="settings" element={<Settings />} />
            <Route path="logs" element={<Logs />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}
