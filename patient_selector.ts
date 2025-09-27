import { createClient } from '@supabase/supabase-js';
import { InsuranceRecommendationService, createPatientProfileFromDiagnosis } from './insurance_lookup.js';
import { extractPatientData, generateMedicalAnalysis } from './complete_analysis.js';
import * as readline from 'readline';
import 'dotenv/config';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

function validateConfig(): void {
    if (!SUPABASE_URL) {
        throw new Error('Missing SUPABASE_URL environment variable. Please set it to your Supabase project URL.');
    }
    if (!SUPABASE_ANON_KEY) {
        throw new Error('Missing SUPABASE_ANON_KEY environment variable. Please set it to your Supabase anon key.');
    }
    if (!process.env.OPENAI_API_KEY) {
        throw new Error('Missing OPENAI_API_KEY environment variable. Please set it to your OpenAI API key.');
    }
    
    try {
        new URL(SUPABASE_URL);
    } catch {
        throw new Error('Invalid SUPABASE_URL format. Please provide a valid URL.');
    }
}

// Validate configuration on module load
validateConfig();

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface PatientFile {
    name: string;
    size: number;
    lastModified: string;
}

async function listPatientsInBucket(bucketName: string = 'FHIR'): Promise<PatientFile[]> {
    try {
        console.log(`📋 Listing patient files in bucket: ${bucketName}`);
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .list('', {
                limit: 100,
                offset: 0,
                sortBy: { column: 'name', order: 'asc' }
            });
            
        if (error) {
            console.error('Detailed bucket listing error:', error);
            if (error.message.includes('not found')) {
                throw new Error(`Bucket '${bucketName}' not found. Please verify the bucket name exists in your Supabase project.`);
            }
            if (error.message.includes('not allowed')) {
                throw new Error(`Access denied to bucket '${bucketName}'. Please check your Supabase permissions and bucket policy.`);
            }
            throw new Error(`Supabase storage error: ${JSON.stringify(error)}`);
        }
        
        if (!data) {
            console.log(`⚠️ No data returned from bucket: ${bucketName}`);
            return [];
        }
        
        const patientFiles = data.filter(file => {
            const isJsonFile = file.name.endsWith('.json');
            const isNotEmpty = file.name !== '.emptyFolderPlaceholder';
            return isJsonFile && isNotEmpty;
        }).map(file => ({
            name: file.name,
            size: file.metadata?.size || 0,
            lastModified: file.updated_at || file.created_at || 'Unknown'
        }));
        
        console.log(`✅ Found ${patientFiles.length} patient files in bucket`);
        return patientFiles;
        
    } catch (error) {
        console.error('❌ Error listing files in bucket:', error);
        throw error;
    }
}

function extractPatientNameFromFilename(filename: string): string {
    // Extract patient name from filename pattern like "FirstName123_LastName456_..."
    const namePart = filename.split('_').slice(0, 2).join(' ');
    // Remove numbers from the name
    return namePart.replace(/\d+/g, '').replace(/_/g, ' ').trim();
}

function formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function formatDate(dateString: string): string {
    if (dateString === 'Unknown') return dateString;
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
    } catch {
        return dateString;
    }
}

async function selectPatientInteractively(patientFiles: PatientFile[]): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    return new Promise((resolve, reject) => {
        console.log('\n📋 Available Patient Files:');
        console.log('='.repeat(80));
        console.log('| # | Patient Name | File Size | Last Modified | Filename');
        console.log('='.repeat(80));
        
        patientFiles.forEach((file, index) => {
            const patientName = extractPatientNameFromFilename(file.name);
            const fileSize = formatFileSize(file.size);
            const lastModified = formatDate(file.lastModified);
            const truncatedFilename = file.name.length > 30 ? file.name.substring(0, 27) + '...' : file.name;
            
            console.log(`| ${(index + 1).toString().padEnd(2)} | ${patientName.padEnd(12)} | ${fileSize.padEnd(9)} | ${lastModified.padEnd(13)} | ${truncatedFilename}`);
        });
        
        console.log('='.repeat(80));
        
        rl.question(`\nEnter the number of the patient file you want to analyze (1-${patientFiles.length}): `, (answer) => {
            const selection = parseInt(answer.trim());
            
            if (isNaN(selection) || selection < 1 || selection > patientFiles.length) {
                rl.close();
                reject(new Error(`Invalid selection. Please enter a number between 1 and ${patientFiles.length}.`));
                return;
            }
            
            const selectedFile = patientFiles[selection - 1];
            const patientName = extractPatientNameFromFilename(selectedFile.name);
            
            console.log(`\n✅ Selected: ${patientName} (${selectedFile.name})`);
            rl.close();
            resolve(selectedFile.name);
        });
    });
}

async function uploadJsonToStorage(bucketName: string, fileName: string, jsonData: any): Promise<void> {
    try {
        console.log(`📤 Uploading ${fileName} to Supabase storage bucket: ${bucketName}`);
        
        const jsonString = JSON.stringify(jsonData, null, 2);
        const file = new File([jsonString], fileName, { type: 'application/json' });
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true // This will overwrite if file exists
            });
            
        if (error) {
            console.error('Detailed upload error:', error);
            if (error.message.includes('not found')) {
                throw new Error(`Bucket '${bucketName}' not found. Please create the bucket in your Supabase project.`);
            }
            if (error.message.includes('not allowed')) {
                throw new Error(`Access denied to bucket '${bucketName}'. Please check your Supabase permissions and bucket policy for INSERT operations.`);
            }
            throw new Error(`Supabase storage upload error: ${JSON.stringify(error)}`);
        }
        
        console.log(`✅ Successfully uploaded ${fileName} to bucket: ${bucketName}`);
        
    } catch (error) {
        console.error(`❌ Error uploading ${fileName} to storage:`, error);
        throw error;
    }
}

async function runPatientAnalysisWithInsurance(fileName: string, bucketName: string = 'FHIR'): Promise<void> {
    try {
        console.log('\n🚀 Starting Complete Patient Analysis with Insurance Lookup');
        console.log('='.repeat(70));
        
        const patientName = extractPatientNameFromFilename(fileName);
        console.log(`👤 Analyzing patient: ${patientName}`);
        console.log(`📂 File: ${fileName}`);
        console.log(`🗃️ Bucket: ${bucketName}`);
        
        // Step 1: Extract patient data
        console.log('\n📋 STEP 1: Extracting Patient Data');
        console.log('-'.repeat(40));
        const patientData = await extractPatientData(bucketName, fileName);
        console.log('✅ Patient data extracted successfully');
        
        // Step 2: Generate medical analysis
        console.log('\n🤖 STEP 2: Generating Medical Analysis');
        console.log('-'.repeat(40));
        const medicalReport = await generateMedicalAnalysis(patientData);
        console.log('✅ Medical analysis generated successfully');
        
        // Step 3: Generate insurance recommendations
        console.log('\n💰 STEP 3: Generating Insurance Recommendations');
        console.log('-'.repeat(40));
        
        try {
            const insuranceService = new InsuranceRecommendationService();
            
            // Use Atlanta GA ZIP code and $50,000 default income
            const zipCode = '30309'; // Atlanta, Georgia
            const income = 50000;
            
            console.log(`👤 Using default location: Atlanta, GA (ZIP ${zipCode}), Income $${income.toLocaleString()}`);
            
            // Create patient profile from diagnosis data with defaults
            const patientProfile = createPatientProfileFromDiagnosis(medicalReport, zipCode, income);
            console.log(`📋 Created patient profile for insurance analysis`);
            
            // Generate insurance recommendations
            const insuranceReport = await insuranceService.generateInsuranceReport(patientProfile);
            
            // Create combined comprehensive report
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const cleanPatientName = extractPatientNameFromFilename(fileName).replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '_');
            const comprehensiveFileName = `Complete_Analysis_${cleanPatientName}_${timestamp}.json`;
            
            const comprehensiveReport = {
                reportType: "Complete Patient Analysis with Insurance Recommendations",
                generatedAt: new Date().toISOString(),
                reportVersion: "2.0",
                patient: {
                    id: medicalReport.metadata.patientId,
                    name: medicalReport.metadata.patientName,
                    cleanName: cleanPatientName,
                    age: medicalReport.metadata.patientAge,
                    gender: medicalReport.metadata.patientGender,
                    location: {
                        zipCode: zipCode,
                        city: "Atlanta",
                        state: "Georgia"
                    }
                },
                medical: {
                    reportId: medicalReport.metadata.reportId,
                    diagnosis: medicalReport.diagnosis,
                    literature: medicalReport.literature,
                    searchQuery: medicalReport.searchQuery,
                    disclaimer: medicalReport.disclaimer
                },
                insurance: {
                    reportId: insuranceReport.metadata.reportId,
                    householdInfo: {
                        zipCode: insuranceReport.metadata.zipCode,
                        householdSize: insuranceReport.metadata.householdSize,
                        income: insuranceReport.metadata.income
                    },
                    medicalCodes: insuranceReport.medicalCodes,
                    availablePlansCount: insuranceReport.availablePlans,
                    recommendations: insuranceReport.recommendations,
                    summary: insuranceReport.summary
                },
                summary: {
                    urgencyLevel: medicalReport.diagnosis.urgencyLevel,
                    followUpNeeded: medicalReport.diagnosis.followUpNeeded,
                    riskFactorsCount: medicalReport.diagnosis.riskFactors?.length || 0,
                    topRecommendation: insuranceReport.recommendations[0]?.planName || 'No recommendations available',
                    estimatedAnnualHealthcareCost: insuranceReport.recommendations[0]?.estimatedAnnualCost || 0,
                    potentialSavings: insuranceReport.summary.estimatedSavings
                }
            };
            
            console.log('\n📤 Uploading comprehensive analysis to Supabase Storage...');
            await uploadJsonToStorage('Diagnosis', comprehensiveFileName, comprehensiveReport);
            
            // Display comprehensive results
            console.log('\n📊 COMPREHENSIVE ANALYSIS COMPLETE - RESULTS SUMMARY');
            console.log('='.repeat(70));
            console.log(`👤 Patient: ${patientName} (Age: ${medicalReport.metadata.patientAge})`);
            console.log(`🏥 Medical Conditions: ${medicalReport.diagnosis.riskFactors?.length || 0}`);
            console.log(`💊 Clinical Summary: ${medicalReport.diagnosis.clinicalSummary}`);
            console.log(`⚠️ Urgency Level: ${medicalReport.diagnosis.urgencyLevel?.toUpperCase()}`);
            console.log(`🔄 Follow-up: ${medicalReport.diagnosis.followUpNeeded}`);
            
            console.log('\n💰 INSURANCE RECOMMENDATIONS');
            console.log('-'.repeat(40));
            console.log(`📋 Medical Codes Identified: ${insuranceReport.medicalCodes.length}`);
            console.log(`🏥 Insurance Plans Available: ${insuranceReport.availablePlans}`);
            
            if (insuranceReport.recommendations.length > 0) {
                console.log('\n🏆 TOP RECOMMENDED PLANS:');
                insuranceReport.recommendations.slice(0, 3).forEach((plan: any, index: number) => {
                    console.log(`\n${index + 1}. ${plan.planName}`);
                    console.log(`   💵 Annual Cost: $${plan.estimatedAnnualCost.toLocaleString()}`);
                    console.log(`   ⭐ Score: ${plan.recommendationScore.toFixed(1)}/100`);
                    console.log(`   📊 Breakdown:`);
                    console.log(`      - Premiums: $${plan.breakdown.premiums.toLocaleString()}`);
                    console.log(`      - Deductible: $${plan.breakdown.deductible.toLocaleString()}`);
                    console.log(`      - Out-of-Pocket: $${plan.breakdown.outOfPocket.toLocaleString()}`);
                });
                
                const savings = insuranceReport.summary.estimatedSavings;
                if (savings > 0) {
                    console.log(`\n💡 Potential Savings: $${savings.toLocaleString()} annually by choosing the best plan!`);
                }
            }
            
            console.log('\n📁 COMPREHENSIVE REPORT GENERATED:');
            console.log(`   📄 Complete Analysis: Diagnosis/${comprehensiveFileName}`);
            
        } catch (insuranceError) {
            console.error('⚠️ Error generating insurance recommendations:', insuranceError);
            console.log('📋 Medical diagnosis completed successfully, but insurance analysis failed');
        }
        
        console.log('\n🎉 ANALYSIS PIPELINE COMPLETED SUCCESSFULLY!');
        console.log('='.repeat(70));
        
    } catch (error) {
        console.error('❌ Error in patient analysis pipeline:', error);
        throw error;
    }
}

async function main(): Promise<void> {
    // Parse command line arguments
    const args = process.argv.slice(2);
    let bucketName = 'FHIR';
    let fileName: string | undefined;
    
    try {
        console.log('🏥 RightTimeMD - Patient Analysis & Insurance Lookup Tool');
        console.log('='.repeat(60));
        
        // Check if first argument is a filename (ends with .json)
        if (args.length > 0 && args[0].endsWith('.json')) {
            fileName = args[0];
            bucketName = args[1] || 'FHIR';
            console.log(`📂 Using specified file: ${fileName}`);
            console.log(`🗃️ From bucket: ${bucketName}`);
        } else if (args.length > 0) {
            bucketName = args[0];
            console.log(`🗃️ Using bucket: ${bucketName}`);
        } else {
            console.log(`🗃️ Using default bucket: ${bucketName}`);
        }
        
        let selectedFileName: string;
        
        if (fileName) {
            // Use the specified filename directly
            selectedFileName = fileName;
            const patientName = extractPatientNameFromFilename(fileName);
            console.log(`👤 Selected patient: ${patientName}`);
        } else {
            // List available patient files and let user choose
            const patientFiles = await listPatientsInBucket(bucketName);
            
            if (patientFiles.length === 0) {
                console.log(`❌ No patient files found in bucket: ${bucketName}`);
                console.log('Please upload some FHIR JSON files to the bucket first.');
                console.log('\nUsage examples:');
                console.log('  npm run patient-selector                                    # Interactive mode');
                console.log('  npm run patient-selector filename.json                     # Direct file mode');
                console.log('  npm run patient-selector filename.json BUCKET_NAME        # Direct file with custom bucket');
                console.log('  npm run patient-selector BUCKET_NAME                       # Interactive mode with custom bucket');
                process.exit(1);
            }
            
            // Let user select a patient
            selectedFileName = await selectPatientInteractively(patientFiles);
        }
        
        // Run complete analysis with insurance lookup
        await runPatientAnalysisWithInsurance(selectedFileName, bucketName);
        
    } catch (error) {
        console.error('\n❌ FATAL ERROR:', error instanceof Error ? error.message : error);
        
        if (error instanceof Error) {
            if (error.message.includes('SUPABASE_URL') || error.message.includes('SUPABASE_ANON_KEY')) {
                console.log('\n🔧 Configuration Help:');
                console.log('1. Create a .env file in your project root');
                console.log('2. Add your Supabase credentials:');
                console.log('   SUPABASE_URL=https://your-project.supabase.co');
                console.log('   SUPABASE_ANON_KEY=your_anon_key_here');
                console.log('   OPENAI_API_KEY=your_openai_key_here');
            } else if (error.message.includes('Bucket') && error.message.includes('not found')) {
                console.log('\n🪣 Bucket Help:');
                console.log('1. Ensure the bucket exists in your Supabase project');
                console.log('2. Check the bucket name spelling');
                console.log('3. Verify bucket permissions allow read access');
            } else if (error.message.includes('not found') && fileName) {
                console.log('\n📂 File Help:');
                console.log(`1. Verify the file '${fileName}' exists in bucket '${bucketName}'`);
                console.log('2. Check the filename spelling and extension');
                console.log('3. Try running without a filename to see available files');
            }
        }
        
        process.exit(1);
    }
}

// Run the main function if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
    main().catch(error => {
        console.error('Unhandled error:', error);
        process.exit(1);
    });
}

export { main, selectPatientInteractively, runPatientAnalysisWithInsurance };