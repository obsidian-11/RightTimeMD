import { Route, Routes } from "react-router";
import { Topbar } from "./components/Topbar";
import { Clinics } from "./clinics";
import { Patient } from "./patient";
import { Clinical } from "./clinical";
import { Support } from "./support";
import { Admin } from "./admin";

export function Home() {
  return (
    <div className="flex h-screen flex-col">
      <Topbar />

      <div className="flex flex-grow">
        <Routes>
          <Route index element={<Clinics />} />
          <Route path="/patient/:id/*" element={<Patient />} />
          <Route path="/support/:id/*" element={<Support />} />
          <Route path="/clinical/:id/*" element={<Clinical />} />
          <Route path="/admin/:id/*" element={<Admin />} />
        </Routes>
      </div>
    </div>
  );
}
