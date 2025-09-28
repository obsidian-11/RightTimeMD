import { useAuth } from "@/hooks";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router";

export function Clinics() {
  const { user } = useAuth();

  const { status, data, error } = useQuery({
    queryKey: ["clinics"],
    queryFn: async () => {
      const patientClinics = await supabase
        .from("patient")
        .select(
          `
          *,
          clinic:clinic_id (
            id,
            name,
            type,
            email,
            phone_number,
            street,
            city,
            state,
            zip
          )
        `,
        )
        .eq("id", user?.id);

      const staffClinics = await supabase
        .from("staff")
        .select(
          `
          *,
          clinic:clinic_id (
            id,
            name,
            type,
            email,
            phone_number,
            street,
            city,
            state,
            zip
          )
        `,
        )
        .eq("id", user?.id);

      return {
        patientClinics: patientClinics.data || [],
        staffClinics: staffClinics.data || [],
      };
    },
  });

  return (
    <div className="p-3">
      <h1>My Clinics</h1>
      {status === "pending" ? (
        <p>Loading...</p>
      ) : status === "error" ? (
        <p>Error: {JSON.stringify(error)}</p>
      ) : (
        <div>
          {data.patientClinics.length > 0 && (
            <div>
              <h2>Patient</h2>
              {data.patientClinics.map((record: any) => (
                <Link
                  to={`/dashboard/patient/${record.clinic.id}`}
                  key={record.id}
                >
                  <div className="mb-2 border p-4">
                    <h3>{record.clinic.name}</h3>
                    <p>Type: {record.clinic.type}</p>
                    <p>
                      Address: {record.clinic.street}, {record.clinic.city},{" "}
                      {record.clinic.state} {record.clinic.zip}
                    </p>
                    <p>Phone: {record.clinic.phone_number}</p>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {data.staffClinics.length > 0 && (
            <div>
              <h2>Staff</h2>
              {data.staffClinics.map((record: any) => (
                <Link
                  to={`/dashboard/${record.type}/${record.clinic.id}`}
                  key={record.id}
                >
                  <div className="mb-2 border p-4">
                    <h3>{record.clinic.name}</h3>
                    <p>Type: {record.clinic.type}</p>
                    <p>My Role: {record.type} Staff</p>
                    <p>
                      Address: {record.clinic.street}, {record.clinic.city},{" "}
                      {record.clinic.state} {record.clinic.zip}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
