import { useAuth } from "@/hooks";
import { supabase } from "@/lib/supabase";
import { useQuery } from "@tanstack/react-query";
import { useParams, Link } from "react-router";

export function ClinicDetail() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();

  const { status, data, error } = useQuery({
    queryKey: ["clinic", id],
    queryFn: async () => {
      if (!id) throw new Error("Clinic ID is required");

      // Get clinic details
      const { data: clinic, error: clinicError } = await supabase
        .from("clinic")
        .select("*")
        .eq("id", id)
        .single();

      if (clinicError) throw clinicError;

      // Get user's relationship to this clinic
      const [patientResult, staffResult] = await Promise.all([
        supabase
          .from("patient")
          .select("*")
          .eq("uid", user?.id)
          .eq("clinic_id", id),
        supabase
          .from("staff")
          .select("*")
          .eq("uid", user?.id)
          .eq("clinic_id", id)
      ]);

      return {
        clinic,
        patientRecord: patientResult.data?.[0],
        staffRecord: staffResult.data?.[0],
        userRole: staffResult.data?.[0] ? 'staff' : patientResult.data?.[0] ? 'patient' : null
      };
    },
    enabled: !!id && !!user
  });

  if (status === "pending") {
    return (
      <div className="p-6">
        <p>Loading clinic details...</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="p-6">
        <p className="text-red-600">Error loading clinic: {error?.message}</p>
        <Link to="/dashboard" className="text-blue-600 hover:underline">
          ← Back to clinics
        </Link>
      </div>
    );
  }

  const { clinic, patientRecord, staffRecord, userRole } = data;

  return (
    <div className="p-6 max-w-4xl">
      <div className="mb-6">
        <Link to="/dashboard" className="text-blue-600 hover:underline mb-4 inline-block">
          ← Back to My Clinics
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">{clinic.name}</h1>
        <p className="text-lg text-gray-600">{clinic.type}</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Clinic Information */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Clinic Information</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-gray-700">Name:</span>
              <p className="text-gray-900">{clinic.name}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Type:</span>
              <p className="text-gray-900">{clinic.type}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Email:</span>
              <p className="text-gray-900">{clinic.email}</p>
            </div>
            <div>
              <span className="font-medium text-gray-700">Phone:</span>
              <p className="text-gray-900">{clinic.phone_number}</p>
            </div>
            {clinic.fax_number && (
              <div>
                <span className="font-medium text-gray-700">Fax:</span>
                <p className="text-gray-900">{clinic.fax_number}</p>
              </div>
            )}
          </div>
        </div>

        {/* Address Information */}
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-gray-800">Address</h2>
          <div className="space-y-2">
            <p className="text-gray-900">{clinic.street}</p>
            {clinic.suite && <p className="text-gray-900">{clinic.suite}</p>}
            <p className="text-gray-900">
              {clinic.city}, {clinic.state} {clinic.zip}
            </p>
          </div>
        </div>

        {/* Healthcare IDs */}
        {(clinic.hin || clinic.medicare_id || clinic.medicaid_id) && (
          <div className="bg-white border rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Healthcare Identifiers</h2>
            <div className="space-y-3">
              {clinic.hin && (
                <div>
                  <span className="font-medium text-gray-700">HIN:</span>
                  <p className="text-gray-900">{clinic.hin}</p>
                </div>
              )}
              {clinic.medicare_id && (
                <div>
                  <span className="font-medium text-gray-700">Medicare ID:</span>
                  <p className="text-gray-900">{clinic.medicare_id}</p>
                </div>
              )}
              {clinic.medicaid_id && (
                <div>
                  <span className="font-medium text-gray-700">Medicaid ID:</span>
                  <p className="text-gray-900">{clinic.medicaid_id}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* User's Role */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">My Role</h2>
          <div className="space-y-3">
            <div>
              <span className="font-medium text-blue-700">Status:</span>
              <p className="text-blue-900 capitalize">{userRole || 'No active role'}</p>
            </div>
            {staffRecord && (
              <>
                <div>
                  <span className="font-medium text-blue-700">Name:</span>
                  <p className="text-blue-900">{staffRecord.firstname} {staffRecord.lastname}</p>
                </div>
                {staffRecord.permissions && (
                  <div>
                    <span className="font-medium text-blue-700">Permissions:</span>
                    <p className="text-blue-900">{JSON.stringify(staffRecord.permissions)}</p>
                  </div>
                )}
              </>
            )}
            {patientRecord && (
              <>
                <div>
                  <span className="font-medium text-blue-700">Name:</span>
                  <p className="text-blue-900">{patientRecord.firstname} {patientRecord.lastname}</p>
                </div>
                <div>
                  <span className="font-medium text-blue-700">MRN:</span>
                  <p className="text-blue-900">{patientRecord.mrn}</p>
                </div>
              </>
            )}
            <div>
              <span className="font-medium text-blue-700">Member since:</span>
              <p className="text-blue-900">
                {new Date((staffRecord || patientRecord)?.created_at).toLocaleDateString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional clinic metadata */}
      <div className="mt-6 bg-gray-50 border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">Clinic Details</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Clinic ID:</span>
            <p className="text-gray-600">{clinic.id}</p>
          </div>
          <div>
            <span className="font-medium text-gray-700">Established:</span>
            <p className="text-gray-600">{new Date(clinic.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}