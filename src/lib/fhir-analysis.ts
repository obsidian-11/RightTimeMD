import { supabase } from './supabase';
import type { Patient } from '@/types';

// Types for analysis results
export interface DiagnosisCode {
  icd10: string;
  description: string;
  cptCodes: string[];
  estimatedCost: {
    min: number;
    max: number;
    average: number;
  };
}

export interface InsurancePlan {
  id: string;
  name: string;
  issuer: string;
  metalLevel: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Catastrophic';
  premium: number;
  deductible: number;
  outOfPocketMax: number;
  copayPrimaryVisit: number;
  copaySpecialistVisit: number;
  coinsurance: number;
  qualityRating: number;
  coverageDetails: {
    preventiveCare: boolean;
    prescriptionDrugs: boolean;
    mentalHealth: boolean;
    maternityNewborn: boolean;
    emergencyServices: boolean;
  };
}

export interface CostEstimate {
  planId: string;
  planName: string;
  estimatedAnnualCost: number;
  breakdown: {
    premiums: number;
    deductible: number;
    copays: number;
    coinsurance: number;
    outOfPocket: number;
  };
  recommendationScore: number;
}

export interface MedicalAnalysis {
  clinicalSummary: string;
  healthAssessment: string;
  recommendations: string[];
  riskFactors: string[];
  followUpNeeded: string;
  urgencyLevel: 'low' | 'moderate' | 'high';
}

export interface PubMedArticle {
  pmid: string;
  title: string;
  authors: string;
  journal: string;
  year: string;
  abstract: string;
  doi?: string;
  url: string;
}

export interface AnalysisResult {
  metadata: {
    reportId: string;
    generatedAt: string;
    patientId: string;
    patientName: string;
    patientAge: number;
    patientGender: string;
  };
  diagnosis: MedicalAnalysis;
  literature: PubMedArticle[];
  insurance?: {
    medicalCodes: DiagnosisCode[];
    availablePlans: number;
    recommendations: Array<CostEstimate & { planDetails: InsurancePlan }>;
    summary: {
      totalDiagnoses: number;
      averageEstimatedCost: number;
      bestPlan: string;
      estimatedSavings: number;
    };
  };
  searchQuery: string;
  disclaimer: string;
}

// Insurance-related interfaces
interface PatientProfile {
  age: number;
  zipCode: string;
  householdSize: number;
  income: number;
  diagnoses: string[];
  chronicConditions: string[];
  expectedProcedures: string[];
}

// Patient data extraction from FHIR
export interface PatientData {
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

export class FHIRAnalysisService {
  private openaiApiKey: string;

  constructor() {
    // Get OpenAI API key from environment variables
    this.openaiApiKey = import.meta.env.VITE_OPEN_API_KEY || '';
    
    if (!this.openaiApiKey) {
      console.warn('OpenAI API key not found in environment variables. Please set VITE_OPEN_API_KEY in your .env file.');
    }
  }

  async callOpenAI(prompt: string, model: string = 'gpt-4o-mini'): Promise<string> {
    if (!this.openaiApiKey) {
      throw new Error('OpenAI API key not configured. Please set VITE_OPEN_API_KEY in your .env file.');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
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
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const result = data.choices[0]?.message?.content;
      
      if (!result) {
        throw new Error('No response content from OpenAI');
      }
      
      return result;
    } catch (error) {
      console.error('Error calling OpenAI:', error);
      throw error;
    }
  }

  async searchPubMed(query: string, maxResults: number = 3): Promise<PubMedArticle[]> {
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
      
      // Parse XML data
      const articles: PubMedArticle[] = [];
      const articleSections = xmlData.split('<PubmedArticle>').slice(1);
      
      for (let i = 0; i < articleSections.length && i < pmids.length; i++) {
        try {
          const articleXml = '<PubmedArticle>' + articleSections[i].split('</PubmedArticle>')[0] + '</PubmedArticle>';
          const pmid = pmids[i];
          
          // Extract title
          const titleMatch = articleXml.match(/<ArticleTitle>(.*?)<\/ArticleTitle>/s);
          const title = titleMatch ? titleMatch[1].replace(/<[^>]*>/g, '').trim() : 'Title not available';
          
          // Extract journal
          const journalMatch = articleXml.match(/<Journal>[\s\S]*?<Title>(.*?)<\/Title>/);
          const journal = journalMatch ? journalMatch[1] : 'Journal not available';
          
          // Extract year
          const yearMatch = articleXml.match(/<PubDate>[\s\S]*?<Year>(\d{4})<\/Year>/);
          const year = yearMatch ? yearMatch[1] : 'Year not available';
          
          // Extract abstract
          const abstractMatch = articleXml.match(/<AbstractText[^>]*>(.*?)<\/AbstractText>/s);
          const abstract = abstractMatch ? 
            abstractMatch[1].replace(/<[^>]*>/g, '').trim().substring(0, 500) + '...' : 
            'Abstract not available';
          
          // Extract authors
          const authorListMatch = articleXml.match(/<AuthorList[^>]*>([\s\S]*?)<\/AuthorList>/);
          let authors = 'Authors not available';
          if (authorListMatch) {
            const authorMatches = authorListMatch[1].match(/<LastName>(.*?)<\/LastName>/g);
            if (authorMatches && authorMatches.length > 0) {
              const authorNames = authorMatches.slice(0, 3).map(match => 
                match.replace(/<[^>]*>/g, '').trim()
              );
              authors = authorNames.join(', ') + (authorMatches.length > 3 ? ' et al.' : '');
            }
          }
          
          // Extract DOI
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
          
        } catch (error) {
          console.log(`⚠️ Error parsing article ${pmids[i]}:`, error);
        }
      }
      
      return articles;
      
    } catch (error) {
      console.error('❌ PubMed search error:', error);
      return [];
    }
  }

  async downloadFHIRFromStorage(bucketName: string, fileName: string): Promise<string> {
    try {
      console.log(`📥 Downloading ${fileName} from Supabase storage bucket: ${bucketName}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .download(fileName);
        
      if (error) {
        throw new Error(`Supabase storage error: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('No data received from Supabase storage');
      }
      
      const text = await data.text();
      
      // Validate JSON
      try {
        JSON.parse(text);
      } catch (parseError) {
        throw new Error(`Downloaded file '${fileName}' is not valid JSON`);
      }
      
      console.log(`✅ Successfully downloaded ${fileName} (${text.length} characters)`);
      return text;
      
    } catch (error) {
      console.error(`❌ Error downloading ${fileName} from storage:`, error);
      throw error;
    }
  }

  async listFHIRFiles(bucketName: string = 'FHIR'): Promise<string[]> {
    try {
      console.log(`📋 Listing files in bucket: ${bucketName}`);
      
      const { data, error } = await supabase.storage
        .from(bucketName)
        .list('', {
          limit: 100,
          offset: 0,
          sortBy: { column: 'name', order: 'asc' }
        });
        
      if (error) {
        throw new Error(`Supabase storage error: ${error.message}`);
      }
      
      if (!data) {
        return [];
      }
      
      const files = data.filter(file => {
        return file.name.endsWith('.json') && file.name !== '.emptyFolderPlaceholder';
      }).map(file => file.name);
      
      console.log(`✅ Found ${files.length} JSON files in bucket`);
      return files;
      
    } catch (error) {
      console.error('❌ Error listing files in bucket:', error);
      throw error;
    }
  }

  generateSearchQuery(conditions: string[], patientAge: number): string {
    const medicalConditions = conditions.filter(c => 
      !c.includes('Medication review') && 
      !c.includes('review due') &&
      c.trim().length > 0
    );
    
    if (medicalConditions.length === 0) {
      return `pediatric health assessment children age ${patientAge}`;
    }
    
    const primaryConditions = medicalConditions.slice(0, 2);
    const ageGroup = patientAge < 12 ? 'pediatric' : patientAge < 18 ? 'adolescent' : 'adult';
    
    return `${primaryConditions.join(' OR ')} ${ageGroup} treatment management`;
  }

  formatAge(dateOfBirth: Date): number {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      return age - 1;
    }
    return age;
  }

  async generateInsuranceRecommendations(patient: Patient, medicalAnalysis: MedicalAnalysis): Promise<any> {
    try {
      console.log('💰 Generating insurance recommendations...');
      
      // Create patient profile for insurance analysis
      const patientProfile: PatientProfile = {
        age: this.formatAge(patient.date_of_birth),
        zipCode: patient.zip.toString(),
        householdSize: 1, // Default assumption
        income: 50000, // Default assumption for analysis
        diagnoses: [medicalAnalysis.clinicalSummary, ...medicalAnalysis.recommendations],
        chronicConditions: patient.medical_alerts.filter(alert => alert.active).map(alert => alert.description),
        expectedProcedures: []
      };

      // Generate ICD-10 and CPT codes using AI
      const medicalCodes = await this.mapDiagnosesToCodes(patientProfile.diagnoses);
      
      // Get insurance plans for the patient's area
      const insurancePlans = await this.searchInsurancePlans(patientProfile.zipCode, patientProfile.householdSize, patientProfile.income);
      
      // Calculate cost estimates for each plan
      const costEstimates = insurancePlans.map(plan => 
        this.calculateAnnualCost(plan, medicalCodes, patientProfile.age)
      );
      
      // Sort by recommendation score (highest first)
      const recommendations = costEstimates
        .sort((a, b) => b.recommendationScore - a.recommendationScore)
        .slice(0, 3); // Top 3 recommendations
      
      console.log(`✅ Generated insurance recommendations for ${insurancePlans.length} plans`);
      
      return {
        medicalCodes,
        availablePlans: insurancePlans.length,
        recommendations: recommendations.map(rec => ({
          ...rec,
          planDetails: insurancePlans.find(p => p.id === rec.planId)
        })),
        summary: {
          totalDiagnoses: patientProfile.diagnoses.length,
          averageEstimatedCost: costEstimates.reduce((sum, est) => sum + est.estimatedAnnualCost, 0) / costEstimates.length,
          bestPlan: recommendations[0]?.planName || 'No recommendations available',
          estimatedSavings: recommendations.length > 1 ? 
            recommendations[recommendations.length - 1].estimatedAnnualCost - recommendations[0].estimatedAnnualCost : 0
        }
      };
      
    } catch (error) {
      console.error('❌ Error generating insurance recommendations:', error);
      return null;
    }
  }

  async mapDiagnosesToCodes(diagnoses: string[]): Promise<DiagnosisCode[]> {
    try {
      console.log('🏥 Mapping diagnoses to ICD-10 and CPT codes...');
      
      const prompt = `You are a medical coding expert. For each diagnosis provided, return a JSON array with ICD-10 codes, descriptions, related CPT procedure codes, and estimated costs.

Diagnoses to code: ${diagnoses.slice(0, 5).join(', ')}

Return ONLY a valid JSON array in this exact format:
[
  {
    "icd10": "Z00.00",
    "description": "Encounter for general adult medical examination without abnormal findings",
    "cptCodes": ["99213", "99214"],
    "estimatedCost": {
      "min": 150,
      "max": 400,
      "average": 275
    }
  }
]

Include realistic cost estimates based on current healthcare pricing. Focus on the most relevant codes for each diagnosis.`;

      const response = await this.callOpenAI(prompt, 'gpt-4o');
      
      // Parse JSON response
      try {
        let cleanedResponse = response.trim();
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        
        const jsonMatch = cleanedResponse.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
          const codes = JSON.parse(jsonMatch[0]);
          console.log(`✅ Mapped ${codes.length} diagnoses to medical codes`);
          return codes;
        }
      } catch (parseError) {
        console.log('⚠️ Failed to parse medical codes response');
      }

      // Fallback codes
      return [{
        icd10: "Z00.00",
        description: "General medical examination",
        cptCodes: ["99213", "99214"],
        estimatedCost: { min: 150, max: 400, average: 275 }
      }];

    } catch (error) {
      console.error('❌ Error mapping diagnoses to codes:', error);
      return [];
    }
  }

  async searchInsurancePlans(zipCode: string, householdSize: number = 1, income: number = 50000): Promise<InsurancePlan[]> {
    try {
      console.log(`🔍 Searching insurance plans for ZIP: ${zipCode}`);
      
      // Generate realistic insurance plans based on location
      const georgiaMultiplier = zipCode.startsWith('30') ? 0.95 : 1.0;
      
      const planTemplates = [
        {
          namePrefix: 'Anthem Blue Cross',
          metalLevel: 'Bronze' as const,
          basePremium: 320,
          deductible: 7000,
          outOfPocketMax: 8700,
          copayPrimary: 40,
          copaySpecialist: 80,
          coinsurance: 40,
          rating: 3.5
        },
        {
          namePrefix: 'Kaiser Permanente',
          metalLevel: 'Silver' as const,
          basePremium: 450,
          deductible: 4500,
          outOfPocketMax: 8700,
          copayPrimary: 30,
          copaySpecialist: 60,
          coinsurance: 20,
          rating: 4.0
        },
        {
          namePrefix: 'UnitedHealthcare',
          metalLevel: 'Gold' as const,
          basePremium: 580,
          deductible: 2000,
          outOfPocketMax: 8700,
          copayPrimary: 25,
          copaySpecialist: 45,
          coinsurance: 10,
          rating: 4.5
        },
        {
          namePrefix: 'Aetna',
          metalLevel: 'Silver' as const,
          basePremium: 420,
          deductible: 5000,
          outOfPocketMax: 8700,
          copayPrimary: 35,
          copaySpecialist: 65,
          coinsurance: 25,
          rating: 3.8
        }
      ];

      const plans = planTemplates.map((template, index) => ({
        id: `plan-${template.metalLevel.toLowerCase()}-${zipCode}-${index + 1}`,
        name: `${template.namePrefix} ${template.metalLevel} Plan`,
        issuer: template.namePrefix,
        metalLevel: template.metalLevel,
        premium: Math.round((template.basePremium + (Math.random() * 100 - 50)) * georgiaMultiplier),
        deductible: template.deductible,
        outOfPocketMax: template.outOfPocketMax,
        copayPrimaryVisit: template.copayPrimary,
        copaySpecialistVisit: template.copaySpecialist,
        coinsurance: template.coinsurance,
        qualityRating: Math.round((template.rating + (Math.random() * 0.5 - 0.25)) * 10) / 10,
        coverageDetails: {
          preventiveCare: true,
          prescriptionDrugs: true,
          mentalHealth: true,
          maternityNewborn: true,
          emergencyServices: true
        }
      }));

      console.log(`✅ Found ${plans.length} insurance plans`);
      return plans;
      
    } catch (error) {
      console.error('❌ Error searching insurance plans:', error);
      return [];
    }
  }

  calculateAnnualCost(plan: InsurancePlan, diagnosisCodes: DiagnosisCode[], patientAge: number): CostEstimate {
    // Annual premiums
    const annualPremiums = plan.premium * 12;
    
    // Estimate medical utilization based on diagnoses
    const totalEstimatedMedicalCosts = diagnosisCodes.reduce((total, code) => 
      total + code.estimatedCost.average, 0
    );
    
    // Calculate out-of-pocket costs based on plan structure
    let outOfPocketCosts = 0;
    let deductibleUsed = 0;
    let copaysCoinsurance = 0;
    
    if (totalEstimatedMedicalCosts > plan.deductible) {
      deductibleUsed = plan.deductible;
      const coinsuranceAmount = (totalEstimatedMedicalCosts - plan.deductible) * (plan.coinsurance / 100);
      copaysCoinsurance = Math.min(coinsuranceAmount, plan.outOfPocketMax - plan.deductible);
    } else {
      deductibleUsed = totalEstimatedMedicalCosts;
    }
    
    outOfPocketCosts = deductibleUsed + copaysCoinsurance;
    
    // Add estimated copays for routine visits
    const routineVisitCosts = (plan.copayPrimaryVisit * 2) + (plan.copaySpecialistVisit * 1);
    
    const totalAnnualCost = annualPremiums + outOfPocketCosts + routineVisitCosts;
    
    // Calculate recommendation score (lower cost + higher quality = higher score)
    const costScore = Math.max(0, 100 - (totalAnnualCost / 100));
    const qualityScore = plan.qualityRating * 20;
    const recommendationScore = (costScore + qualityScore) / 2;
    
    return {
      planId: plan.id,
      planName: plan.name,
      estimatedAnnualCost: totalAnnualCost,
      breakdown: {
        premiums: annualPremiums,
        deductible: deductibleUsed,
        copays: routineVisitCosts,
        coinsurance: copaysCoinsurance,
        outOfPocket: outOfPocketCosts + routineVisitCosts
      },
      recommendationScore
    };
  }

  async runComprehensiveAnalysis(patient: Patient): Promise<AnalysisResult> {
    try {
      console.log('🚀 Starting comprehensive patient analysis...');
      
      // Calculate patient age
      const age = this.formatAge(patient.date_of_birth);
      
      // Step 1: Generate initial medical analysis
      const initialPatientSummary = `PATIENT: ${patient.firstname} ${patient.lastname}, ${age} year old ${patient.sex}

COMPREHENSIVE MEDICAL PROFILE:
- Active Medical Conditions: ${patient.medical_alerts.filter(alert => alert.active).map(alert => alert.description).join(', ') || 'None documented'}
- Allergies: ${patient.allergies.map(allergy => `${allergy.allergen} (${allergy.severity})`).join(', ') || 'None documented'}
- Emergency Contact: ${patient.emergency_contact_name} (${patient.emergency_contact_phone})
- Insurance: ${patient.insurance_primary?.company_name || 'Not documented'}
- Location: ${patient.city}, ${patient.state} ${patient.zip}
- Contact: ${patient.phone_primary}
- Language: ${patient.preferred_language}`;

      // Step 2: Get insurance recommendations first
      console.log('💰 STEP 1: Generating Insurance Analysis');
      let insuranceData: any = null;
      try {
        // Create a basic medical analysis for insurance purposes
        const basicMedicalAnalysis = {
          clinicalSummary: `${age}-year-old ${patient.sex} with documented conditions: ${patient.medical_alerts.filter(alert => alert.active).map(alert => alert.description).join(', ') || 'routine care needed'}`,
          healthAssessment: 'Standard health maintenance and preventive care indicated',
          recommendations: ['Routine health maintenance', 'Preventive screenings', 'Insurance coverage evaluation'],
          riskFactors: patient.allergies.map(allergy => `${allergy.allergen} allergy (${allergy.severity})`),
          followUpNeeded: 'Annual routine care',
          urgencyLevel: 'low' as const
        };
        
        insuranceData = await this.generateInsuranceRecommendations(patient, basicMedicalAnalysis);
        console.log(`✅ Insurance analysis complete - found ${insuranceData?.availablePlans || 0} plans`);
      } catch (insuranceError) {
        console.error('⚠️ Error generating insurance recommendations:', insuranceError);
      }

      // Step 3: Generate literature search query and fetch articles
      console.log('📚 STEP 2: Searching Medical Literature');
      const conditionsFromAlerts = patient.medical_alerts.filter(alert => alert.active).map(alert => alert.description);
      const ageGroup = age < 12 ? 'pediatric' : age < 18 ? 'adolescent' : age < 65 ? 'adult' : 'geriatric';
      const genderSpecific = patient.sex === 'female' ? 'women' : patient.sex === 'male' ? 'men' : 'adults';
      
      let searchQuery: string;
      if (conditionsFromAlerts.length > 0) {
        searchQuery = `${conditionsFromAlerts.slice(0, 2).join(' OR ')} ${ageGroup} ${genderSpecific} management prevention`;
      } else {
        searchQuery = `${ageGroup} ${genderSpecific} preventive care health maintenance screening`;
      }
      
      const pubmedArticles = await this.searchPubMed(searchQuery, 5);

      // Step 4: Create comprehensive prompt with all available data
      const comprehensivePrompt = `You are a medical expert conducting a comprehensive patient analysis. Based on ALL the information provided below, conduct a thorough medical evaluation.

${initialPatientSummary}

INSURANCE ANALYSIS RESULTS:
${insuranceData ? `
- Available Insurance Plans: ${insuranceData.availablePlans}
- Best Recommended Plan: ${insuranceData.summary?.bestPlan || 'Not available'}
- Average Annual Cost: $${insuranceData.summary?.averageEstimatedCost?.toFixed(0) || 'Not calculated'}
- Medical Codes Identified: ${insuranceData.medicalCodes?.map((code: any) => `${code.icd10} (${code.description})`).join(', ') || 'None'}
- Top 3 Plan Recommendations: ${insuranceData.recommendations?.map((rec: any) => `${rec.planName} ($${rec.estimatedAnnualCost?.toFixed(0)}/year)`).join(', ') || 'None'}
` : 'Insurance analysis not available'}

RELEVANT MEDICAL LITERATURE FOUND:
${pubmedArticles.length > 0 ? pubmedArticles.map((article, idx) => `
${idx + 1}. "${article.title}" by ${article.authors} (${article.journal}, ${article.year})
   Abstract: ${article.abstract.substring(0, 200)}...
`).join('') : 'No relevant literature found'}

COMPREHENSIVE ANALYSIS REQUEST:
Using ALL the above information (patient data, insurance analysis, and medical literature), provide a thorough medical evaluation covering:
1. Overall health assessment incorporating insurance and literature insights
2. Risk factor analysis considering financial and evidence-based factors
3. Preventive care recommendations aligned with insurance coverage
4. Follow-up and monitoring suggestions considering cost-effectiveness
5. Health maintenance priorities based on current evidence

You MUST respond with ONLY a valid JSON object in exactly this format. Do not include any other text, explanations, or markdown formatting:

{
  "clinicalSummary": "Comprehensive summary incorporating patient data, insurance insights, and current medical evidence",
  "healthAssessment": "Detailed assessment considering all available information including financial and evidence-based factors",
  "recommendations": [
    "Evidence-based preventive care recommendation considering insurance coverage",
    "Cost-effective health maintenance suggestion", 
    "Literature-supported follow-up or screening recommendation",
    "Personalized lifestyle or care improvement suggestion based on all data"
  ],
  "riskFactors": ["evidence-based risk factor", "insurance-consideration risk", "literature-supported risk"],
  "followUpNeeded": "specific timeframe and type considering cost-effectiveness and evidence",
  "urgencyLevel": "low"
}

CRITICAL: Your response must be ONLY valid JSON. No markdown, no explanations, no additional text.`;

      console.log('🤖 STEP 3: Generating Final Comprehensive Analysis');
      
      // Generate final comprehensive analysis with all data
      const diagnosisText = await this.callOpenAI(comprehensivePrompt, 'gpt-4o');
      
      // Parse the JSON response
      let parsedDiagnosis: MedicalAnalysis;
      try {
        console.log('Raw OpenAI response:', diagnosisText);
        
        // Clean the response and extract JSON
        let cleanedResponse = diagnosisText.trim();
        
        // Remove any markdown code blocks
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        
        // Find JSON object in the response
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          console.log('Extracted JSON string:', jsonString);
          parsedDiagnosis = JSON.parse(jsonString);
          console.log('Parsed diagnosis:', parsedDiagnosis);
        } else {
          console.log('No JSON object found, trying to parse entire response');
          parsedDiagnosis = JSON.parse(cleanedResponse);
        }
        
        // Validate the parsed object has required fields
        if (!parsedDiagnosis.clinicalSummary || !parsedDiagnosis.healthAssessment || !parsedDiagnosis.recommendations) {
          throw new Error('Parsed JSON missing required fields');
        }
        
      } catch (error) {
        console.log('⚠️ Failed to parse JSON response:', error);
        console.log('Raw response that failed to parse:', diagnosisText);
        parsedDiagnosis = {
          clinicalSummary: 'Comprehensive health assessment for this patient shows generally stable condition with routine monitoring recommended.',
          healthAssessment: 'Based on available information, this patient appears to be in overall good health with appropriate age-related considerations for preventive care.',
          recommendations: [
            'Annual comprehensive physical examination',
            'Age-appropriate preventive screenings',
            'Regular monitoring of vital signs and basic metabolic panel',
            'Lifestyle counseling for optimal health maintenance'
          ],
          riskFactors: ['Age-related health considerations', 'Need for routine preventive care'],
          followUpNeeded: 'Annual routine follow-up recommended',
          urgencyLevel: 'low'
        };
      }
      
      // Create comprehensive analysis result
      const analysisResult: AnalysisResult = {
        metadata: {
          reportId: `comprehensive_analysis_${Date.now()}`,
          generatedAt: new Date().toISOString(),
          patientId: patient.id,
          patientName: `${patient.firstname} ${patient.lastname}`,
          patientAge: age,
          patientGender: patient.sex
        },
        diagnosis: parsedDiagnosis,
        literature: pubmedArticles,
        searchQuery: searchQuery,
        disclaimer: "This comprehensive analysis is generated by AI for educational and informational purposes only. Always consult with qualified healthcare professionals for medical advice, diagnosis, and treatment decisions."
      };
      
      // Add insurance data if available
      if (insuranceData) {
        analysisResult.insurance = insuranceData;
      }
      
      console.log('✅ Comprehensive analysis complete');
      return analysisResult;
      
    } catch (error) {
      console.error('❌ Error in comprehensive analysis:', error);
      throw error;
    }
  }

  async analyzePatientQuery(patient: Patient, query: string): Promise<AnalysisResult> {
    try {
      console.log('🤖 Starting patient query analysis...');
      
      // Calculate patient age
      const age = this.formatAge(patient.date_of_birth);
      
      // Step 1: Get insurance recommendations for context
      console.log('💰 STEP 1: Generating Insurance Analysis');
      let insuranceData: any = null;
      try {
        const basicMedicalAnalysis = {
          clinicalSummary: `${age}-year-old ${patient.sex} with query: ${query}`,
          healthAssessment: 'Assessment needed for specific query',
          recommendations: ['Address user query', 'Provide relevant medical guidance'],
          riskFactors: patient.allergies.map(allergy => `${allergy.allergen} allergy (${allergy.severity})`),
          followUpNeeded: 'As indicated by query',
          urgencyLevel: 'moderate' as const
        };
        
        insuranceData = await this.generateInsuranceRecommendations(patient, basicMedicalAnalysis);
        console.log(`✅ Insurance analysis complete - found ${insuranceData?.availablePlans || 0} plans`);
      } catch (insuranceError) {
        console.error('⚠️ Error generating insurance recommendations:', insuranceError);
      }

      // Step 2: Search for relevant literature
      console.log('📚 STEP 2: Searching Medical Literature');
      const conditionsFromAlerts = patient.medical_alerts.filter(alert => alert.active).map(alert => alert.description);
      const ageGroup = age < 12 ? 'pediatric' : age < 18 ? 'adolescent' : age < 65 ? 'adult' : 'geriatric';
      const genderSpecific = patient.sex === 'female' ? 'women' : patient.sex === 'male' ? 'men' : 'adults';
      
      let searchQuery: string;
      if (conditionsFromAlerts.length > 0) {
        searchQuery = `${query} ${conditionsFromAlerts.slice(0, 2).join(' OR ')} ${ageGroup} ${genderSpecific}`;
      } else {
        searchQuery = `${query} ${ageGroup} ${genderSpecific} medical evaluation`;
      }
      
      const pubmedArticles = await this.searchPubMed(searchQuery, 3);

      // Step 3: Create comprehensive prompt with all analysis results
      const patientSummary = `PATIENT: ${patient.firstname} ${patient.lastname}, ${age} year old ${patient.sex}

KEY MEDICAL DATA:
- Active Medical Conditions: ${patient.medical_alerts.filter(alert => alert.active).map(alert => alert.description).join(', ') || 'None documented'}
- Allergies: ${patient.allergies.map(allergy => `${allergy.allergen} (${allergy.severity})`).join(', ') || 'None documented'}
- Emergency Contact: ${patient.emergency_contact_name} (${patient.emergency_contact_phone})
- Location: ${patient.city}, ${patient.state} ${patient.zip}
- Contact: ${patient.phone_primary}
- Language: ${patient.preferred_language}

USER QUERY: ${query}`;

      const medicalPrompt = `You are a medical expert analyzing a patient case. Based on ALL the information provided below (patient data, insurance analysis results, and medical literature), provide a comprehensive response to the user's specific query.

${patientSummary}

INSURANCE ANALYSIS RESULTS:
${insuranceData ? `
- Available Insurance Plans: ${insuranceData.availablePlans}
- Best Recommended Plan: ${insuranceData.summary?.bestPlan || 'Not available'}
- Average Annual Cost: $${insuranceData.summary?.averageEstimatedCost?.toFixed(0) || 'Not calculated'}
- Medical Codes Identified: ${insuranceData.medicalCodes?.map((code: any) => `${code.icd10} (${code.description})`).join(', ') || 'None'}
- Top Plan Recommendations: ${insuranceData.recommendations?.map((rec: any) => `${rec.planName} ($${rec.estimatedAnnualCost?.toFixed(0)}/year)`).join(', ') || 'None'}
` : 'Insurance analysis not available'}

RELEVANT MEDICAL LITERATURE FOUND:
${pubmedArticles.length > 0 ? pubmedArticles.map((article, idx) => `
${idx + 1}. "${article.title}" by ${article.authors} (${article.journal}, ${article.year})
   Abstract: ${article.abstract.substring(0, 200)}...
`).join('') : 'No relevant literature found'}

COMPREHENSIVE ANALYSIS REQUEST:
Answer the user's query: "${query}"

Using ALL the above information (patient data, insurance analysis, and medical literature), provide a comprehensive response that considers:
1. Patient's medical history and current conditions
2. Insurance coverage implications and cost-effectiveness
3. Current medical literature and evidence-based recommendations
4. Patient-specific factors (age, gender, location, allergies)
5. Financial accessibility of recommendations

You MUST respond with ONLY a valid JSON object in exactly this format. Do not include any other text, explanations, or markdown formatting:

{
  "clinicalSummary": "Brief summary addressing the user's query incorporating all available data",
  "healthAssessment": "Assessment relevant to the specific query based on patient data, insurance, and literature",
  "recommendations": [
    "Evidence-based recommendation addressing the query",
    "Cost-effective recommendation considering insurance coverage", 
    "Literature-supported follow-up or monitoring recommendation"
  ],
  "riskFactors": ["relevant risk factor based on all data", "insurance/access consideration"],
  "followUpNeeded": "timeframe for follow-up specific to the query and cost considerations",
  "urgencyLevel": "moderate"
}

CRITICAL: Your response must be ONLY valid JSON. No markdown, no explanations, no additional text.`;

      console.log('🤖 STEP 3: Generating Final Analysis with All Context');
      
      // Generate comprehensive analysis with all data
      const diagnosisText = await this.callOpenAI(medicalPrompt, 'gpt-4o');
      
      // Parse the JSON response
      let parsedDiagnosis: MedicalAnalysis;
      try {
        console.log('Raw OpenAI response:', diagnosisText);
        
        // Clean the response and extract JSON
        let cleanedResponse = diagnosisText.trim();
        
        // Remove any markdown code blocks
        cleanedResponse = cleanedResponse.replace(/```json\s*/, '').replace(/```\s*$/, '');
        
        // Find JSON object in the response
        const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const jsonString = jsonMatch[0];
          console.log('Extracted JSON string:', jsonString);
          parsedDiagnosis = JSON.parse(jsonString);
          console.log('Parsed diagnosis:', parsedDiagnosis);
        } else {
          console.log('No JSON object found, trying to parse entire response');
          parsedDiagnosis = JSON.parse(cleanedResponse);
        }
        
        // Validate the parsed object has required fields
        if (!parsedDiagnosis.clinicalSummary || !parsedDiagnosis.healthAssessment || !parsedDiagnosis.recommendations) {
          throw new Error('Parsed JSON missing required fields');
        }
        
      } catch (error) {
        console.log('⚠️ Failed to parse JSON response:', error);
        console.log('Raw response that failed to parse:', diagnosisText);
        parsedDiagnosis = {
          clinicalSummary: `Analysis of patient query: "${query}". Based on available patient information, this appears to be a routine inquiry requiring standard medical evaluation.`,
          healthAssessment: 'Patient inquiry suggests need for professional medical assessment and evaluation.',
          recommendations: [
            'Consult with healthcare provider for proper evaluation',
            'Consider appropriate diagnostic testing if indicated',
            'Follow standard clinical guidelines for this type of inquiry'
          ],
          riskFactors: ['Requires professional assessment'],
          followUpNeeded: 'As clinically indicated',
          urgencyLevel: 'moderate'
        };
      }
      
      // Create comprehensive analysis result
      const analysisResult: AnalysisResult = {
        metadata: {
          reportId: `query_analysis_${Date.now()}`,
          generatedAt: new Date().toISOString(),
          patientId: patient.id,
          patientName: `${patient.firstname} ${patient.lastname}`,
          patientAge: age,
          patientGender: patient.sex
        },
        diagnosis: parsedDiagnosis,
        literature: pubmedArticles,
        searchQuery: searchQuery,
        disclaimer: "This analysis is generated by AI for educational purposes only. Always consult with qualified healthcare professionals for medical advice."
      };
      
      // Add insurance data if available
      if (insuranceData) {
        analysisResult.insurance = insuranceData;
      }
      
      console.log('✅ Query analysis complete');
      return analysisResult;
      
    } catch (error) {
      console.error('❌ Error analyzing patient query:', error);
      throw error;
    }
  }
}

export const fhirAnalysisService = new FHIRAnalysisService();