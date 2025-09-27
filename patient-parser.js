import fs from 'fs';

class FHIRPatientParser {
    constructor(filePath) {
        this.filePath = filePath;
        this.data = null;
        this.resourceIndex = new Map(); // id -> resource
    }

    async loadPatientData() {
        try {
            const fileContent = fs.readFileSync(this.filePath, 'utf8');
            this.data = JSON.parse(fileContent);

            // Build a fast lookup index for Bundle.entry resources
            if (this.data?.entry?.length) {
                for (const e of this.data.entry) {
                    const r = e.resource;
                    if (r?.resourceType && r?.id) {
                        this.resourceIndex.set(`${r.resourceType}/${r.id}`, r);
                    }
                }
            }
            return this.data;
        } catch (error) {
            throw new Error(`Failed to load patient data: ${error.message}`);
        }
    }

    resolveReference(ref) {
        if (!ref) return undefined;
        // ref can be like "Observation/abc" or "#contained"
        if (ref.startsWith('#')) return undefined; // skip contained for now
        return this.resourceIndex.get(ref);
    }

    getPatientBasicInfo() {
        this.ensureData();
        const patientEntry = this.data.entry.find(e => e.resource?.resourceType === 'Patient');
        if (!patientEntry) throw new Error('No Patient resource found in the bundle.');
        const p = patientEntry.resource;

        const lastEncounterDate = this.getEncounters()
            .map(e => e.startDate ? new Date(e.startDate) : null)
            .filter(Boolean)
            .sort((a, b) => b - a)[0];

        return {
            id: p.id,
            name: this.formatName(p.name),
            gender: p.gender,
            birthDate: p.birthDate,
            age: this.calculateAge(p.birthDate), // today
            ageAtLastEncounter: lastEncounterDate ? this.calculateAge(p.birthDate, lastEncounterDate) : undefined,
            maritalStatus: p.maritalStatus?.text || 'Unknown',
            address: this.formatAddress(p.address)
        };
    }

    calculateAge(birthDate, asOfDate = new Date()) {
        if (!birthDate) return 'Unknown';
        const today = asOfDate instanceof Date ? asOfDate : new Date(asOfDate);
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) age--;
        return age;
    }

    formatName(nameArray) {
        if (!Array.isArray(nameArray) || nameArray.length === 0) return 'Unknown';
        const n = nameArray[0];
        const prefix = n.prefix ? n.prefix.join(' ') + ' ' : '';
        const given = n.given ? n.given.join(' ') : '';
        const family = n.family || '';
        return `${prefix}${given} ${family}`.trim().replace(/\s+/g, ' ');
    }

    formatAddress(addressArray) {
        if (!Array.isArray(addressArray) || addressArray.length === 0) return 'Unknown';
        const a = addressArray[0];
        const line = a.line ? a.line.join(', ') : '';
        const city = a.city || '';
        const state = a.state || '';
        const postal = a.postalCode || '';
        const parts = [line, city, state].filter(Boolean).join(', ');
        return `${parts}${parts && postal ? ' ' : ''}${postal}`.trim();
    }

    ensureData() {
        if (!this.data) throw new Error('Patient data not loaded. Call loadPatientData() first.');
    }

    getHealthConditions() {
        this.ensureData();
        const entries = this.data.entry.filter(e => e.resource?.resourceType === 'Condition');
        return entries.map(e => {
            const c = e.resource;
            return {
                id: c.id,
                code: c.code?.coding?.[0]?.code,
                display: c.code?.coding?.[0]?.display || c.code?.text,
                clinicalStatus: c.clinicalStatus?.coding?.[0]?.code, // active | resolved | etc.
                onsetDate: c.onsetDateTime || c.onsetPeriod?.start,
                recordedDate: c.recordedDate,
                category: c.category?.[0]?.coding?.[0]?.display
            };
        }).filter(c => c.display);
    }

    getEncounters() {
        this.ensureData();
        const entries = this.data.entry.filter(e => e.resource?.resourceType === 'Encounter');
        return entries.map(e => {
            const en = e.resource;
            return {
                id: en.id,
                status: en.status,
                class: en.class?.display,
                type: en.type?.[0]?.coding?.[0]?.display || en.type?.[0]?.text,
                startDate: en.period?.start,
                endDate: en.period?.end,
                reasonCode: en.reasonCode?.[0]?.coding?.[0]?.display || en.reasonCode?.[0]?.text,
                serviceProvider: en.serviceProvider?.display
            };
        });
    }

    // Formats a single Observation value (not components)
    formatObservationValue(observation) {
        if (!observation) return null;

        if (observation.valueQuantity) {
            const v = observation.valueQuantity;
            const value = (v.value ?? v._value)?.toString();
            const unit = v.unit || v.code || v.system || '';
            return { text: value, unit: unit };
        }
        if (typeof observation.valueInteger === 'number') {
            return { text: observation.valueInteger.toString(), unit: '' };
        }
        if (typeof observation.valueDecimal === 'number') {
            return { text: observation.valueDecimal.toString(), unit: '' };
        }
        if (typeof observation.valueBoolean === 'boolean') {
            return { text: observation.valueBoolean ? 'true' : 'false', unit: '' };
        }
        if (typeof observation.valueString === 'string') {
            return { text: observation.valueString, unit: '' };
        }
        if (observation.valueCodeableConcept) {
            const disp = observation.valueCodeableConcept.coding?.[0]?.display || observation.valueCodeableConcept.text;
            return { text: disp || null, unit: '' };
        }
        return null;
    }

    // Returns a *flattened* observation list including expanded BP component readout
    getObservations() {
        this.ensureData();
        const entries = this.data.entry.filter(e => e.resource?.resourceType === 'Observation');

        const out = [];

        for (const e of entries) {
            const o = e.resource;
            const codeDisplay = o.code?.coding?.[0]?.display || o.code?.text || '';
            const categoryDisplay = o.category?.[0]?.coding?.[0]?.display;

            // Special handling: Blood pressure panel (LOINC 85354-9) with components
            const loinc = o.code?.coding?.[0]?.code;
            const isBpPanel = loinc === '85354-9' || /blood pressure/i.test(codeDisplay);

            if (isBpPanel && Array.isArray(o.component) && o.component.length) {
                // Find systolic (8480-6) and diastolic (8462-4)
                const sys = o.component.find(c =>
                    c.code?.coding?.some(cc => cc.code === '8480-6') ||
                    /systolic/i.test(c.code?.text || '')
                );
                const dia = o.component.find(c =>
                    c.code?.coding?.some(cc => cc.code === '8462-4') ||
                    /diastolic/i.test(c.code?.text || '')
                );

                const sysVal = sys ? this.formatObservationValue(sys) : null;
                const diaVal = dia ? this.formatObservationValue(dia) : null;

                const combinedTxt =
                    (sysVal?.text && diaVal?.text)
                        ? `${sysVal.text}/${diaVal.text} ${sysVal.unit || diaVal.unit || 'mmHg'}`
                        : sysVal?.text
                            ? `${sysVal.text} ${sysVal.unit || 'mmHg'}`
                            : diaVal?.text
                                ? `${diaVal.text} ${diaVal.unit || 'mmHg'}`
                                : '—';

                out.push({
                    id: o.id,
                    status: o.status,
                    category: categoryDisplay,
                    code: 'Blood pressure panel',
                    effectiveDate: o.effectiveDateTime || o.effectivePeriod?.start,
                    value: combinedTxt,
                    unit: '',
                    interpretation: o.interpretation?.[0]?.coding?.[0]?.display || o.interpretation?.[0]?.text || undefined
                });

                continue;
            }

            // Regular Observation value (if any)
            const val = this.formatObservationValue(o);
            out.push({
                id: o.id,
                status: o.status,
                category: categoryDisplay,
                code: codeDisplay || 'Observation',
                effectiveDate: o.effectiveDateTime || o.effectivePeriod?.start,
                value: val?.text ?? null,
                unit: val?.unit || '',
                interpretation: o.interpretation?.[0]?.coding?.[0]?.display || o.interpretation?.[0]?.text || undefined
            });
        }

        return out;
    }

    // Extract survey scores (PHQ-2, DAST-10, GAD-7, etc.)
    getSurveyScores() {
        const obs = this.getObservations();
        const wanted = /(PHQ-?2|DAST-?10|GAD-?7)/i;
        return obs
            .filter(o => wanted.test(o.code))
            .map(o => ({
                code: o.code,
                score: o.value,
                date: o.effectiveDate
            }))
            .sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // DiagnosticReports with dereferenced results (top N analytes)
    getDiagnosticReportsWithResults(maxAnalytesPerReport = 8) {
        this.ensureData();
        const reportEntries = this.data.entry.filter(e => e.resource?.resourceType === 'DiagnosticReport');

        return reportEntries.map(e => {
            const r = e.resource;
            const code = r.code?.coding?.[0]?.display || r.code?.text || 'Diagnostic report';
            const eff = r.effectiveDateTime || r.effectivePeriod?.start;
            const results = [];

            if (Array.isArray(r.result)) {
                for (const resRef of r.result) {
                    const o = this.resolveReference(resRef.reference);
                    if (!o) continue;
                    const disp = o.code?.coding?.[0]?.display || o.code?.text || 'Observation';
                    const val = this.formatObservationValue(o);
                    const valTxt = val ? `${val.text}${val.unit ? ' ' + val.unit : ''}` : null;

                    // Handle component-style child obs (rare outside BP; but keep simple)
                    results.push({
                        id: o.id,
                        code: disp,
                        value: valTxt
                    });
                    if (results.length >= maxAnalytesPerReport) break;
                }
            }

            return {
                id: r.id,
                status: r.status,
                category: r.category?.[0]?.coding?.[0]?.display,
                code,
                effectiveDate: eff,
                conclusion: r.conclusion,
                conclusionCode: r.conclusionCode?.[0]?.coding?.[0]?.display || r.conclusionCode?.[0]?.text,
                results
            };
        });
    }

    // Helpers for printing
    pickKeyObservations() {
        const obs = this.getObservations();
        const keep = [
            'Blood pressure', 'Heart rate', 'Body temperature',
            'Body weight', 'Body height', 'BMI', 'Glucose', 'Cholesterol'
        ];
        // substring match against code for friendliness
        return obs
            .filter(o => o.code && keep.some(k => o.code.toLowerCase().includes(k.toLowerCase())))
            .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate));
    }

    generateSummaryReport() {
        const basic = this.getPatientBasicInfo();
        const conditions = this.getHealthConditions();
        const encounters = this.getEncounters();
        const keyObservations = this.pickKeyObservations();
        const surveyScores = this.getSurveyScores();
        const reports = this.getDiagnosticReportsWithResults();

        console.log('\n=== PATIENT SUMMARY REPORT ===\n');

        // Basic Information
        console.log('PATIENT INFORMATION:');
        console.log(`Name: ${basic.name}`);
        console.log(`Age: ${basic.age} years old`);
        if (typeof basic.ageAtLastEncounter === 'number') {
            console.log(`Age at last encounter: ${basic.ageAtLastEncounter} years`);
        }
        console.log(`Gender: ${basic.gender}`);
        console.log(`Birth Date: ${basic.birthDate}`);
        console.log(`Marital Status: ${basic.maritalStatus}`);
        console.log(`Address: ${basic.address}`);

        // Health Conditions
        console.log('\nHEALTH CONDITIONS:');
        if (!conditions.length) {
            console.log('No recorded health conditions.');
        } else {
            // Sort active first, then by onset desc
            const order = { active: 0, relapse: 1, remission: 2, resolved: 3 };
            conditions
                .sort((a, b) => {
                    const aRank = order[a.clinicalStatus] ?? 99;
                    const bRank = order[b.clinicalStatus] ?? 99;
                    if (aRank !== bRank) return aRank - bRank;
                    return new Date(b.onsetDate || 0) - new Date(a.onsetDate || 0);
                })
                .forEach((c, i) => {
                    console.log(`${i + 1}. ${c.display}`);
                    console.log(`   Status: ${c.clinicalStatus || 'Unknown'}`);
                    if (c.onsetDate) console.log(`   Onset: ${c.onsetDate}`);
                    console.log('');
                });
        }

        // Recent Encounters
        console.log('RECENT ENCOUNTERS:');
        const recentEncounters = encounters
            .filter(e => e.startDate)
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .slice(0, 5);

        if (!recentEncounters.length) {
            console.log('No recorded encounters.');
        } else {
            recentEncounters.forEach((en, i) => {
                console.log(`${i + 1}. ${en.type || 'Unknown encounter type'}`);
                console.log(`   Date: ${en.startDate}`);
                console.log(`   Status: ${en.status}`);
                if (en.reasonCode) console.log(`   Reason: ${en.reasonCode}`);
                console.log('');
            });
        }

        // Key Vitals & Labs (includes fixed BP)
        console.log('KEY OBSERVATIONS & LAB RESULTS:');
        if (!keyObservations.length) {
            console.log('No key vital signs or lab results found.');
        } else {
            keyObservations.slice(0, 12).forEach((o, i) => {
                const v = o.value != null ? o.value : '—';
                const u = o.unit ? ` ${o.unit}` : '';
                console.log(`${i + 1}. ${o.code}: ${v}${u}`);
                console.log(`   Date: ${o.effectiveDate}`);
                if (o.interpretation) console.log(`   Interpretation: ${o.interpretation}`);
                console.log('');
            });
        }

        // Recent Diagnostic Reports with analytes
        console.log('RECENT DIAGNOSTIC REPORTS:');
        const recentReports = reports
            .filter(r => r.effectiveDate)
            .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate))
            .slice(0, 3);

        if (!recentReports.length) {
            console.log('No diagnostic reports found.');
        } else {
            recentReports.forEach((r, i) => {
                console.log(`${i + 1}. ${r.code}`);
                console.log(`   Date: ${r.effectiveDate}`);
                console.log(`   Status: ${r.status}`);
                if (r.conclusion) console.log(`   Conclusion: ${r.conclusion}`);
                if (r.results?.length) {
                    console.log(`   Results:`);
                    r.results.forEach(res => {
                        console.log(`     - ${res.code}: ${res.value ?? '—'}`);
                    });
                }
                console.log('');
            });
        }

        // Survey scores (explicit)
        if (surveyScores.length) {
            console.log('SCREENING SCORES:');
            surveyScores.slice(0, 6).forEach((s, i) => {
                console.log(`${i + 1}. ${s.code}: ${s.score}  (Date: ${s.date})`);
            });
            console.log('');
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
}
