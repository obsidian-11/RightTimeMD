// if using FHIR R4 classes
import { fhirR4, BundleUtils, ResourceUtils } from '@smile-cdr/fhirts';
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
                    
                    console.log('=== Patient Information ===');
                    console.log('ID:', patient.id);
                    
                    // Name information
                    if (patient.name && patient.name.length > 0) {
                        const name = patient.name[0];
                        console.log('Name:', `${name.given?.join(' ')} ${name.family}`);
                        console.log('Name use:', name.use);
                    }
                    
                    // Demographics
                    console.log('Gender:', patient.gender);
                    console.log('Birth Date:', patient.birthDate);
                    
                    // Address
                    if (patient.address && patient.address.length > 0) {
                        const address = patient.address[0];
                        console.log('Address:', `${address.line?.join(', ')}, ${address.city}, ${address.state} ${address.postalCode}`);
                    }
                    
                    // Phone/Contact
                    if (patient.telecom && patient.telecom.length > 0) {
                        console.log('Contact Info:');
                        patient.telecom.forEach(contact => {
                            console.log(`  ${contact.system}: ${contact.value} (${contact.use})`);
                        });
                    }
                    
                    // Extensions (race, ethnicity, etc.)
                    if (patient.extension && patient.extension.length > 0) {
                        console.log('Extensions:');
                        patient.extension.forEach(ext => {
                            if (ext.url?.includes('us-core-race')) {
                                const raceExt = ext.extension?.find(e => e.url === 'ombCategory');
                                console.log(`  Race: ${raceExt?.valueCoding?.display}`);
                            } else if (ext.url?.includes('us-core-ethnicity')) {
                                const ethnicityExt = ext.extension?.find(e => e.url === 'ombCategory');
                                console.log(`  Ethnicity: ${ethnicityExt?.valueCoding?.display}`);
                            } else if (ext.url?.includes('us-core-birthsex')) {
                                console.log(`  Birth Sex: ${ext.valueCode}`);
                            } else if (ext.url?.includes('patient-mothersMaidenName')) {
                                console.log(`  Mother's Maiden Name: ${ext.valueString}`);
                            }
                        });
                    }
                    
                    // Identifiers
                    if (patient.identifier && patient.identifier.length > 0) {
                        console.log('Identifiers:');
                        patient.identifier.forEach(id => {
                            console.log(`  ${id.type?.text || id.system}: ${id.value}`);
                        });
                    }
                    
                    console.log('===========================');
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

// Demonstrate BundleUtils and ResourceUtils
async function demonstrateUtils(): Promise<void> {
    try {
        const fhirFilePath = join('./fhir', 'Abel832_Zieme486_9f5247cc-6762-3d1d-ebc6-29bf03f921e4.json');
        const fileContent = readFileSync(fhirFilePath, 'utf8');
        const bundle: fhirR4.Bundle = JSON.parse(fileContent);
        
        console.log('\n=== BundleUtils Examples ===');
        
        // Initialize BundleUtils
        const bundleUtils = new BundleUtils();
        
        if (bundle.entry) {
            // Get all Patient resources from the bundle
            const patients = bundleUtils.getResources(bundle.entry, 'Patient');
            console.log(`Found ${patients.length} Patient resource(s)`);
            
            // Get all Observation resources from the bundle
            const observations = bundleUtils.getResources(bundle.entry, 'Observation');
            console.log(`Found ${observations.length} Observation resource(s)`);
            
            // Get all Condition resources from the bundle
            const conditions = bundleUtils.getResources(bundle.entry, 'Condition');
            console.log(`Found ${conditions.length} Condition resource(s)`);
            
            // Get all Procedure resources from the bundle
            const procedures = bundleUtils.getResources(bundle.entry, 'Procedure');
            console.log(`Found ${procedures.length} Procedure resource(s)`);
            
            // Get all Encounter resources from the bundle
            const encounters = bundleUtils.getResources(bundle.entry, 'Encounter');
            console.log(`Found ${encounters.length} Encounter resource(s)`);
            
            // Get all MedicationRequest resources from the bundle
            const medicationRequests = bundleUtils.getResources(bundle.entry, 'MedicationRequest');
            console.log(`Found ${medicationRequests.length} MedicationRequest resource(s)`);
            
            // Get all DiagnosticReport resources from the bundle
            const diagnosticReports = bundleUtils.getResources(bundle.entry, 'DiagnosticReport');
            console.log(`Found ${diagnosticReports.length} DiagnosticReport resource(s)`);
            
            // Get all Immunization resources from the bundle
            const immunizations = bundleUtils.getResources(bundle.entry, 'Immunization');
            console.log(`Found ${immunizations.length} Immunization resource(s)`);
            
            // Get a specific resource by ID (if we know one exists)
            const patientId = '9f5247cc-6762-3d1d-ebc6-29bf03f921e4';
            const specificPatient = bundleUtils.getResource(bundle.entry, patientId);
            if (specificPatient) {
                console.log(`Retrieved specific patient by ID: ${specificPatient.id}`);
            }
            
            // Get resource by full URL
            const fullUrl = 'urn:uuid:9f5247cc-6762-3d1d-ebc6-29bf03f921e4';
            const patientByUrl = bundleUtils.getResourceByFullUrl(bundle.entry, fullUrl);
            if (patientByUrl) {
                console.log(`Retrieved patient by full URL: ${patientByUrl.id}`);
            }
        }
        
        console.log('\n=== ResourceUtils Examples ===');
        
        // Initialize ResourceUtils
        const resourceUtils = new ResourceUtils();
        
        // Get patients again for ResourceUtils examples
        const patientEntries = bundleUtils.getResources(bundle.entry || [], 'Patient');
        const patientFromBundleUtils = (patientEntries[0] as any)?.resource as fhirR4.Patient;
        
        // Try direct access vs BundleUtils
        const directPatient = bundle.entry?.find(e => e.resource?.resourceType === 'Patient')?.resource as fhirR4.Patient;
        
        if (directPatient) {
            console.log('\n--- Using DirectPatient (not from BundleUtils) ---');
            
            // Get specific properties from direct patient
            const directGender = resourceUtils.getResourceProperty(directPatient, 'gender');
            console.log(`Direct patient gender via ResourceUtils: ${directGender}`);
            
            const directBirthDate = resourceUtils.getResourceProperty(directPatient, 'birthDate');
            console.log(`Direct patient birth date via ResourceUtils: ${directBirthDate}`);
            
            // Get identifiers by property from direct patient
            if (directPatient.identifier) {
                const officialIdentifiers = resourceUtils.getIdentifiersByProperty(directPatient.identifier, 'use', 'official');
                console.log(`Found ${officialIdentifiers.length} official identifier(s) from direct patient`);
                
                const ssnIdentifiers = resourceUtils.getIdentifiersByProperty(directPatient.identifier, 'system', 'http://hl7.org/fhir/sid/us-ssn');
                console.log(`Found ${ssnIdentifiers.length} SSN identifier(s) from direct patient`);
            }
            
            // Get extensions by URL from direct patient
            if (directPatient.extension) {
                const raceExtensions = resourceUtils.getExtensionsByUrl(directPatient.extension, 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race');
                console.log(`Found ${raceExtensions.length} race extension(s) from direct patient`);
                
                const ethnicityExtensions = resourceUtils.getExtensionsByUrl(directPatient.extension, 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity');
                console.log(`Found ${ethnicityExtensions.length} ethnicity extension(s) from direct patient`);
            }
            
            // Get values at resource path from direct patient
            const nameValues = resourceUtils.getValuesAtResourcePath(directPatient, 'Patient.name.given');
            console.log(`Name values at path from direct patient: ${nameValues.join(', ')}`);
            
            const familyValues = resourceUtils.getValuesAtResourcePath(directPatient, 'Patient.name.family');
            console.log(`Family name values at path from direct patient: ${familyValues.join(', ')}`);
            
            // Get all references from direct patient
            const references = resourceUtils.getAllReferencesFromResource(directPatient);
            console.log(`Found ${references.length} reference(s) in direct patient resource`);
            references.forEach(ref => console.log(`  Reference: ${ref}`));
        }
        
        console.log('\n--- Using BundleUtils Patient (corrected) ---');
        
        if (patientFromBundleUtils) {
            // Get specific properties
            const gender = resourceUtils.getResourceProperty(patientFromBundleUtils, 'gender');
            console.log(`BundleUtils patient gender via ResourceUtils: ${gender}`);
            
            const birthDate = resourceUtils.getResourceProperty(patientFromBundleUtils, 'birthDate');
            console.log(`BundleUtils patient birth date via ResourceUtils: ${birthDate}`);
            
            // Get identifiers by property
            if (patientFromBundleUtils.identifier) {
                const officialIdentifiers = resourceUtils.getIdentifiersByProperty(patientFromBundleUtils.identifier, 'use', 'official');
                console.log(`Found ${officialIdentifiers.length} official identifier(s) from BundleUtils patient`);
                
                const ssnIdentifiers = resourceUtils.getIdentifiersByProperty(patientFromBundleUtils.identifier, 'system', 'http://hl7.org/fhir/sid/us-ssn');
                console.log(`Found ${ssnIdentifiers.length} SSN identifier(s) from BundleUtils patient`);
            }
            
            // Get extensions by URL
            if (patientFromBundleUtils.extension) {
                const raceExtensions = resourceUtils.getExtensionsByUrl(patientFromBundleUtils.extension, 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-race');
                console.log(`Found ${raceExtensions.length} race extension(s) from BundleUtils patient`);
                
                const ethnicityExtensions = resourceUtils.getExtensionsByUrl(patientFromBundleUtils.extension, 'http://hl7.org/fhir/us/core/StructureDefinition/us-core-ethnicity');
                console.log(`Found ${ethnicityExtensions.length} ethnicity extension(s) from BundleUtils patient`);
            }
            
            // Get values at resource path
            const nameValues = resourceUtils.getValuesAtResourcePath(patientFromBundleUtils, 'Patient.name.given');
            console.log(`Name values at path from BundleUtils patient: ${nameValues.join(', ')}`);
            
            const familyValues = resourceUtils.getValuesAtResourcePath(patientFromBundleUtils, 'Patient.name.family');
            console.log(`Family name values at path from BundleUtils patient: ${familyValues.join(', ')}`);
            
            // Get all references from resource
            const references = resourceUtils.getAllReferencesFromResource(patientFromBundleUtils);
            console.log(`Found ${references.length} reference(s) in BundleUtils patient resource`);
            references.forEach(ref => console.log(`  Reference: ${ref}`));
        }
        
        console.log('=============================');
        
    } catch (error) {
        console.error('Error demonstrating utils:', error);
    }
}

// Example usage
loadPatientFromFile().then(patient => {
    if (patient) {
        console.log('Successfully loaded patient with ID:', patient.id);
    }
}).then(() => {
    // Demonstrate the utility functions
    return demonstrateUtils();
});