// if using FHIR R4 classes
import { fhirR4, BundleUtils, ResourceUtils } from '@smile-cdr/fhirts';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load a patient from the fhir directory
async function loadPatientFromFile(): Promise<fhirR4.Patient | null> {
    try {
        // Read the first FHIR file from the fhir directory
        const fhirFilePath = join('./fhir', 'Clemente531_Hagenes547_997c14c0-1295-bbe2-0762-6cf052c7a05b.json');
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
            
            console.log('\n=== All Resources in Arrays ===');
            
            // Convert all resource types to actual resource arrays
            const patientsArray = patients.map((entry: any) => entry.resource);
            const observationsArray = observations.map((entry: any) => entry.resource);
            const conditionsArray = conditions.map((entry: any) => entry.resource);
            const proceduresArray = procedures.map((entry: any) => entry.resource);
            const encountersArray = encounters.map((entry: any) => entry.resource);
            const medicationRequestsArray = medicationRequests.map((entry: any) => entry.resource);
            const diagnosticReportsArray = diagnosticReports.map((entry: any) => entry.resource);
            const immunizationsArray = immunizations.map((entry: any) => entry.resource);
            
            console.log('\n--- Patients Array ---');
            console.log(`Patient Names (${patientsArray.length}):`, patientsArray.map(p => 
                `${p.name?.[0]?.given?.join(' ')} ${p.name?.[0]?.family}`
            ));
            
            console.log('\n--- Observations Array ---');
            console.log(`Observation Codes with Values (${observationsArray.length}):`, observationsArray.map(o => {
                const code = o.code?.coding?.[0]?.display || o.code?.text;
                let value = 'N/A';
                
                // Extract different types of values
                if (o.valueQuantity?.value !== undefined) {
                    value = `${o.valueQuantity.value} ${o.valueQuantity.unit || ''}`.trim();
                } else if (o.valueString) {
                    value = o.valueString;
                } else if (o.valueCodeableConcept?.coding?.[0]?.display) {
                    value = o.valueCodeableConcept.coding[0].display;
                } else if (o.valueCodeableConcept?.text) {
                    value = o.valueCodeableConcept.text;
                } else if (o.valueBoolean !== undefined) {
                    value = o.valueBoolean.toString();
                } else if (o.valueDateTime) {
                    value = o.valueDateTime;
                } else if (o.valueInteger !== undefined) {
                    value = o.valueInteger.toString();
                } else if (o.valueDecimal !== undefined) {
                    value = o.valueDecimal.toString();
                } else if (o.component && o.component.length > 0) {
                    // Handle multi-component observations (like blood pressure)
                    const components = o.component.map(comp => {
                        const compCode = comp.code?.coding?.[0]?.display || comp.code?.text;
                        let compValue = 'N/A';
                        if (comp.valueQuantity?.value !== undefined) {
                            compValue = `${comp.valueQuantity.value} ${comp.valueQuantity.unit || ''}`.trim();
                        }
                        return `${compCode}: ${compValue}`;
                    }).join(', ');
                    value = components;
                }
                
                return code ? `${code}: ${value}` : null;
            }).filter(Boolean));
            
            console.log('\n--- Conditions Array ---');
            console.log(`Condition Codes (${conditionsArray.length}):`, conditionsArray.map(c => 
                c.code?.coding?.[0]?.display || c.code?.text
            ).filter(Boolean));
            
            console.log('\n--- Procedures Array ---');
            console.log(`Procedure Codes (${proceduresArray.length}):`, proceduresArray.map(p => 
                p.code?.coding?.[0]?.display || p.code?.text
            ).filter(Boolean));
            
            console.log('\n--- Encounters Array ---');
            console.log(`Encounter Types with Details (${encountersArray.length}):`, encountersArray.map(e => {
                const type = e.type?.[0]?.coding?.[0]?.display;
                let details = '';
                
                // Check for description or reason codes
                if (e.reasonCode && e.reasonCode.length > 0) {
                    const reasons = e.reasonCode.map(rc => 
                        rc.coding?.[0]?.display || rc.text
                    ).filter(Boolean).join(', ');
                    details += ` (Reason: ${reasons})`;
                }
                
                // Check for diagnosis
                if (e.diagnosis && e.diagnosis.length > 0) {
                    details += ` (${e.diagnosis.length} diagnosis/diagnoses)`;
                }
                
                // Check for encounter class details
                if (e.class?.display && e.class.display !== type) {
                    details += ` (Class: ${e.class.display})`;
                }
                
                // Check for service type
                if (e.serviceType?.coding?.[0]?.display) {
                    details += ` (Service: ${e.serviceType.coding[0].display})`;
                }
                
                // Check for priority
                if (e.priority?.coding?.[0]?.display) {
                    details += ` (Priority: ${e.priority.coding[0].display})`;
                }
                
                // Check for status description
                if (e.statusHistory && e.statusHistory.length > 0) {
                    details += ` (Status history: ${e.statusHistory.length} entries)`;
                }
                
                return type ? `${type}${details}` : null;
            }).filter(Boolean));
            
            console.log('\n--- MedicationRequests Array ---');
            console.log(`Medication Names (${medicationRequestsArray.length}):`, medicationRequestsArray.map(m => 
                m.medicationCodeableConcept?.coding?.[0]?.display || m.medicationCodeableConcept?.text
            ).filter(Boolean));
            
            console.log('\n--- Immunizations Array ---');
            console.log(`Vaccine Codes (${immunizationsArray.length}):`, immunizationsArray.map(i => 
                i.vaccineCode?.coding?.[0]?.display || i.vaccineCode?.text
            ).filter(Boolean));
            
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