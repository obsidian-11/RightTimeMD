import fs from 'fs';
import path from 'path';

class FHIRPatientParser {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = null;
    }

    async loadPatientData() {
        try {
            const fileContent = fs.readFileSync(this.filePath, 'utf8');
            this.data = JSON.parse(fileContent);
            return this.data;
        } catch (error) {
            throw new Error(`Failed to load patient data: ${error.message}`);
        }
    }

    getPatientBasicInfo() {
        if (!this.data) {
            throw new Error('Patient data not loaded. Call loadPatientData() first.');
        }

        const patientEntry = this.data.entry.find(entry => entry.resource.resourceType === 'Patient');
        if (!patientEntry) {
            throw new Error('No Patient resource found in the bundle.');
        }

        const patient = patientEntry.resource;
        
        return {
            id: patient.id,
            name: this.formatName(patient.name),
            gender: patient.gender,
            birthDate: patient.birthDate,
            age: this.calculateAge(patient.birthDate),
            maritalStatus: patient.maritalStatus?.text || 'Unknown',
            address: this.formatAddress(patient.address)
        };
    }

    calculateAge(birthDate) {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }
        
        return age;
    }

    formatName(nameArray) {
        if (!nameArray || nameArray.length === 0) return 'Unknown';
        
        const name = nameArray[0];
        const prefix = name.prefix ? name.prefix.join(' ') + ' ' : '';
        const given = name.given ? name.given.join(' ') : '';
        const family = name.family || '';
        
        return `${prefix}${given} ${family}`.trim();
    }

    formatAddress(addressArray) {
        if (!addressArray || addressArray.length === 0) return 'Unknown';
        
        const addr = addressArray[0];
        const line = addr.line ? addr.line.join(', ') : '';
        const city = addr.city || '';
        const state = addr.state || '';
        const postalCode = addr.postalCode || '';
        
        return `${line}, ${city}, ${state} ${postalCode}`.replace(/^,\s*/, '').trim();
    }

    getHealthConditions() {
        if (!this.data) {
            throw new Error('Patient data not loaded. Call loadPatientData() first.');
        }

        const conditionEntries = this.data.entry.filter(entry => entry.resource.resourceType === 'Condition');
        
        return conditionEntries.map(entry => {
            const condition = entry.resource;
            return {
                id: condition.id,
                code: condition.code?.coding?.[0]?.code,
                display: condition.code?.coding?.[0]?.display || condition.code?.text,
                clinicalStatus: condition.clinicalStatus?.coding?.[0]?.code,
                onsetDate: condition.onsetDateTime || condition.onsetPeriod?.start,
                recordedDate: condition.recordedDate,
                category: condition.category?.[0]?.coding?.[0]?.display
            };
        }).filter(condition => condition.display); // Filter out conditions without display names
    }

    getEncounters() {
        if (!this.data) {
            throw new Error('Patient data not loaded. Call loadPatientData() first.');
        }

        const encounterEntries = this.data.entry.filter(entry => entry.resource.resourceType === 'Encounter');
        
        return encounterEntries.map(entry => {
            const encounter = entry.resource;
            return {
                id: encounter.id,
                status: encounter.status,
                class: encounter.class?.display,
                type: encounter.type?.[0]?.coding?.[0]?.display || encounter.type?.[0]?.text,
                startDate: encounter.period?.start,
                endDate: encounter.period?.end,
                reasonCode: encounter.reasonCode?.[0]?.coding?.[0]?.display,
                serviceProvider: encounter.serviceProvider?.display
            };
        });
    }

    getObservations() {
        if (!this.data) {
            throw new Error('Patient data not loaded. Call loadPatientData() first.');
        }

        const observationEntries = this.data.entry.filter(entry => entry.resource.resourceType === 'Observation');
        
        return observationEntries.map(entry => {
            const observation = entry.resource;
            return {
                id: observation.id,
                status: observation.status,
                category: observation.category?.[0]?.coding?.[0]?.display,
                code: observation.code?.coding?.[0]?.display || observation.code?.text,
                effectiveDate: observation.effectiveDateTime || observation.effectivePeriod?.start,
                value: this.formatObservationValue(observation),
                unit: observation.valueQuantity?.unit,
                interpretation: observation.interpretation?.[0]?.coding?.[0]?.display
            };
        });
    }

    formatObservationValue(observation) {
        if (observation.valueQuantity) {
            return observation.valueQuantity.value;
        } else if (observation.valueCodeableConcept) {
            return observation.valueCodeableConcept.coding?.[0]?.display || observation.valueCodeableConcept.text;
        } else if (observation.valueString) {
            return observation.valueString;
        } else if (observation.valueBoolean !== undefined) {
            return observation.valueBoolean;
        }
        return null;
    }

    getDiagnosticReports() {
        if (!this.data) {
            throw new Error('Patient data not loaded. Call loadPatientData() first.');
        }

        const reportEntries = this.data.entry.filter(entry => entry.resource.resourceType === 'DiagnosticReport');
        
        return reportEntries.map(entry => {
            const report = entry.resource;
            return {
                id: report.id,
                status: report.status,
                category: report.category?.[0]?.coding?.[0]?.display,
                code: report.code?.coding?.[0]?.display || report.code?.text,
                effectiveDate: report.effectiveDateTime || report.effectivePeriod?.start,
                conclusion: report.conclusion,
                conclusionCode: report.conclusionCode?.[0]?.coding?.[0]?.display
            };
        });
    }

    generateSummaryReport() {
        const basicInfo = this.getPatientBasicInfo();
        const conditions = this.getHealthConditions();
        const encounters = this.getEncounters();
        const observations = this.getObservations();
        const diagnosticReports = this.getDiagnosticReports();

        console.log('\n=== PATIENT SUMMARY REPORT ===\n');
        
        // Basic Information
        console.log('PATIENT INFORMATION:');
        console.log(`Name: ${basicInfo.name}`);
        console.log(`Age: ${basicInfo.age} years old`);
        console.log(`Gender: ${basicInfo.gender}`);
        console.log(`Birth Date: ${basicInfo.birthDate}`);
        console.log(`Marital Status: ${basicInfo.maritalStatus}`);
        console.log(`Address: ${basicInfo.address}`);
        
        // Health Conditions
        console.log('\nHEALTH CONDITIONS:');
        if (conditions.length === 0) {
            console.log('No recorded health conditions.');
        } else {
            conditions.forEach((condition, index) => {
                console.log(`${index + 1}. ${condition.display}`);
                console.log(`   Status: ${condition.clinicalStatus || 'Unknown'}`);
                if (condition.onsetDate) {
                    console.log(`   Onset: ${condition.onsetDate}`);
                }
                console.log('');
            });
        }

        // Recent Encounters
        console.log('RECENT ENCOUNTERS:');
        const recentEncounters = encounters
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .slice(0, 5);
        
        if (recentEncounters.length === 0) {
            console.log('No recorded encounters.');
        } else {
            recentEncounters.forEach((encounter, index) => {
                console.log(`${index + 1}. ${encounter.type || 'Unknown encounter type'}`);
                console.log(`   Date: ${encounter.startDate}`);
                console.log(`   Status: ${encounter.status}`);
                if (encounter.reasonCode) {
                    console.log(`   Reason: ${encounter.reasonCode}`);
                }
                console.log('');
            });
        }

        // Key Vital Signs and Lab Results
        console.log('KEY OBSERVATIONS & LAB RESULTS:');
        const keyObservations = observations.filter(obs => 
            obs.code && (
                obs.code.includes('Blood pressure') ||
                obs.code.includes('Heart rate') ||
                obs.code.includes('Body temperature') ||
                obs.code.includes('Body weight') ||
                obs.code.includes('Body height') ||
                obs.code.includes('BMI') ||
                obs.code.includes('Glucose') ||
                obs.code.includes('Cholesterol')
            )
        ).sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));

        if (keyObservations.length === 0) {
            console.log('No key vital signs or lab results found.');
        } else {
            keyObservations.slice(0, 10).forEach((obs, index) => {
                console.log(`${index + 1}. ${obs.code}: ${obs.value} ${obs.unit || ''}`);
                console.log(`   Date: ${obs.effectiveDate}`);
                if (obs.interpretation) {
                    console.log(`   Interpretation: ${obs.interpretation}`);
                }
                console.log('');
            });
        }

        // Recent Diagnostic Reports
        console.log('RECENT DIAGNOSTIC REPORTS:');
        const recentReports = diagnosticReports
            .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate))
            .slice(0, 3);
        
        if (recentReports.length === 0) {
            console.log('No diagnostic reports found.');
        } else {
            recentReports.forEach((report, index) => {
                console.log(`${index + 1}. ${report.code}`);
                console.log(`   Date: ${report.effectiveDate}`);
                console.log(`   Status: ${report.status}`);
                if (report.conclusion) {
                    console.log(`   Conclusion: ${report.conclusion}`);
                }
                console.log('');
            });
        }

        console.log('=== END OF REPORT ===\n');
    }
}

// Usage example
async function analyzePatient(filePath) {
    try {
        const parser = new FHIRPatientParser(filePath);
        await parser.loadPatientData();
        parser.generateSummaryReport();
    } catch (error) {
        console.error('Error analyzing patient data:', error.message);
    }
}

// Export for use as a module
export { FHIRPatientParser, analyzePatient };

// If running directly from command line
if (process.argv[2]) {
    const filePath = process.argv[2];
    analyzePatient(filePath);
} else {
    console.log('Usage: node patient-parser.js <path-to-fhir-json-file>');
    console.log('Example: node patient-parser.js ./fhir/Abraham100_Leuschke194_ef5fdd3b-be41-b941-bb99-910d6799ce38.json');
}