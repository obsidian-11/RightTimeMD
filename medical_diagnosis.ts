import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

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

async function callOllama(prompt: string, model: string = 'gemma3'): Promise<string> {
    try {
        console.log(`🔍 Using model: ${model}`);
        console.log(`📝 Prompt length: ${prompt.length} characters`);
        
        const requestBody = {
            model: model,
            prompt: prompt,
            stream: false,
            options: {
                temperature: 0.3,
                top_p: 0.9,
                num_predict: 2000
            }
        };

        const response = await fetch('http://localhost:11434/api/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama API error: ${response.status} ${response.statusText}\nResponse: ${errorText}`);
        }

        const data = await response.json();
        console.log(`✅ Received response length: ${data.response?.length || 0} characters`);
        
        if (!data.response) {
            console.log('⚠️ No response field in data:', JSON.stringify(data, null, 2));
            return 'No response field returned from Ollama';
        }
        
        return data.response;
    } catch (error) {
        console.error('❌ Error calling Ollama:', error);
        return `Error: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
}

function formatPatientDataForAnalysis(data: PatientData): string {
    const patient = data.patients[0];
    
    // Calculate age from birth date
    const birthDate = new Date(patient.birthDate);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    
    let analysis = `PATIENT MEDICAL RECORD ANALYSIS

PATIENT DEMOGRAPHICS:
- Name: ${patient.name}
- Age: ${age} years old
- Gender: ${patient.gender}
- Birth Date: ${patient.birthDate}
- Patient ID: ${patient.id}

MEDICAL CONDITIONS:
`;

    // Add conditions
    if (data.conditions.length > 0) {
        data.conditions.forEach(condition => {
            analysis += `- ${condition.code} (Status: ${condition.clinicalStatus}, Onset: ${condition.onsetDateTime})\n`;
        });
    } else {
        analysis += "- No documented conditions\n";
    }

    analysis += `\nVITAL SIGNS AND MEASUREMENTS (Recent to Historical):\n`;
    
    // Group observations by type and show progression
    const vitalSigns = data.observations.filter(obs => 
        obs.category.includes('Vital signs')
    ).sort((a, b) => new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime());

    const labResults = data.observations.filter(obs => 
        obs.category.includes('Laboratory')
    ).sort((a, b) => new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime());

    const socialHistory = data.observations.filter(obs => 
        obs.category.includes('Social history')
    ).sort((a, b) => new Date(b.effectiveDateTime).getTime() - new Date(a.effectiveDateTime).getTime());

    // Add vital signs
    if (vitalSigns.length > 0) {
        analysis += `\nVital Signs:\n`;
        vitalSigns.slice(0, 10).forEach(obs => {
            analysis += `- ${obs.code}: ${obs.value} (${obs.effectiveDateTime.split('T')[0]})\n`;
        });
    }

    // Add lab results
    if (labResults.length > 0) {
        analysis += `\nLaboratory Results:\n`;
        labResults.slice(0, 10).forEach(obs => {
            analysis += `- ${obs.code}: ${obs.value} (${obs.effectiveDateTime.split('T')[0]})\n`;
        });
    }

    // Add social history
    if (socialHistory.length > 0) {
        analysis += `\nSocial History:\n`;
        socialHistory.forEach(obs => {
            analysis += `- ${obs.code}: ${obs.value}\n`;
        });
    }

    // Add procedures
    if (data.procedures.length > 0) {
        analysis += `\nPROCEDURES:\n`;
        data.procedures.slice(0, 10).forEach(procedure => {
            analysis += `- ${procedure.code} (Status: ${procedure.status})\n`;
        });
    }

    // Add medications
    if (data.medications.length > 0) {
        analysis += `\nMEDICATIONS:\n`;
        data.medications.forEach(med => {
            analysis += `- ${med.medication} (Status: ${med.status}, Date: ${med.authoredOn})\n`;
        });
    }

    // Add immunizations
    if (data.immunizations.length > 0) {
        analysis += `\nIMMUNIZATIONS:\n`;
        data.immunizations.slice(0, 10).forEach(imm => {
            analysis += `- ${imm.vaccine} (Status: ${imm.status}, Date: ${imm.occurrenceDateTime})\n`;
        });
    }

    // Add encounters
    if (data.encounters.length > 0) {
        analysis += `\nRECENT HEALTHCARE ENCOUNTERS:\n`;
        data.encounters.slice(0, 5).forEach(encounter => {
            analysis += `- ${encounter.type} (Status: ${encounter.status}, Date: ${encounter.period})\n`;
            if (encounter.reasons && encounter.reasons.length > 0) {
                analysis += `  Reasons: ${encounter.reasons.join(', ')}\n`;
            }
        });
    }

    return analysis;
}

async function generateMedicalDiagnosis(): Promise<void> {
    try {
        console.log('🏥 Loading patient data...');
        
        // Read patient data
        const patientDataPath = join('./patient_json', 'patient_data.json');
        const patientDataContent = readFileSync(patientDataPath, 'utf8');
        const patientData: PatientData = JSON.parse(patientDataContent);
        
        console.log('📋 Formatting patient data for medical analysis...');
        
        // Format data for analysis
        const formattedData = formatPatientDataForAnalysis(patientData);
        
        // Get key data points for simplified analysis
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

        // Create medical analysis prompt
        const medicalPrompt = `You are a doctor reviewing this patient case. Provide a medical assessment:

${patientSummary}

Please provide:
1. Clinical Summary: What are the key findings?
2. Health Assessment: What is the overall health status?
3. Recommendations: What care or monitoring is needed?

Keep the response focused and under 500 words.`;

        console.log('🤖 Generating medical diagnosis with Ollama...');
        console.log('⏳ This may take a moment...\n');
        
        // Call Ollama for medical analysis
        const diagnosis = await callOllama(medicalPrompt);
        
        console.log('📊 MEDICAL ANALYSIS REPORT');
        console.log('=' .repeat(50));
        console.log(diagnosis);
        console.log('=' .repeat(50));
        console.log('\n⚠️  DISCLAIMER: This analysis is generated by AI for educational purposes only.');
        console.log('   Always consult with qualified healthcare professionals for medical advice.');
        
        // Save the analysis to a file
        const analysisPath = join('./patient_json', 'medical_analysis.txt');
        const fullReport = `MEDICAL ANALYSIS REPORT
Generated: ${new Date().toISOString()}

${diagnosis}

DISCLAIMER: This analysis is generated by AI for educational purposes only.
Always consult with qualified healthcare professionals for medical advice.`;
        
        writeFileSync(analysisPath, fullReport, 'utf8');
        console.log(`\n💾 Medical analysis saved to: ${analysisPath}`);
        
    } catch (error) {
        console.error('❌ Error generating medical diagnosis:', error);
        process.exit(1);
    }
}

// Run the medical diagnosis if this file is executed directly
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

generateMedicalDiagnosis().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});

export { generateMedicalDiagnosis, callOllama, formatPatientDataForAnalysis };