import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

interface PatientFile {
  name: string;
  patientName: string;
  size: string;
  lastModified: string;
}

interface UsePatients {
  patients: PatientFile[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

// Add a standalone function to test bucket access via backend
export async function testBucketAccess() {
  try {
    console.log('🧪 Testing backend patient API...');
    
    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
    const response = await fetch(`${backendUrl}/api/patients?bucketName=FHIR`);
    
    if (!response.ok) {
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    console.log('🧪 Test result:', data);
    
    if (data.success && data.patients) {
      return { 
        success: true, 
        bucketName: 'FHIR', 
        files: data.patients,
        note: `Found ${data.count} patients via backend API with service role access`
      };
    } else {
      return { success: false, error: data.message || 'No patients found' };
    }
    
  } catch (err) {
    console.error('❌ Backend API test failed:', err);
    return { success: false, error: err instanceof Error ? err.message : 'Unknown error' };
  }
}

export function usePatients(clinicId?: string): UsePatients {
  const { user } = useAuth();
  const [patients, setPatients] = useState<PatientFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
      return dateString;
    }
  };

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log(`📋 Fetching patients from backend API for clinic ${clinicId}`);
      console.log(`👤 Current user:`, user?.email);
      
      // Use the backend API endpoint that has service role access
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/patients?bucketName=FHIR`);
      
      if (!response.ok) {
        throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.message || 'Failed to fetch patients');
      }
      
      console.log(`✅ Backend API returned ${data.count} patients`);
      
      // Format the data for our frontend
      const patientFiles = data.patients.map((patient: any) => ({
        name: patient.name,
        patientName: patient.patientName,
        size: formatFileSize(patient.size),
        lastModified: formatDate(patient.lastModified)
      }));

      setPatients(patientFiles);

    } catch (err) {
      console.error('❌ Error fetching patients:', err);
      setError(err instanceof Error ? err.message : 'Unknown error occurred');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const refetch = async () => {
    await fetchPatients();
  };

  useEffect(() => {
    if (user) {
      fetchPatients();
    }
  }, [user, clinicId]);

  return {
    patients,
    loading,
    error,
    refetch
  };
}