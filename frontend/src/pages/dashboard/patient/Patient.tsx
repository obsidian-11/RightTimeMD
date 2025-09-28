import { Sidenav } from "../components";
import { Routes, Route } from "react-router";
import { Dashboard } from "./subpages";

export function Patient() {
  return (
    <div className="flex flex-1 gap-2">
      <Sidenav type="patient" />
      <div className="flex-1 p-4">
        <Routes>
          <Route index element={<Dashboard />} />
          <Route path="medical-history" element={<></>} />
          <Route path="medications" element={<></>} />
          <Route path="appointments" element={<></>} />
          <Route path="health-data" element={<></>} />
        </Routes>
      </div>
    </div>
  );
}
