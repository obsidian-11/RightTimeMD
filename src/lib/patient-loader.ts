import { supabase } from './supabase';
import type { Patient } from '@/types';

export interface FHIRPatient {
  id: string;
  name?: Array<{
    given?: string[];
    family?: string;
    use?: string;
  }>;
  gender?: string;
  birthDate?: string;
  telecom?: Array<{
    system?: string;
    value?: string;
    use?: string;
  }>;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    use?: string;
  }>;
  contact?: Array<{
    relationship?: Array<{
      coding?: Array<{
        code?: string;
        display?: string;
      }>;
    }>;
    name?: {
      given?: string[];
      family?: string;
    };
    telecom?: Array<{
      system?: string;
      value?: string;
    }>;
  }>;
  extension?: Array<{
    url?: string;
    valueString?: string;
    valueCodeableConcept?: {
      coding?: Array<{
        code?: string;
        display?: string;
      }>;
    };
  }>;
}

export interface PatientWithFHIR {
  patient: Patient;
  fhirPatient: FHIRPatient | null;
  hasMoreFHIRData: boolean;
}

export class PatientLoaderService {
  
  async loadPatientsFromDatabase(clinicId?: string): Promise<Patient[]> {
    try {
      console.log('📋 Loading patients from database...');
      
      let query = supabase.from('patient').select('*');
      
      if (clinicId) {
        query = query.eq('clinic_id', clinicId);
      }
      
      const { data: patients, error } = await query
        .order('created_at', { ascending: false })
        .limit(50); // Limit for performance
      
      if (error) {
        throw new Error(`Database query failed: ${error.message}`);
      }
      
      if (!patients || patients.length === 0) {
        console.log('⚠️ No patients found in database');
        return [];
      }
      
      console.log(`✅ Loaded ${patients.length} patients from database`);
      return patients as Patient[];
      
    } catch (error) {
      console.error('❌ Error loading patients from database:', error);
      
      // If the error is about missing table, provide helpful guidance
      if (error instanceof Error && error.message.includes('Could not find the table')) {
        console.log('💡 Hint: Make sure you have a "patient" table in your Supabase database');
        console.log('💡 You may need to run database migrations or create the table');
      }
      
      throw error;
    }
  }

  async loadPatientsWithFHIRData(clinicId?: string): Promise<PatientWithFHIR[]> {
    try {
      console.log('🔍 Loading patients with FHIR data...');
      
      // Get patients from database
      const patients = await this.loadPatientsFromDatabase(clinicId);
      
      if (patients.length === 0) {
        return [];
      }
      
      // Get FHIR data for patients
      const patientsWithFHIR: PatientWithFHIR[] = [];
      
      for (const patient of patients) {
        try {
          // Check if patient has FHIR data
          const { data: fhirRecords, error: fhirError } = await supabase
            .from('fhir')
            .select('resource_json, resource_type')
            .eq('patient_id', patient.id)
            .eq('resource_type', 'Patient')
            .limit(1);
          
          let fhirPatient: FHIRPatient | null = null;
          
          if (!fhirError && fhirRecords && fhirRecords.length > 0) {
            const fhirRecord = fhirRecords[0];
            
            if (fhirRecord.resource_json) {
              try {
                if (typeof fhirRecord.resource_json === 'string') {
                  fhirPatient = JSON.parse(fhirRecord.resource_json) as FHIRPatient;
                } else {
                  fhirPatient = fhirRecord.resource_json as FHIRPatient;
                }
              } catch (parseError) {
                console.warn(`Failed to parse FHIR data for patient ${patient.id}:`, parseError);
              }
            }
          }
          
          // Check if patient has more FHIR data (encounters, conditions, etc.)
          const { data: moreFhirData } = await supabase
            .from('fhir')
            .select('id')
            .eq('patient_id', patient.id)
            .neq('resource_type', 'Patient')
            .limit(1);
          
          const hasMoreFHIRData = moreFhirData && moreFhirData.length > 0;
          
          patientsWithFHIR.push({
            patient,
            fhirPatient,
            hasMoreFHIRData: !!hasMoreFHIRData
          });
          
        } catch (patientError) {
          console.warn(`Error processing patient ${patient.id}:`, patientError);
          // Add patient without FHIR data
          patientsWithFHIR.push({
            patient,
            fhirPatient: null,
            hasMoreFHIRData: false
          });
        }
      }
      
      console.log(`✅ Loaded ${patientsWithFHIR.length} patients with FHIR data`);
      return patientsWithFHIR;
      
    } catch (error) {
      console.error('❌ Error loading patients with FHIR data:', error);
      throw error;
    }
  }

  extractPatientDetailsFromFHIR(fhirPatient: FHIRPatient): Partial<Patient> {
    try {
      // Extract name
      let firstname = '';
      let lastname = '';
      
      if (fhirPatient.name && fhirPatient.name.length > 0) {
        const officialName = fhirPatient.name.find(n => n.use === 'official') || fhirPatient.name[0];
        if (officialName) {
          firstname = officialName.given?.join(' ') || '';
          lastname = officialName.family || '';
        }
      }
      
      // Extract gender
      const sex = fhirPatient.gender === 'male' ? 'male' : 
                  fhirPatient.gender === 'female' ? 'female' : 'other';
      
      // Extract birth date
      let date_of_birth: Date | undefined;
      if (fhirPatient.birthDate) {
        date_of_birth = new Date(fhirPatient.birthDate);
      }
      
      // Extract phone numbers
      let phone_primary = '';
      let phone_secondary = '';
      
      if (fhirPatient.telecom) {
        const phones = fhirPatient.telecom.filter(t => t.system === 'phone');
        if (phones.length > 0) {
          phone_primary = phones[0].value || '';
          if (phones.length > 1) {
            phone_secondary = phones[1].value || '';
          }
        }
      }
      
      // Extract email
      let email = '';
      if (fhirPatient.telecom) {
        const emailContact = fhirPatient.telecom.find(t => t.system === 'email');
        if (emailContact) {
          email = emailContact.value || '';
        }
      }
      
      // Extract address
      let street = '';
      let city = '';
      let state = '';
      let zip: number | undefined;
      const suite = '';
      
      if (fhirPatient.address && fhirPatient.address.length > 0) {
        const primaryAddress = fhirPatient.address.find(a => a.use === 'home') || fhirPatient.address[0];
        if (primaryAddress) {
          street = primaryAddress.line?.join(' ') || '';
          city = primaryAddress.city || '';
          state = primaryAddress.state || '';
          if (primaryAddress.postalCode) {
            const zipCode = parseInt(primaryAddress.postalCode.replace(/[^\d]/g, ''));
            if (!isNaN(zipCode)) {
              zip = zipCode;
            }
          }
        }
      }
      
      // Extract emergency contact
      let emergency_contact_name = '';
      let emergency_contact_phone = '';
      
      if (fhirPatient.contact && fhirPatient.contact.length > 0) {
        const emergencyContact = fhirPatient.contact.find(c => 
          c.relationship?.some(r => 
            r.coding?.some(coding => 
              coding.code === 'C' || coding.display?.toLowerCase().includes('emergency')
            )
          )
        ) || fhirPatient.contact[0];
        
        if (emergencyContact) {
          if (emergencyContact.name) {
            const contactGiven = emergencyContact.name.given?.join(' ') || '';
            const contactFamily = emergencyContact.name.family || '';
            emergency_contact_name = `${contactGiven} ${contactFamily}`.trim();
          }
          
          if (emergencyContact.telecom) {
            const contactPhone = emergencyContact.telecom.find(t => t.system === 'phone');
            if (contactPhone) {
              emergency_contact_phone = contactPhone.value || '';
            }
          }
        }
      }
      
      return {
        firstname,
        lastname,
        sex,
        date_of_birth,
        phone_primary,
        phone_secondary,
        email,
        street,
        city,
        state,
        zip,
        suite,
        emergency_contact_name,
        emergency_contact_phone,
      };
      
    } catch (error) {
      console.error('Error extracting patient details from FHIR:', error);
      return {};
    }
  }

  mergePatientWithFHIR(patient: Patient, fhirPatient: FHIRPatient | null): Patient {
    if (!fhirPatient) {
      return patient;
    }
    
    const fhirDetails = this.extractPatientDetailsFromFHIR(fhirPatient);
    
    // Merge, preferring FHIR data when available, but keeping database data as fallback
    return {
      ...patient,
      ...Object.fromEntries(
        Object.entries(fhirDetails).filter(([_, value]) => 
          value !== undefined && value !== '' && value !== null
        )
      )
    } as Patient;
  }

  async getEnhancedPatients(clinicId?: string): Promise<Patient[]> {
    try {
      console.log('🚀 Loading enhanced patients with FHIR data...');
      
      const patientsWithFHIR = await this.loadPatientsWithFHIRData(clinicId);
      
      const enhancedPatients = patientsWithFHIR.map(({ patient, fhirPatient }) => {
        const enhancedPatient = this.mergePatientWithFHIR(patient, fhirPatient);
        
        // Add indicator if patient has FHIR data available
        return {
          ...enhancedPatient,
          hasFHIRData: !!fhirPatient
        } as Patient & { hasFHIRData: boolean };
      });
      
      console.log(`✅ Enhanced ${enhancedPatients.length} patients with FHIR data`);
      return enhancedPatients;
      
    } catch (error) {
      console.error('❌ Error getting enhanced patients:', error);
      throw error;
    }
  }

  async getAvailableFHIRFiles(): Promise<string[]> {
    try {
      console.log('📁 Getting available FHIR files from storage...');
      
      const { data: files, error } = await supabase.storage
        .from('FHIR')
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
        
      if (error) {
        throw new Error(`Storage error: ${error.message}`);
      }
      
      if (!files) {
        return [];
      }
      
      const jsonFiles = files
        .filter(file => file.name.endsWith('.json') && file.name !== '.emptyFolderPlaceholder')
        .map(file => file.name);
      
      console.log(`✅ Found ${jsonFiles.length} FHIR files in storage`);
      return jsonFiles;
      
    } catch (error) {
      console.error('❌ Error getting FHIR files:', error);
      return [];
    }
  }
}

export const patientLoaderService = new PatientLoaderService();