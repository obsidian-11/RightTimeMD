import { TrialMatcher } from './embeddings-matcher.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';

// Get current directory in ES module
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get patient file from command line argument
const patientFile = process.argv[2];
if (!patientFile) {
    console.error('Please provide a patient file as an argument. Example:');
    console.error('  node patient-specific-matcher.js fhir/patient-file.json');
    process.exit(1);
}

const fullPatientPath = path.isAbsolute(patientFile) 
    ? patientFile 
    : path.join(__dirname, patientFile);

/**
 * Fetches clinical trials from ClinicalTrials.gov for specific conditions
 * @param {Array} conditions - Array of condition strings to search for
 * @returns {Promise<Array>} Array of clinical trials
 */
async function fetchClinicalTrials(conditions) {
    const allTrials = [];
    const seenTrials = new Set();
    
    // Process each condition in parallel
    await Promise.all(conditions.map(async (condition) => {
        if (!condition || condition === 'unknown' || condition.length < 3) return;
        
        console.log(`- Searching for trials related to: ${condition}`);
        
        try {
            const url = `https://clinicaltrials.gov/api/v2/studies?query.cond=${encodeURIComponent(condition)}&pageSize=5`;
            const response = await new Promise((resolve, reject) => {
                const req = https.get(url, { 
                    headers: { 'Accept': 'application/json' } 
                }, resolve);
                req.on('error', reject);
                req.end();
            });
            
            let data = '';
            for await (const chunk of response) {
                data += chunk;
            }
            
            const result = JSON.parse(data);
            if (result.studies) {
                result.studies.forEach(study => {
                    const trial = {
                        nctId: study.protocolSection.identificationModule.nctId,
                        title: study.protocolSection.identificationModule.briefTitle || 'No title',
                        conditions: study.protocolSection.conditionsModule?.conditions || [condition],
                        description: study.protocolSection.descriptionModule?.briefSummary || '',
                        status: study.protocolSection.statusModule?.overallStatus || 'Unknown',
                        url: `https://clinicaltrials.gov/ct2/show/${study.protocolSection.identificationModule.nctId}`
                    };
                    
                    if (!seenTrials.has(trial.nctId)) {
                        seenTrials.add(trial.nctId);
                        allTrials.push(trial);
                        console.log(`  ✓ Found: ${trial.title.substring(0, 60)}...`);
                    }
                });
            }
        } catch (error) {
            console.error(`  Error with ${condition}:`, error.message);
        }
    }));
    
    return allTrials;
}

/**
 * Process a FHIR patient file to extract relevant information
 */
function processPatientFile(filePath) {
    try {
        const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
        const patient = data.entry?.find(e => e.resource?.resourceType === 'Patient')?.resource;
        
        if (!patient) throw new Error('No Patient resource found');

        // Extract conditions
        const conditions = [];
        
        // Look for conditions in various places in the FHIR data
        data.entry?.forEach(entry => {
            const res = entry.resource;
            if (res.resourceType === 'Condition') {
                const condition = res.code?.coding?.[0]?.display;
                if (condition) conditions.push(condition);
            }
            // Also check for conditions in observations
            else if (res.resourceType === 'Observation' && res.code?.coding) {
                res.code.coding.forEach(coding => {
                    if (coding.display) conditions.push(coding.display);
                });
            }
        });

        // Clean and deduplicate conditions
        const uniqueConditions = [...new Set(
            conditions
                .filter(Boolean)
                .map(c => c.toLowerCase()
                    .replace(/\([^)]*\)/g, '')  // Remove anything in parentheses
                    .replace(/[^a-z0-9\s-]/g, '') // Remove special chars
                    .trim()
                )
                .filter(c => c.length > 3) // Remove very short terms
        )];

        return {
            name: [patient.name?.[0]?.given?.[0], patient.name?.[0]?.family]
                .filter(Boolean).join(' ') || 'Unknown',
            age: patient.birthDate ? 
                new Date().getFullYear() - new Date(patient.birthDate).getFullYear() : null,
            gender: patient.gender || 'unknown',
            conditions: uniqueConditions
        };
    } catch (error) {
        console.error('Error processing patient file:', error);
        throw error;
    }
}

/**
 * Main function
 */
async function main() {
    try {
        console.log('=== Patient-Specific Clinical Trial Matcher ===');
        
        // Process patient file
        console.log(`\n=== Processing Patient: ${path.basename(patientFile)} ===`);
        const patientData = processPatientFile(fullPatientPath);
        
        console.log(`Name: ${patientData.name}`);
        console.log(`Age: ${patientData.age || 'Unknown'}`);
        console.log(`Gender: ${patientData.gender}`);
        console.log(`Conditions: ${patientData.conditions.join(', ') || 'None'}`);

        if (patientData.conditions.length === 0) {
            console.log('\nNo conditions found for this patient.');
            return;
        }

        // Initialize the matcher
        console.log('\n=== Initializing Trial Matcher ===');
        const matcher = new TrialMatcher();
        await matcher.initialize();

        // Fetch trials specific to patient's conditions
        console.log('\n=== Fetching Relevant Clinical Trials ===');
        const trials = await fetchClinicalTrials(patientData.conditions);
        
        if (trials.length === 0) {
            console.log('No relevant trials found for the patient\'s conditions.');
            return;
        }

        // Process trials
        console.log(`\n=== Processing ${trials.length} Trials ===`);
        for (const trial of trials) {
            try {
                await matcher.processTrial(trial);
            } catch (error) {
                console.error(`  ✗ Error processing trial: ${trial.title.substring(0, 40)}...`);
            }
        }

        // Find matches
        console.log('\n=== Finding Best Matches ===');
        const matches = await matcher.findMatchingTrials(patientData, 3);
        
        if (matches.length > 0) {
            console.log('\n=== Top Matching Clinical Trials ===');
            matches.forEach((trial, idx) => {
                console.log(`\n${idx + 1}. ${trial.title}`);
                console.log(`   Match Score: ${trial.score?.toFixed(2) || 'N/A'}%`);
                console.log(`   Conditions: ${trial.conditions?.join(', ') || 'None'}`);
                console.log(`   Status: ${trial.status || 'Unknown'}`);
                console.log(`   URL: ${trial.url || 'No URL available'}`);
            });
        } else {
            console.log('No matching trials found for this patient.');
        }

    } catch (error) {
        console.error('\nError:', error.message);
        process.exit(1);
    }
}

// Run the script
main();
