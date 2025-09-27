// if using FHIR R4 classes
import { fhirR4, BundleUtils, ResourceUtils } from '@smile-cdr/fhirts';
import { readFileSync, writeFileSync } from 'fs';
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
                    return patient;
                }
            }
        }
        
        return null;
    } catch (error) {
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
        
        // Initialize BundleUtils
        const bundleUtils = new BundleUtils();
        
        if (bundle.entry) {
            // Get all Patient resources from the bundle
            const patients = bundleUtils.getResources(bundle.entry, 'Patient');
            
            // Get all Observation resources from the bundle
            const observations = bundleUtils.getResources(bundle.entry, 'Observation');
            
            // Get all Condition resources from the bundle
            const conditions = bundleUtils.getResources(bundle.entry, 'Condition');
            
            // Get all Procedure resources from the bundle
            const procedures = bundleUtils.getResources(bundle.entry, 'Procedure');
            
            // Get all Encounter resources from the bundle
            const encounters = bundleUtils.getResources(bundle.entry, 'Encounter');
            
            // Get all MedicationRequest resources from the bundle
            const medicationRequests = bundleUtils.getResources(bundle.entry, 'MedicationRequest');
            
            // Get all DiagnosticReport resources from the bundle
            const diagnosticReports = bundleUtils.getResources(bundle.entry, 'DiagnosticReport');
            
            // Get all Immunization resources from the bundle
            const immunizations = bundleUtils.getResources(bundle.entry, 'Immunization');
            
            // Convert all resource types to actual resource arrays
            const patientsArray = patients.map((entry: any) => entry.resource);
            const observationsArray = observations.map((entry: any) => entry.resource);
            const conditionsArray = conditions.map((entry: any) => entry.resource);
            const proceduresArray = procedures.map((entry: any) => entry.resource);
            const encountersArray = encounters.map((entry: any) => entry.resource);
            const medicationRequestsArray = medicationRequests.map((entry: any) => entry.resource);
            const diagnosticReportsArray = diagnosticReports.map((entry: any) => entry.resource);
            const immunizationsArray = immunizations.map((entry: any) => entry.resource);
            
            // Create JSON structure
            const fhirData = {
                patients: patientsArray.map(p => ({
                    name: `${p.name?.[0]?.given?.join(' ')} ${p.name?.[0]?.family}`,
                    gender: p.gender,
                    birthDate: p.birthDate,
                    id: p.id
                })),
                
                observations: observationsArray.map(o => {
                    const observation: any = {
                        id: o.id,
                        status: o.status,
                        category: o.category?.map(cat => cat.coding?.[0]?.display || cat.text).filter(Boolean),
                        code: o.code?.coding?.[0]?.display || o.code?.text,
                        effectiveDateTime: o.effectiveDateTime,
                        issued: o.issued,
                        subject: o.subject?.reference
                    };
                    
                    // Extract different types of values
                    if (o.valueQuantity?.value !== undefined) {
                        observation.value = `${o.valueQuantity.value} ${o.valueQuantity.unit || ''}`.trim();
                        observation.valueQuantity = {
                            value: o.valueQuantity.value,
                            unit: o.valueQuantity.unit,
                            system: o.valueQuantity.system,
                            code: o.valueQuantity.code
                        };
                    } else if (o.valueString) {
                        observation.value = o.valueString;
                        observation.valueString = o.valueString;
                    } else if (o.valueCodeableConcept?.coding?.[0]?.display) {
                        observation.value = o.valueCodeableConcept.coding[0].display;
                        observation.valueCodeableConcept = {
                            coding: o.valueCodeableConcept.coding,
                            text: o.valueCodeableConcept.text
                        };
                    } else if (o.valueCodeableConcept?.text) {
                        observation.value = o.valueCodeableConcept.text;
                        observation.valueCodeableConcept = {
                            coding: o.valueCodeableConcept.coding,
                            text: o.valueCodeableConcept.text
                        };
                    } else if (o.valueBoolean !== undefined) {
                        observation.value = o.valueBoolean.toString();
                        observation.valueBoolean = o.valueBoolean;
                    } else if (o.valueDateTime) {
                        observation.value = o.valueDateTime;
                        observation.valueDateTime = o.valueDateTime;
                    } else if (o.valueInteger !== undefined) {
                        observation.value = o.valueInteger.toString();
                        observation.valueInteger = o.valueInteger;
                    } else if (o.valueDecimal !== undefined) {
                        observation.value = o.valueDecimal.toString();
                        observation.valueDecimal = o.valueDecimal;
                    } else if (o.component && o.component.length > 0) {
                        // Handle multi-component observations (like blood pressure)
                        observation.components = o.component.map(comp => ({
                            code: comp.code?.coding?.[0]?.display || comp.code?.text,
                            valueQuantity: comp.valueQuantity ? {
                                value: comp.valueQuantity.value,
                                unit: comp.valueQuantity.unit,
                                system: comp.valueQuantity.system,
                                code: comp.valueQuantity.code
                            } : undefined,
                            valueString: comp.valueString,
                            valueCodeableConcept: comp.valueCodeableConcept
                        }));
                        // Create summary value for multi-component
                        const componentSummary = o.component.map(comp => {
                            const compCode = comp.code?.coding?.[0]?.display || comp.code?.text;
                            let compValue = 'N/A';
                            if (comp.valueQuantity?.value !== undefined) {
                                compValue = `${comp.valueQuantity.value} ${comp.valueQuantity.unit || ''}`.trim();
                            }
                            return `${compCode}: ${compValue}`;
                        }).join(', ');
                        observation.value = componentSummary;
                    }
                    
                    // Add reference ranges if available
                    if (o.referenceRange && o.referenceRange.length > 0) {
                        observation.referenceRange = o.referenceRange.map(range => ({
                            low: range.low,
                            high: range.high,
                            type: range.type?.coding?.[0]?.display || range.type?.text,
                            text: range.text
                        }));
                    }
                    
                    // Add interpretation if available
                    if (o.interpretation && o.interpretation.length > 0) {
                        observation.interpretation = o.interpretation.map(interp => 
                            interp.coding?.[0]?.display || interp.text
                        );
                    }
                    
                    // Add performer if available
                    if (o.performer && o.performer.length > 0) {
                        observation.performer = o.performer.map(perf => perf.reference);
                    }
                    
                    return observation;
                }).filter(o => o.code),
                
                conditions: conditionsArray.map(c => ({
                    code: c.code?.coding?.[0]?.display || c.code?.text,
                    clinicalStatus: c.clinicalStatus?.coding?.[0]?.code,
                    onsetDateTime: c.onsetDateTime
                })).filter(c => c.code),
                
                procedures: proceduresArray.map(p => ({
                    code: p.code?.coding?.[0]?.display || p.code?.text,
                    status: p.status,
                    performedDateTime: p.performedDateTime
                })).filter(p => p.code),
                
                encounters: encountersArray.map(e => {
                    const encounter: any = {
                        type: e.type?.[0]?.coding?.[0]?.display,
                        status: e.status,
                        class: e.class?.code,
                        period: e.period?.start
                    };
                    
                    // Add reason codes if available
                    if (e.reasonCode && e.reasonCode.length > 0) {
                        encounter.reasons = e.reasonCode.map(rc => 
                            rc.coding?.[0]?.display || rc.text
                        ).filter(Boolean);
                    }
                    
                    // Add diagnosis count
                    if (e.diagnosis && e.diagnosis.length > 0) {
                        encounter.diagnosisCount = e.diagnosis.length;
                    }
                    
                    // Add service type
                    if (e.serviceType?.coding?.[0]?.display) {
                        encounter.serviceType = e.serviceType.coding[0].display;
                    }
                    
                    // Add priority
                    if (e.priority?.coding?.[0]?.display) {
                        encounter.priority = e.priority.coding[0].display;
                    }
                    
                    return encounter;
                }).filter(e => e.type),
                
                medications: medicationRequestsArray.map(m => ({
                    medication: m.medicationCodeableConcept?.coding?.[0]?.display || m.medicationCodeableConcept?.text,
                    status: m.status,
                    authoredOn: m.authoredOn
                })).filter(m => m.medication),
                
                immunizations: immunizationsArray.map(i => ({
                    vaccine: i.vaccineCode?.coding?.[0]?.display || i.vaccineCode?.text,
                    status: i.status,
                    occurrenceDateTime: i.occurrenceDateTime
                })).filter(i => i.vaccine)
            };
            
            // Output JSON to console
            //console.log(JSON.stringify(fhirData, null, 2));
            console.log("Successfully extracted patient data");
            // Save JSON to file
            const jsonFilePath = join('./patient_json', 'patient_data.json');
            writeFileSync(jsonFilePath, JSON.stringify(fhirData, null, 2), 'utf8');
            console.log(`\nJSON data saved to: ${jsonFilePath}`);
        }
        
    } catch (error) {
        console.error('Error demonstrating utils:', error);
    }
}

// Example usage
demonstrateUtils();