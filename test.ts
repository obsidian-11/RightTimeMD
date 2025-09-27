// if using FHIR R4 classes
import { fhirR4 } from '@smile-cdr/fhirts';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load a patient from the fhir directory
async function loadPatientFromFile(): Promise<fhirR4.Patient | null> {
    try {
        // Read the first FHIR file from the fhir directory
        const fhirFilePath = join('./fhir', 'Abel832_Zieme486_9f5247cc-6762-3d1d-ebc6-29bf03f921e4.json');
        const fileContent = readFileSync(fhirFilePath, 'utf8');
        const bundle: fhirR4.Bundle = JSON.parse(fileContent);
        
        // Find the Patient resource in the bundle
        if (bundle.entry) {
            for (const entry of bundle.entry) {
                if (entry.resource && entry.resource.resourceType === 'Patient') {
                    const patient = entry.resource as fhirR4.Patient;
                    console.log('Loaded patient:', patient.id);
                    console.log('Patient name:', patient.name?.[0]?.given?.[0], patient.name?.[0]?.family);
                    return patient;
                }
            }
        }
        
        console.log('No Patient resource found in bundle');
        return null;
    } catch (error) {
        console.error('Error loading patient:', error);
        return null;
    }
}

function getResourceType(resource: fhirR4.Resource) {
    if (resource.resourceType === 'CarePlan') {
        resource
    } 
}

// Example usage
loadPatientFromFile().then(patient => {
    if (patient) {
        console.log('Successfully loaded patient with ID:', patient.id);
    }
});