import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { FHIRPatientParser } from './patient-parser.js';

class DeidentifiedBatchProcessor {
    constructor(fhirDir = './fhir', outputDir = './deidentified-summaries') {
        this.fhirDir = fhirDir;
        this.outputDir = outputDir;
        this.processedCount = 0;
        this.errorCount = 0;
        this.errors = [];
        
        // For consistent anonymization
        this.patientCounter = 1;
        this.cityMappings = new Map();
        this.stateMappings = new Map();
    }

    // Generate a consistent anonymous ID for patient
    generateAnonymousId(originalId) {
        const hash = crypto.createHash('sha256').update(originalId).digest('hex');
        return `PATIENT_${hash.substring(0, 8).toUpperCase()}`;
    }

    // Anonymize city names while preserving geographic patterns
    anonymizeCity(city) {
        if (!city || city === 'Unknown') return 'CITY_UNKNOWN';
        
        if (!this.cityMappings.has(city)) {
            const cityId = `CITY_${String(this.cityMappings.size + 1).padStart(3, '0')}`;
            this.cityMappings.set(city, cityId);
        }
        return this.cityMappings.get(city);
    }

    // Preserve state for regional analysis but anonymize if needed
    anonymizeState(state) {
        if (!state || state === 'Unknown') return 'STATE_UNKNOWN';
        
        // For US states, we can keep them as they're not directly identifying
        // For privacy, you could also anonymize these
        const usStates = ['AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA', 
                         'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
                         'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
                         'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
                         'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY'];
        
        if (usStates.includes(state)) {
            return state; // Keep for regional analysis
        }
        
        // Anonymize non-US or unknown states
        if (!this.stateMappings.has(state)) {
            const stateId = `STATE_${String(this.stateMappings.size + 1).padStart(2, '0')}`;
            this.stateMappings.set(state, stateId);
        }
        return this.stateMappings.get(state);
    }

    // Convert absolute dates to relative time periods
    anonymizeDate(dateString, referenceDate = null) {
        if (!dateString) return null;
        
        const date = new Date(dateString);
        const ref = referenceDate ? new Date(referenceDate) : new Date();
        
        const diffYears = ref.getFullYear() - date.getFullYear();
        const diffMonths = (ref.getFullYear() - date.getFullYear()) * 12 + (ref.getMonth() - date.getMonth());
        
        if (diffYears < 1) {
            return `${diffMonths} months ago`;
        } else if (diffYears < 2) {
            return '1 year ago';
        } else if (diffYears < 5) {
            return `${diffYears} years ago`;
        } else if (diffYears < 10) {
            return '5-10 years ago';
        } else {
            return '10+ years ago';
        }
    }

    // Calculate age groups instead of exact age
    getAgeGroup(age) {
        if (age < 1) return 'Infant (0-1)';
        if (age < 5) return 'Toddler (1-4)';
        if (age < 13) return 'Child (5-12)';
        if (age < 18) return 'Adolescent (13-17)';
        if (age < 25) return 'Young Adult (18-24)';
        if (age < 35) return 'Adult (25-34)';
        if (age < 45) return 'Adult (35-44)';
        if (age < 55) return 'Middle-aged (45-54)';
        if (age < 65) return 'Middle-aged (55-64)';
        if (age < 75) return 'Senior (65-74)';
        if (age < 85) return 'Senior (75-84)';
        return 'Elderly (85+)';
    }

    async processAllPatients() {
        console.log(`Processing FHIR files for de-identification from: ${this.fhirDir}`);
        console.log(`De-identified output directory: ${this.outputDir}`);

        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
            console.log(`Created de-identified output directory: ${this.outputDir}`);
        }

        // Get all JSON files in the FHIR directory
        const files = fs.readdirSync(this.fhirDir)
            .filter(file => file.endsWith('.json'))
            .map(file => path.join(this.fhirDir, file));

        console.log(`Found ${files.length} FHIR JSON files to de-identify and process`);

        for (const filePath of files) {
            try {
                await this.processPatientFile(filePath);
                this.processedCount++;
                
                if (this.processedCount % 10 === 0) {
                    console.log(`De-identified ${this.processedCount}/${files.length} files...`);
                }
            } catch (error) {
                this.errorCount++;
                this.errors.push({ file: filePath, error: error.message });
                console.error(`Error processing ${filePath}: ${error.message}`);
            }
        }

        console.log('\n=== DE-IDENTIFICATION COMPLETE ===');
        console.log(`Successfully de-identified: ${this.processedCount} files`);
        console.log(`Errors encountered: ${this.errorCount} files`);
        
        if (this.errors.length > 0) {
            console.log('\nFiles with errors:');
            this.errors.forEach(err => {
                console.log(`  - ${path.basename(err.file)}: ${err.error}`);
            });
        }
    }

    async processPatientFile(filePath) {
        const parser = new FHIRPatientParser(filePath);
        await parser.loadPatientData();

        // Extract patient data
        const basicInfo = parser.getPatientBasicInfo();
        const conditions = parser.getHealthConditions();
        const encounters = parser.getEncounters();
        const observations = parser.pickKeyObservations();
        const surveyScores = parser.getSurveyScores();
        const diagnosticReports = parser.getDiagnosticReportsWithResults();

        // Generate de-identified content
        const deidentifiedContent = this.generateDeidentifiedText({
            basicInfo,
            conditions,
            encounters,
            observations,
            surveyScores,
            diagnosticReports
        });

        // Create anonymous filename
        const anonymousId = this.generateAnonymousId(basicInfo.id);
        const outputFileName = `${anonymousId}.txt`;
        const outputPath = path.join(this.outputDir, outputFileName);

        // Write to file
        fs.writeFileSync(outputPath, deidentifiedContent, 'utf8');
    }

    generateDeidentifiedText(data) {
        const { basicInfo, conditions, encounters, observations, surveyScores, diagnosticReports } = data;
        
        let content = '';
        
        // De-identified metadata
        const anonymousId = this.generateAnonymousId(basicInfo.id);
        const ageGroup = this.getAgeGroup(basicInfo.age);
        const city = this.anonymizeCity(basicInfo.address.split(',')[1]?.trim());
        const state = this.anonymizeState(basicInfo.address.split(',')[2]?.trim()?.split(' ')[0]);
        
        // Find most recent encounter date to use as reference
        const mostRecentEncounter = encounters
            .filter(e => e.startDate)
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))[0];
        const referenceDate = mostRecentEncounter?.startDate;

        content += `ANONYMOUS_PATIENT_ID: ${anonymousId}\n`;
        content += `AGE_GROUP: ${ageGroup}\n`;
        content += `GENDER: ${basicInfo.gender}\n`;
        content += `MARITAL_STATUS: ${basicInfo.maritalStatus}\n`;
        content += `REGION: ${city}, ${state}\n`;
        content += `PROCESSING_DATE: ${new Date().toISOString().split('T')[0]}\n`; // Date only, no time
        content += '\n---\n\n';

        // De-identified patient summary
        content += 'PATIENT CLINICAL PROFILE:\n';
        content += `This is a ${ageGroup} ${basicInfo.gender} patient with marital status: ${basicInfo.maritalStatus}. `;
        content += `Located in region: ${city}, ${state}.\n\n`;

        // Active Health Conditions (no dates)
        const activeConditions = conditions.filter(c => c.clinicalStatus === 'active');
        const resolvedConditions = conditions.filter(c => c.clinicalStatus === 'resolved');
        
        if (activeConditions.length > 0) {
            content += 'ACTIVE MEDICAL CONDITIONS:\n';
            activeConditions.forEach((condition, index) => {
                content += `${index + 1}. ${condition.display}`;
                if (condition.onsetDate && referenceDate) {
                    const relativeTime = this.anonymizeDate(condition.onsetDate, referenceDate);
                    content += ` (onset: ${relativeTime})`;
                }
                content += '\n';
            });
            content += '\n';
        }

        if (resolvedConditions.length > 0) {
            content += 'RESOLVED MEDICAL CONDITIONS:\n';
            resolvedConditions.slice(0, 10).forEach((condition, index) => { // Limit to avoid identification
                content += `${index + 1}. ${condition.display}`;
                if (condition.onsetDate && referenceDate) {
                    const relativeTime = this.anonymizeDate(condition.onsetDate, referenceDate);
                    content += ` (onset: ${relativeTime})`;
                }
                content += '\n';
            });
            content += '\n';
        }

        // Recent Medical Encounters (anonymized dates)
        const recentEncounters = encounters
            .filter(e => e.startDate)
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .slice(0, 5);

        if (recentEncounters.length > 0) {
            content += 'RECENT MEDICAL ENCOUNTERS:\n';
            recentEncounters.forEach((encounter, index) => {
                const relativeTime = this.anonymizeDate(encounter.startDate, referenceDate);
                content += `${index + 1}. ${relativeTime}: ${encounter.type || 'Medical visit'}`;
                if (encounter.reasonCode) {
                    content += ` - Reason: ${encounter.reasonCode}`;
                }
                content += ` (Status: ${encounter.status})\n`;
            });
            content += '\n';
        }

        // Current Vital Signs and Lab Results (remove exact dates)
        if (observations.length > 0) {
            content += 'CLINICAL MEASUREMENTS:\n';
            observations.slice(0, 10).forEach((obs, index) => {
                const value = obs.value != null ? obs.value : 'Not recorded';
                const unit = obs.unit ? ` ${obs.unit}` : '';
                content += `${index + 1}. ${obs.code}: ${value}${unit}`;
                
                // Convert to relative time if reference date available
                if (obs.effectiveDate && referenceDate) {
                    const relativeTime = this.anonymizeDate(obs.effectiveDate, referenceDate);
                    content += ` (${relativeTime})`;
                }
                
                if (obs.interpretation) {
                    content += ` - ${obs.interpretation}`;
                }
                content += '\n';
            });
            content += '\n';
        }

        // Screening Scores (anonymized dates)
        if (surveyScores.length > 0) {
            content += 'SCREENING AND ASSESSMENT SCORES:\n';
            surveyScores.forEach((score, index) => {
                const relativeTime = referenceDate ? this.anonymizeDate(score.date, referenceDate) : 'Historical';
                content += `${index + 1}. ${score.code}: ${score.score} (${relativeTime})\n`;
            });
            content += '\n';
        }

        // Recent Diagnostic Reports (anonymized dates)
        const recentReports = diagnosticReports
            .filter(r => r.effectiveDate)
            .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate))
            .slice(0, 3);

        if (recentReports.length > 0) {
            content += 'DIAGNOSTIC REPORTS:\n';
            recentReports.forEach((report, index) => {
                const relativeTime = this.anonymizeDate(report.effectiveDate, referenceDate);
                content += `${index + 1}. ${report.code} (${relativeTime})\n`;
                content += `   Status: ${report.status}\n`;
                if (report.conclusion) {
                    content += `   Conclusion: ${report.conclusion}\n`;
                }
                if (report.results && report.results.length > 0) {
                    content += `   Key Results:\n`;
                    report.results.forEach(result => {
                        content += `     - ${result.code}: ${result.value || 'Not specified'}\n`;
                    });
                }
                content += '\n';
            });
        }

        // Clinical Keywords for similarity matching (unchanged as they're not identifying)
        content += 'CLINICAL_KEYWORDS: ';
        const keywords = new Set();
        
        // Add condition keywords
        conditions.forEach(c => {
            if (c.display) {
                const words = c.display.toLowerCase().split(/\s+/);
                words.forEach(word => {
                    if (word.length > 3 && !['finding', 'disorder', 'situation', 'procedure'].includes(word)) {
                        keywords.add(word);
                    }
                });
            }
        });
        
        // Add observation keywords
        observations.forEach(o => {
            if (o.code) {
                const words = o.code.toLowerCase().split(/\s+/);
                words.forEach(word => {
                    if (word.length > 3 && !['with', 'panel', 'ratio'].includes(word)) {
                        keywords.add(word);
                    }
                });
            }
        });
        
        content += Array.from(keywords).join(', ') + '\n\n';

        // Risk Factors (preserved for similarity analysis)
        const riskFactors = [];
        
        // Check for common risk factors
        conditions.forEach(c => {
            const display = c.display.toLowerCase();
            if (display.includes('diabetes') || display.includes('prediabetes')) {
                riskFactors.push('Diabetes risk');
            }
            if (display.includes('hypertension') || display.includes('blood pressure')) {
                riskFactors.push('Hypertension');
            }
            if (display.includes('obesity') || display.includes('bmi')) {
                riskFactors.push('Obesity');
            }
            if (display.includes('smoking') || display.includes('tobacco')) {
                riskFactors.push('Tobacco use');
            }
            if (display.includes('alcohol')) {
                riskFactors.push('Alcohol use');
            }
        });

        // Check vital signs for abnormal values
        observations.forEach(o => {
            if (o.code.toLowerCase().includes('blood pressure') && o.value) {
                const bpMatch = o.value.match(/(\d+)\/(\d+)/);
                if (bpMatch) {
                    const systolic = parseInt(bpMatch[1]);
                    const diastolic = parseInt(bpMatch[2]);
                    if (systolic >= 140 || diastolic >= 90) {
                        riskFactors.push('Elevated blood pressure');
                    }
                }
            }
            if (o.code.toLowerCase().includes('bmi') && o.value) {
                const bmi = parseFloat(o.value);
                if (bmi >= 30) {
                    riskFactors.push('Obesity (BMI ≥30)');
                } else if (bmi >= 25) {
                    riskFactors.push('Overweight (BMI 25-29.9)');
                }
            }
        });

        if (riskFactors.length > 0) {
            content += 'RISK_FACTORS: ' + [...new Set(riskFactors)].join(', ') + '\n\n';
        }

        // Clinical similarity features for RAG matching
        content += 'SIMILARITY_FEATURES:\n';
        content += `Age_Group: ${ageGroup}\n`;
        content += `Gender: ${basicInfo.gender}\n`;
        content += `Active_Conditions_Count: ${activeConditions.length}\n`;
        content += `Total_Conditions_Count: ${conditions.length}\n`;
        content += `Recent_Encounters_Count: ${recentEncounters.length}\n`;
        if (riskFactors.length > 0) {
            content += `Risk_Factors: ${[...new Set(riskFactors)].join(', ')}\n`;
        }
        content += '\n';

        return content;
    }

    // Generate summary of de-identification process
    async generateDeidentificationSummary() {
        const summaryPath = path.join(this.outputDir, '_DEIDENTIFICATION_SUMMARY.txt');
        const files = fs.readdirSync(this.outputDir)
            .filter(file => file.endsWith('.txt') && !file.startsWith('_'))
            .map(file => path.join(this.outputDir, file));

        let summary = 'DE-IDENTIFICATION SUMMARY\n';
        summary += `Generated on: ${new Date().toISOString().split('T')[0]}\n`;
        summary += `Total patients de-identified: ${files.length}\n\n`;

        summary += 'DE-IDENTIFICATION METHODS APPLIED:\n';
        summary += '- Removed patient names, addresses, and specific identifiers\n';
        summary += '- Converted exact ages to age groups\n';
        summary += '- Converted absolute dates to relative time periods\n';
        summary += '- Anonymized geographic locations while preserving regional patterns\n';
        summary += '- Generated anonymous patient IDs using cryptographic hashing\n';
        summary += '- Preserved clinical data essential for similarity analysis\n\n';

        summary += 'PRESERVED FOR SIMILARITY ANALYSIS:\n';
        summary += '- Medical conditions and diagnoses\n';
        summary += '- Vital signs and lab values\n';
        summary += '- Risk factors and clinical keywords\n';
        summary += '- Age groups and gender\n';
        summary += '- Regional information (state level)\n';
        summary += '- Relative timing of medical events\n\n';

        summary += `Total anonymous patient files: ${files.length}\n`;
        summary += `City mappings created: ${this.cityMappings.size}\n`;
        summary += `State mappings created: ${this.stateMappings.size}\n`;

        fs.writeFileSync(summaryPath, summary, 'utf8');
        console.log(`De-identification summary written to: ${summaryPath}`);
    }
}

// Usage function
async function deidentifyAllPatients(fhirDir = './fhir', outputDir = './deidentified-summaries') {
    const processor = new DeidentifiedBatchProcessor(fhirDir, outputDir);
    await processor.processAllPatients();
    await processor.generateDeidentificationSummary();
}

// Export for use as module
export { DeidentifiedBatchProcessor, deidentifyAllPatients };

// Command line usage
if (process.argv[2] === '--deidentify') {
    const fhirDir = process.argv[3] || './fhir';
    const outputDir = process.argv[4] || './deidentified-summaries';
    deidentifyAllPatients(fhirDir, outputDir);
} else {
    console.log('Usage: node deidentified-batch-processor.js --deidentify [fhir-directory] [output-directory]');
    console.log('Example: node deidentified-batch-processor.js --deidentify ./fhir ./deidentified-summaries');
}