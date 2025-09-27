import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { BundleUtils } from '@smile-cdr/fhirts';
import { createClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { InsuranceRecommendationService, createPatientProfileFromDiagnosis } from './insurance_lookup.js';
import 'dotenv/config';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

// OpenAI configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

function validateConfig(): void {
    if (!SUPABASE_URL) {
        throw new Error('Missing SUPABASE_URL environment variable. Please set it to your Supabase project URL.');
    }
    if (!SUPABASE_ANON_KEY) {
        throw new Error('Missing SUPABASE_ANON_KEY environment variable. Please set it to your Supabase anon key.');
    }
    if (!OPENAI_API_KEY) {
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
const openai = new OpenAI({
    apiKey: OPENAI_API_KEY,
});

// Supabase storage helper functions
async function downloadJsonFromStorage(bucketName: string, fileName: string): Promise<string> {
    try {
        console.log(`📥 Downloading ${fileName} from Supabase storage bucket: ${bucketName}`);
        
        const { data, error } = await supabase.storage
            .from(bucketName)
            .download(fileName);
            
        if (error) {
            console.error('Detailed error:', error);
            if (error.message.includes('not found')) {
                throw new Error(`File '${fileName}' not found in bucket '${bucketName}'. Please verify the file name and bucket name.`);
            }
            if (error.message.includes('not allowed')) {
                throw new Error(`Access denied to bucket '${bucketName}'. Please check your Supabase permissions and bucket policy.`);
            }
            throw new Error(`Supabase storage error: ${JSON.stringify(error)}`);
        }
        
        if (!data) {
            throw new Error('No data received from Supabase storage');
        }
        
        const text = await data.text();
        
        // Validate that it's valid JSON
        try {
            JSON.parse(text);
        } catch (parseError) {
            throw new Error(`Downloaded file '${fileName}' is not valid JSON: ${parseError instanceof Error ? parseError.message : 'Unknown parsing error'}`);
        }
        
        console.log(`✅ Successfully downloaded ${fileName} (${text.length} characters)`);
        return text;
        
    } catch (error) {
        console.error(`❌ Error downloading ${fileName} from storage:`, error);
        throw error;
    }
}

async function listFilesInBucket(bucketName: string, prefix?: string): Promise<string[]> {
    try {
        console.log(`📋 Listing files in bucket: ${bucketName}${prefix ? ` with prefix: ${prefix}` : ''}`);
        
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
        
        const files = data.filter(file => {
            const isJsonFile = file.name.endsWith('.json');
            const matchesPrefix = !prefix || file.name.startsWith(prefix);
            return isJsonFile && matchesPrefix && file.name !== '.emptyFolderPlaceholder';
        }).map(file => file.name);
        
        console.log(`✅ Found ${files.length} JSON files in bucket`);
        if (files.length > 0) {
            console.log(`📋 Available files: ${files.slice(0, 5).join(', ')}${files.length > 5 ? '...' : ''}`);
        }
        return files;
        
    } catch (error) {
        console.error('❌ Error listing files in bucket:', error);
        throw error;
    }
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

// Import interfaces and functions from medical_diagnosis.ts
interface PatientData {
    patients: Array<{
        name: string;
        gender: string;
        birthDate: string;
        id: string;
    }>;
    observations: Array<{
        id: string;
        status: string;
        category: string[];
        code: string;
        effectiveDateTime: string;
        issued: string;
        subject: string;
        value: string;
        valueQuantity?: {
            value: number;
            unit: string;
            system: string;
            code: string;
        };
        valueCodeableConcept?: any;
        components?: any[];
        referenceRange?: any[];
        interpretation?: string[];
        performer?: string[];
    }>;
    conditions: Array<{
        code: string;
        clinicalStatus: string;
        onsetDateTime: string;
    }>;
    procedures: Array<{
        code: string;
        status: string;
        performedDateTime?: string;
    }>;
    encounters: Array<{
        type: string;
        status: string;
        class: string;
        period: string;
        reasons?: string[];
        diagnosisCount?: number;
        serviceType?: string;
        priority?: string;
    }>;
    medications: Array<{
        medication: string;
        status: string;
        authoredOn: string;
    }>;
    immunizations: Array<{
        vaccine: string;
        status: string;
        occurrenceDateTime: string;
    }>;
}

interface PubMedArticle {
    pmid: string;
    title: string;
    authors: string;
    journal: string;
    year: string;
    abstract: string;
    doi?: string;
    url: string;
}

async function callOpenAI(prompt: string, model: string = 'gpt-4o-mini'): Promise<string> {
    try {
        console.log(`🔍 Using OpenAI model: ${model}`);
        console.log(`📝 Prompt length: ${prompt.length} characters`);
        
        const completion = await openai.chat.completions.create({
            model: model,
            messages: [
                {
                    role: "user",
                    content: prompt
                }
            ],
            temperature: 0.3,
            max_tokens: 2000,
            top_p: 0.9
        });

        const response = completion.choices[0]?.message?.content;
        
        if (!response) {
            console.log('⚠️ No response content from OpenAI');
            return 'No response content returned from OpenAI';
        }
        
        console.log(`✅ Received response length: ${response.length} characters`);
        return response;
        
    } catch (error) {
        console.error('❌ Error calling OpenAI:', error);
        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

async function searchPubMed(query: string, maxResults: number = 3): Promise<PubMedArticle[]> {
    try {
        console.log(`🔍 Searching PubMed for: "${query}"`);
        
        // First, search for PMIDs
        const searchUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance`;
        
        const searchResponse = await fetch(searchUrl);
        if (!searchResponse.ok) {
            throw new Error(`PubMed search failed: ${searchResponse.status}`);
        }
        
        const searchData = await searchResponse.json();
        const pmids = searchData.esearchresult?.idlist || [];
        
        if (pmids.length === 0) {
            console.log('⚠️ No PubMed articles found for this query');
            return [];
        }
        
        console.log(`📚 Found ${pmids.length} relevant articles`);
        
        // Fetch detailed information for each PMID
        const detailsUrl = `https://eutils.ncbi.nlm.nih.gov/entrez/eutils/efetch.fcgi?db=pubmed&id=${pmids.join(',')}&rettype=xml&retmode=text`;
        
        const detailsResponse = await fetch(detailsUrl);
        if (!detailsResponse.ok) {
            throw new Error(`PubMed details fetch failed: ${detailsResponse.status}`);
        }
        
        const xmlData = await detailsResponse.text();
        
        // Parse XML data (simplified parsing for essential fields)
        const articles: PubMedArticle[] = [];
        
        for (const pmid of pmids) {
            try {
                // Extract article info using regex (simplified approach)
                const articleMatch = xmlData.match(new RegExp(`<PubmedArticle>.*?<PMID.*?>${pmid}</PMID>.*?</PubmedArticle>`, 's'));
                
                if (articleMatch) {
                    const articleXml = articleMatch[0];
                    
                    const titleMatch = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/s);
                    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Title not available';
                    
                    const journalMatch = articleXml.match(/<Title>(.*?)<\/Title>/);
                    const journal = journalMatch ? journalMatch[1] : 'Journal not available';
                    
                    const yearMatch = articleXml.match(/<PubDate>.*?<Year>(\d{4})<\/Year>/s);
                    const year = yearMatch ? yearMatch[1] : 'Year not available';
                    
                    const abstractMatch = articleXml.match(/<AbstractText.*?>(.*?)<\/AbstractText>/s);
                    const abstract = abstractMatch ? abstractMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 500) + '...' : 'Abstract not available';
                    
                    const authorMatches = articleXml.match(/<LastName>(.*?)<\/LastName>/g);
                    const authors = authorMatches ? 
                        authorMatches.slice(0, 3).map(match => match.replace(/<[^>]*>/g, '')).join(', ') + (authorMatches.length > 3 ? ' et al.' : '') 
                        : 'Authors not available';
                    
                    const doiMatch = articleXml.match(/<ArticleId IdType="doi">(.*?)<\/ArticleId>/);
                    const doi = doiMatch ? doiMatch[1] : undefined;
                    
                    articles.push({
                        pmid,
                        title,
                        authors,
                        journal,
                        year,
                        abstract,
                        doi,
                        url: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`
                    });
                }
            } catch (error) {
                console.log(`⚠️ Error parsing article ${pmid}:`, error);
            }
        }
        
        return articles;
        
    } catch (error) {
        console.error('❌ PubMed search error:', error);
        return [];
    }
}

function generateSearchQuery(conditions: string[], patientAge: number): string {
    const medicalConditions = conditions.filter(c => 
        !c.includes('Medication review') && 
        !c.includes('review due') &&
        c.trim().length > 0
    );
    
    if (medicalConditions.length === 0) {
        return `pediatric health assessment children age ${patientAge}`;
    }
    
    // Create a focused search query
    const primaryConditions = medicalConditions.slice(0, 2);
    const ageGroup = patientAge < 12 ? 'pediatric' : patientAge < 18 ? 'adolescent' : 'adult';
    
    return `${primaryConditions.join(' OR ')} ${ageGroup} treatment management`;
}

// Patient extraction function (from patient_extraction.ts)
async function extractPatientData(bucketName: string, fileName: string): Promise<PatientData> {
    try {
        console.log(`📋 Extracting patient data from: ${fileName} in bucket: ${bucketName}`);
        
        const fileContent = await downloadJsonFromStorage(bucketName, fileName);
        const bundle = JSON.parse(fileContent);
        
        // Initialize BundleUtils
        const bundleUtils = new BundleUtils();
        
        if (!bundle.entry) {
            throw new Error('No entries found in FHIR bundle');
        }
        
        // Get all resource types from the bundle
        const patients = bundleUtils.getResources(bundle.entry, 'Patient');
        const observations = bundleUtils.getResources(bundle.entry, 'Observation');
        const conditions = bundleUtils.getResources(bundle.entry, 'Condition');
        const procedures = bundleUtils.getResources(bundle.entry, 'Procedure');
        const encounters = bundleUtils.getResources(bundle.entry, 'Encounter');
        const medicationRequests = bundleUtils.getResources(bundle.entry, 'MedicationRequest');
        const immunizations = bundleUtils.getResources(bundle.entry, 'Immunization');
        
        // Convert to resource arrays
        const patientsArray = patients.map((entry: any) => entry.resource);
        const observationsArray = observations.map((entry: any) => entry.resource);
        const conditionsArray = conditions.map((entry: any) => entry.resource);
        const proceduresArray = procedures.map((entry: any) => entry.resource);
        const encountersArray = encounters.map((entry: any) => entry.resource);
        const medicationRequestsArray = medicationRequests.map((entry: any) => entry.resource);
        const immunizationsArray = immunizations.map((entry: any) => entry.resource);
        
        // Create structured data
        const fhirData: PatientData = {
            patients: patientsArray.map((p: any) => ({
                name: `${p.name?.[0]?.given?.join(' ')} ${p.name?.[0]?.family}`,
                gender: p.gender,
                birthDate: p.birthDate,
                id: p.id
            })),
            
            observations: observationsArray.map((o: any) => {
                const observation: any = {
                    id: o.id,
                    status: o.status,
                    category: o.category?.map((cat: any) => cat.coding?.[0]?.display || cat.text).filter(Boolean),
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
                    observation.components = o.component.map((comp: any) => ({
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
                    const componentSummary = o.component.map((comp: any) => {
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
                    observation.referenceRange = o.referenceRange.map((range: any) => ({
                        low: range.low,
                        high: range.high,
                        type: range.type?.coding?.[0]?.display || range.type?.text,
                        text: range.text
                    }));
                }
                
                // Add interpretation if available
                if (o.interpretation && o.interpretation.length > 0) {
                    observation.interpretation = o.interpretation.map((interp: any) => interp.coding?.[0]?.display || interp.text);
                }
                
                // Add performer if available
                if (o.performer && o.performer.length > 0) {
                    observation.performer = o.performer.map((perf: any) => perf.reference);
                }
                
                return observation;
            }).filter((o: any) => o.code),
            
            conditions: conditionsArray.map((c: any) => ({
                code: c.code?.coding?.[0]?.display || c.code?.text,
                clinicalStatus: c.clinicalStatus?.coding?.[0]?.code,
                onsetDateTime: c.onsetDateTime
            })).filter((c: any) => c.code),
            
            procedures: proceduresArray.map((p: any) => ({
                code: p.code?.coding?.[0]?.display || p.code?.text,
                status: p.status,
                performedDateTime: p.performedDateTime
            })).filter((p: any) => p.code),
            
            encounters: encountersArray.map((e: any) => {
                const encounter: any = {
                    type: e.type?.[0]?.coding?.[0]?.display,
                    status: e.status,
                    class: e.class?.code,
                    period: e.period?.start
                };
                
                // Add reason codes if available
                if (e.reasonCode && e.reasonCode.length > 0) {
                    encounter.reasons = e.reasonCode.map((rc: any) => rc.coding?.[0]?.display || rc.text).filter(Boolean);
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
            }).filter((e: any) => e.type),
            
            medications: medicationRequestsArray.map((m: any) => ({
                medication: m.medicationCodeableConcept?.coding?.[0]?.display || m.medicationCodeableConcept?.text,
                status: m.status,
                authoredOn: m.authoredOn
            })).filter((m: any) => m.medication),
            
            immunizations: immunizationsArray.map((i: any) => ({
                vaccine: i.vaccineCode?.coding?.[0]?.display || i.vaccineCode?.text,
                status: i.status,
                occurrenceDateTime: i.occurrenceDateTime
            })).filter((i: any) => i.vaccine)
        };
        
        return fhirData;
        
    } catch (error) {
        console.error('❌ Error extracting patient data:', error);
        throw error;
    }
}

async function generateMedicalAnalysis(patientData: PatientData): Promise<any> {
    try {
        console.log('🤖 Generating medical analysis...');
        
        // Get key data points for analysis
        const patient = patientData.patients[0];
        const birthDate = new Date(patient.birthDate);
        const today = new Date();
        const age = today.getFullYear() - birthDate.getFullYear();
        
        const vitalSigns = patientData.observations.filter(obs => 
            obs.category.includes('Vital signs')
        ).sort((a, b) => new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime());

        const labResults = patientData.observations.filter(obs => 
            obs.category.includes('Laboratory')
        ).sort((a, b) => new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime());
        
        // Filter out administrative/procedural conditions
        const actualMedicalConditions = patientData.conditions.filter(c => 
            !c.code.includes('Medication review due') && 
            !c.code.includes('review due') &&
            !c.code.includes('due (situation)')
        );
        
        const activeMedicalConditions = actualMedicalConditions.filter(c => c.clinicalStatus === 'active');
        
        // Filter out administrative procedures
        const actualMedicalProcedures = patientData.procedures.filter(p => 
            !p.code.includes('Medication reconciliation') &&
            !p.code.includes('reconciliation')
        );
        
        // Create a simplified patient summary for better model processing
        const patientSummary = `PATIENT: ${patient.name}, ${age} year old ${patient.gender}

KEY MEDICAL DATA:
- Active Medical Conditions: ${activeMedicalConditions.length} (${activeMedicalConditions.map(c => c.code).join(', ') || 'None'})
- Recent Vital Signs: Height ${vitalSigns.find(v => v.code === 'Body Height')?.value || 'N/A'}, Weight ${vitalSigns.find(v => v.code === 'Body Weight')?.value || 'N/A'}, BP: ${vitalSigns.find(v => v.code.includes('Blood pressure'))?.value || 'N/A'}
- Recent Lab Results: Hemoglobin ${labResults.find(l => l.code.includes('Hemoglobin'))?.value || 'N/A'}
- Current Medications: ${patientData.medications.length}
- Immunizations: Up to date

MEDICAL HISTORY:
- Past medical conditions: ${actualMedicalConditions.slice(0, 5).map(c => c.code).join(', ') || 'None documented'}
- Medical procedures: ${actualMedicalProcedures.slice(0, 5).map(p => p.code).join(', ') || 'Routine care only'}`;

        // Create medical analysis prompt for JSON output
        const medicalPrompt = `You are a medical expert. Analyze this patient case and respond with ONLY a valid JSON object in this exact format:

${patientSummary}

Respond with ONLY valid JSON in this structure:
{
  "clinicalSummary": "Brief summary of key clinical findings",
  "healthAssessment": "Overall health status assessment",
  "recommendations": [
    "Specific recommendation 1",
    "Specific recommendation 2", 
    "Specific recommendation 3"
  ],
  "riskFactors": ["risk factor 1", "risk factor 2"],
  "followUpNeeded": "timeframe for follow-up",
  "urgencyLevel": "low|moderate|high"
}

Provide ONLY the JSON object, no other text or formatting.`;

        console.log('🤖 Generating medical diagnosis with OpenAI...');
        console.log('⏳ This may take a moment...\n');
        
        // Generate search query for relevant literature
        const searchQuery = generateSearchQuery(actualMedicalConditions.map(c => c.code), age);
        
        // Run both diagnosis and literature search in parallel
        console.log('📚 Searching for relevant literature while generating diagnosis...\n');
        
        const [diagnosisText, pubmedArticles] = await Promise.all([
            callOpenAI(medicalPrompt),
            searchPubMed(searchQuery, 3)
        ]);
        
        // Parse the JSON response from the LLM
        let parsedDiagnosis;
        try {
            // Clean the response to extract JSON
            const cleanedResponse = diagnosisText.trim();
            const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                parsedDiagnosis = JSON.parse(jsonMatch[0]);
            } else {
                throw new Error('No JSON found in response');
            }
        } catch (error) {
            console.log('⚠️ Failed to parse JSON response, using fallback format');
            parsedDiagnosis = {
                clinicalSummary: diagnosisText.substring(0, 300) + '...',
                healthAssessment: 'Unable to parse structured assessment',
                recommendations: ['Consult with healthcare provider'],
                riskFactors: ['Unknown'],
                followUpNeeded: 'As needed',
                urgencyLevel: 'moderate'
            };
        }
        
        // Create comprehensive JSON report
        const medicalReport = {
            metadata: {
                reportId: `report_${Date.now()}`,
                generatedAt: new Date().toISOString(),
                patientId: patient.id,
                patientName: patient.name,
                patientAge: age,
                patientGender: patient.gender
            },
            diagnosis: parsedDiagnosis,
            literature: pubmedArticles.map(article => ({
                pmid: article.pmid,
                title: article.title,
                authors: article.authors,
                journal: article.journal,
                year: article.year,
                doi: article.doi,
                url: article.url,
                abstract: article.abstract
            })),
            searchQuery: searchQuery,
            disclaimer: "This analysis is generated by AI for educational purposes only. Always consult with qualified healthcare professionals for medical advice."
        };
        
        console.log('📊 MEDICAL ANALYSIS REPORT (JSON)');
        console.log('='.repeat(50));
        console.log(JSON.stringify(medicalReport, null, 2));
        console.log('='.repeat(50));
        
        // Generate unique filename with timestamp and patient ID
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const jsonFileName = `medical_analysis_${patient.id}_${timestamp}.json`;
        
        // Upload only JSON format to Diagnosis bucket
        console.log('\n📤 Uploading diagnosis to Supabase Storage...');
        await uploadJsonToStorage('Diagnosis', jsonFileName, medicalReport);
        
        // Also save locally for backup (optional)
        try {
            mkdirSync('./patient_json', { recursive: true });
            const jsonAnalysisPath = join('./patient_json', 'medical_analysis.json');
            writeFileSync(jsonAnalysisPath, JSON.stringify(medicalReport, null, 2), 'utf8');
            console.log(`💾 Local backup saved to: ${jsonAnalysisPath}`);
        } catch (error) {
            console.log('⚠️ Could not save local backup:', error);
        }
        
        console.log(`\n💾 Analysis saved to Supabase Storage:`);
        console.log(`   📋 JSON format: Diagnosis/${jsonFileName}`);
        
        // Return the medical report for insurance analysis
        return medicalReport;
        
    } catch (error) {
        console.error('❌ Error generating medical analysis:', error);
        throw error;
    }
}

// Main function that combines extraction and analysis
async function completeAnalysis(fhirFileName?: string, bucketName: string = 'FHIR'): Promise<void> {
    try {
        console.log('🚀 Starting Complete Patient Analysis Pipeline');
        console.log('=' .repeat(60));
        
        // Step 1: Extract patient data from FHIR file in Supabase storage
        console.log('📋 STEP 1: Extracting Patient Data from Supabase Storage');
        console.log('-'.repeat(40));
        
        let fileName: string;
        
        if (fhirFileName) {
            fileName = fhirFileName;
            console.log(`📂 Attempting to download specified file: ${fileName}`);
        } else {
            // Only list files if no filename is provided
            console.log('📋 No filename provided, listing available files...');
            const availableFiles = await listFilesInBucket(bucketName);
            
            if (availableFiles.length === 0) {
                throw new Error(`No JSON files found in bucket: ${bucketName}`);
            }
            
            fileName = availableFiles[0];
            console.log(`📂 Using first available file: ${fileName}`);
        }
        
        console.log(`📂 Using FHIR file: ${fileName} from bucket: ${bucketName}`);
        const patientData = await extractPatientData(bucketName, fileName);
        
        // Ensure patient_json directory exists
        try {
            mkdirSync('./patient_json', { recursive: true });
        } catch (error) {
            // Directory already exists
        }
        
        // Save extracted patient data
        const patientDataPath = join('./patient_json', 'patient_data.json');
        writeFileSync(patientDataPath, JSON.stringify(patientData, null, 2), 'utf8');
        console.log(`✅ Patient data extracted and saved to: ${patientDataPath}`);
        
        // Step 2: Generate medical analysis
        console.log('\n🤖 STEP 2: Generating Medical Analysis');
        console.log('-'.repeat(40));
        
        const medicalReport = await generateMedicalAnalysis(patientData);
        
        // Step 3: Generate insurance recommendations
        console.log('\n💰 STEP 3: Generating Insurance Recommendations');
        console.log('-'.repeat(40));
        
        try {
            const insuranceService = new InsuranceRecommendationService();
            
            // Create patient profile from diagnosis data
            const patientProfile = createPatientProfileFromDiagnosis(medicalReport, '10001', 50000);
            console.log('👤 Created patient profile for insurance analysis');
            
            // Generate insurance recommendations
            const insuranceReport = await insuranceService.generateInsuranceReport(patientProfile);
            
            // Upload insurance report to Supabase
            const insuranceTimestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const insuranceFileName = `insurance_analysis_${medicalReport.metadata.patientId}_${insuranceTimestamp}.json`;
            
            console.log('\n📤 Uploading insurance analysis to Supabase Storage...');
            await uploadJsonToStorage('Diagnosis', insuranceFileName, insuranceReport);
            
            console.log(`\n💾 Insurance analysis saved to Supabase Storage:`);
            console.log(`   📋 JSON format: Diagnosis/${insuranceFileName}`);
            
            // Display insurance recommendations summary
            console.log('\n💰 INSURANCE RECOMMENDATIONS SUMMARY');
            console.log('='.repeat(50));
            console.log(`📋 Medical Codes Identified: ${insuranceReport.medicalCodes.length}`);
            console.log(`🏥 Insurance Plans Available: ${insuranceReport.availablePlans}`);
            if (insuranceReport.recommendations.length > 0) {
                const bestPlan = insuranceReport.recommendations[0];
                console.log(`🏆 Best Plan: ${bestPlan.planName}`);
                console.log(`💵 Estimated Annual Cost: $${bestPlan.estimatedAnnualCost.toFixed(2)}`);
                console.log(`⭐ Recommendation Score: ${bestPlan.recommendationScore.toFixed(1)}/100`);
            }
            console.log('='.repeat(50));
            
        } catch (insuranceError) {
            console.error('⚠️ Error generating insurance recommendations:', insuranceError);
            console.log('📋 Medical diagnosis completed successfully, but insurance analysis failed');
        }
        
        console.log('\n🎉 COMPLETE ANALYSIS PIPELINE FINISHED');
        console.log('=' .repeat(60));
        console.log('✅ Patient data extraction: Complete');
        console.log('✅ Medical diagnosis: Complete');
        console.log('✅ Literature search: Complete');
        console.log('✅ Insurance recommendations: Complete');
        console.log('✅ JSON reports: Generated');
        
    } catch (error) {
        console.error('❌ Error in complete analysis pipeline:', error);
        process.exit(1);
    }
}

// Run the complete analysis if this file is executed directly

// Get command line arguments
const args = process.argv.slice(2);
const fhirFileName = args[0]; // First argument is the FHIR filename
const bucketName = args[1] || 'FHIR'; // Second argument is the bucket name (optional)

if (import.meta.url === `file://${process.argv[1]}`) {
    if (fhirFileName && !fhirFileName.endsWith('.json')) {
        console.error('❌ Error: Please provide a valid JSON filename');
        console.log('Usage: npm run complete-analysis [filename.json] [bucket-name]');
        console.log('Example: npm run complete-analysis Winter723_Rachel885_Lubowitz58_ed2d2952-1e77-77d9-747e-778eb0c0ccf6.json fhir-data');
        console.log('If no filename is provided, the first available file in the bucket will be used.');
        console.log('\nEnvironment Variables Required:');
        console.log('  SUPABASE_URL=your_supabase_project_url');
        console.log('  SUPABASE_ANON_KEY=your_supabase_anon_key');
        process.exit(1);
    }
    
    completeAnalysis(fhirFileName, bucketName).catch(error => {
        console.error('\n❌ FATAL ERROR:', error instanceof Error ? error.message : error);
        
        if (error instanceof Error) {
            if (error.message.includes('SUPABASE_URL') || error.message.includes('SUPABASE_ANON_KEY')) {
                console.log('\n🔧 Configuration Help:');
                console.log('1. Create a .env file in your project root');
                console.log('2. Add your Supabase credentials:');
                console.log('   SUPABASE_URL=https://your-project.supabase.co');
                console.log('   SUPABASE_ANON_KEY=your_anon_key_here');
                console.log('3. Make sure to load environment variables before running this script');
            } else if (error.message.includes('Bucket') && error.message.includes('not found')) {
                console.log('\n🪣 Bucket Help:');
                console.log('1. Ensure the bucket exists in your Supabase project');
                console.log('2. Check the bucket name spelling');
                console.log('3. Verify bucket permissions allow read access');
            } else if (error.message.includes('Access denied')) {
                console.log('\n🔐 Permission Help:');
                console.log('1. Check your bucket policies in Supabase Storage');
                console.log('2. Ensure your anon key has read access to the bucket');
                console.log('3. Verify the bucket is publicly accessible or properly configured');
            }
        }
        
        process.exit(1);
    });
}

export { completeAnalysis, extractPatientData, generateMedicalAnalysis };