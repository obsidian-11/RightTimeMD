import fs from 'fs';
import path from 'path';
import { FHIRPatientParser } from './patient-parser.js';

class BatchPatientProcessor {
    constructor(fhirDir = './fhir', outputDir = './patient-summaries') {
        this.fhirDir = fhirDir;
        this.outputDir = outputDir;
        this.processedCount = 0;
        this.errorCount = 0;
        this.errors = [];
    }

    async processAllPatients() {
        console.log(`Processing FHIR files from: ${this.fhirDir}`);
        console.log(`Output directory: ${this.outputDir}`);

        // Create output directory if it doesn't exist
        if (!fs.existsSync(this.outputDir)) {
            fs.mkdirSync(this.outputDir, { recursive: true });
            console.log(`Created output directory: ${this.outputDir}`);
        }

        // Get all JSON files in the FHIR directory
        const files = fs.readdirSync(this.fhirDir)
            .filter(file => file.endsWith('.json'))
            .map(file => path.join(this.fhirDir, file));

        console.log(`Found ${files.length} FHIR JSON files to process`);

        for (const filePath of files) {
            try {
                await this.processPatientFile(filePath);
                this.processedCount++;
                
                if (this.processedCount % 10 === 0) {
                    console.log(`Processed ${this.processedCount}/${files.length} files...`);
                }
            } catch (error) {
                this.errorCount++;
                this.errors.push({ file: filePath, error: error.message });
                console.error(`Error processing ${filePath}: ${error.message}`);
            }
        }

        console.log('\n=== BATCH PROCESSING COMPLETE ===');
        console.log(`Successfully processed: ${this.processedCount} files`);
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

        // Generate RAG-optimized text content
        const textContent = this.generateRAGOptimizedText({
            basicInfo,
            conditions,
            encounters,
            observations,
            surveyScores,
            diagnosticReports
        });

        // Create output filename based on patient name and ID
        const sanitizedName = basicInfo.name.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
        const outputFileName = `${sanitizedName}_${basicInfo.id.slice(-8)}.txt`;
        const outputPath = path.join(this.outputDir, outputFileName);

        // Write to file
        fs.writeFileSync(outputPath, textContent, 'utf8');
    }

    generateRAGOptimizedText(data) {
        const { basicInfo, conditions, encounters, observations, surveyScores, diagnosticReports } = data;
        
        let content = '';

        // Header with metadata for RAG indexing
        content += `PATIENT_ID: ${basicInfo.id}\n`;
        content += `PATIENT_NAME: ${basicInfo.name}\n`;
        content += `AGE: ${basicInfo.age}\n`;
        content += `GENDER: ${basicInfo.gender}\n`;
        content += `BIRTH_DATE: ${basicInfo.birthDate}\n`;
        content += `MARITAL_STATUS: ${basicInfo.maritalStatus}\n`;
        content += `ADDRESS: ${basicInfo.address}\n`;
        content += `PROCESSING_DATE: ${new Date().toISOString()}\n`;
        content += '\n---\n\n';

        // Patient Summary Section
        content += 'PATIENT SUMMARY:\n';
        content += `${basicInfo.name} is a ${basicInfo.age}-year-old ${basicInfo.gender} patient (DOB: ${basicInfo.birthDate}). `;
        content += `Current marital status: ${basicInfo.maritalStatus}. Lives at ${basicInfo.address}.\n\n`;

        // Active Health Conditions
        const activeConditions = conditions.filter(c => c.clinicalStatus === 'active');
        const resolvedConditions = conditions.filter(c => c.clinicalStatus === 'resolved');
        
        if (activeConditions.length > 0) {
            content += 'ACTIVE MEDICAL CONDITIONS:\n';
            activeConditions.forEach((condition, index) => {
                content += `${index + 1}. ${condition.display}`;
                if (condition.onsetDate) {
                    content += ` (onset: ${condition.onsetDate})`;
                }
                content += '\n';
            });
            content += '\n';
        }

        if (resolvedConditions.length > 0) {
            content += 'RESOLVED MEDICAL CONDITIONS:\n';
            resolvedConditions.forEach((condition, index) => {
                content += `${index + 1}. ${condition.display}`;
                if (condition.onsetDate) {
                    content += ` (onset: ${condition.onsetDate})`;
                }
                content += '\n';
            });
            content += '\n';
        }

        // Recent Medical Encounters
        const recentEncounters = encounters
            .filter(e => e.startDate)
            .sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
            .slice(0, 5);

        if (recentEncounters.length > 0) {
            content += 'RECENT MEDICAL ENCOUNTERS:\n';
            recentEncounters.forEach((encounter, index) => {
                content += `${index + 1}. ${encounter.startDate}: ${encounter.type || 'Medical visit'}`;
                if (encounter.reasonCode) {
                    content += ` - Reason: ${encounter.reasonCode}`;
                }
                content += ` (Status: ${encounter.status})\n`;
            });
            content += '\n';
        }

        // Current Vital Signs and Lab Results
        if (observations.length > 0) {
            content += 'CURRENT VITAL SIGNS AND LAB RESULTS:\n';
            observations.slice(0, 10).forEach((obs, index) => {
                const value = obs.value != null ? obs.value : 'Not recorded';
                const unit = obs.unit ? ` ${obs.unit}` : '';
                content += `${index + 1}. ${obs.code}: ${value}${unit}`;
                if (obs.effectiveDate) {
                    content += ` (Date: ${obs.effectiveDate})`;
                }
                if (obs.interpretation) {
                    content += ` - ${obs.interpretation}`;
                }
                content += '\n';
            });
            content += '\n';
        }

        // Screening Scores
        if (surveyScores.length > 0) {
            content += 'SCREENING AND ASSESSMENT SCORES:\n';
            surveyScores.forEach((score, index) => {
                content += `${index + 1}. ${score.code}: ${score.score} (Date: ${score.date})\n`;
            });
            content += '\n';
        }

        // Recent Diagnostic Reports
        const recentReports = diagnosticReports
            .filter(r => r.effectiveDate)
            .sort((a, b) => new Date(b.effectiveDate) - new Date(a.effectiveDate))
            .slice(0, 3);

        if (recentReports.length > 0) {
            content += 'RECENT DIAGNOSTIC REPORTS:\n';
            recentReports.forEach((report, index) => {
                content += `${index + 1}. ${report.code} (${report.effectiveDate})\n`;
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

        // Clinical Keywords for RAG Search
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

        // Risk Factors and Notable Findings
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

        return content;
    }

    // Generate a summary report of all processed patients
    async generateBatchSummary() {
        const summaryPath = path.join(this.outputDir, '_BATCH_SUMMARY.txt');
        const files = fs.readdirSync(this.outputDir)
            .filter(file => file.endsWith('.txt') && !file.startsWith('_'))
            .map(file => path.join(this.outputDir, file));

        let summary = 'BATCH PROCESSING SUMMARY\n';
        summary += `Generated on: ${new Date().toISOString()}\n`;
        summary += `Total patients processed: ${files.length}\n\n`;

        summary += 'PATIENT FILES:\n';
        files.forEach((file, index) => {
            const filename = path.basename(file);
            const content = fs.readFileSync(file, 'utf8');
            const nameMatch = content.match(/PATIENT_NAME: (.+)/);
            const ageMatch = content.match(/AGE: (.+)/);
            const genderMatch = content.match(/GENDER: (.+)/);
            
            const name = nameMatch ? nameMatch[1] : 'Unknown';
            const age = ageMatch ? ageMatch[1] : 'Unknown';
            const gender = genderMatch ? genderMatch[1] : 'Unknown';
            
            summary += `${index + 1}. ${filename} - ${name}, ${age} years old, ${gender}\n`;
        });

        fs.writeFileSync(summaryPath, summary, 'utf8');
        console.log(`Batch summary written to: ${summaryPath}`);
    }
}

// Usage function
async function processAllPatients(fhirDir = './fhir', outputDir = './patient-summaries') {
    const processor = new BatchPatientProcessor(fhirDir, outputDir);
    await processor.processAllPatients();
    await processor.generateBatchSummary();
}

// Export for use as module
export { BatchPatientProcessor, processAllPatients };

// Command line usage
if (process.argv[2] === '--process') {
    const fhirDir = process.argv[3] || './fhir';
    const outputDir = process.argv[4] || './patient-summaries';
    processAllPatients(fhirDir, outputDir);
} else {
    console.log('Usage: node batch-patient-processor.js --process [fhir-directory] [output-directory]');
    console.log('Example: node batch-patient-processor.js --process ./fhir ./patient-summaries');
}