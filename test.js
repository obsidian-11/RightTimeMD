// test.js — run with: node test.js

import fetch from 'node-fetch';

const OLLAMA_URL = "http://localhost:11434/api/generate";
const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";

// Example patient (replace with your de-identified extract)
const patient = {
  age: 47,
  sex: "male",
  symptoms: ["palpitations", "exertional dyspnea"],
  conditions: ["hypertension"]
};

// Always-on instructions from instructions.md
const instructions = `
ROLE: You are the RightTimeMD Clinical Research & Coding Assistant.
You transform de-identified patient context into actionable visit briefs.

CRITICAL CONSTRAINTS:
- Return ONLY JSON, no surrounding prose
- Use ONLY information provided in input
- Keep text concise and clinical (~10th grade readability)
- Never invent citations or data

OUTPUT FORMAT (return ONLY this JSON):
{
  "visit_brief": {
    "issues": [
      { "title": string, "why_now": string, "next_steps": [string] }
    ],
    "red_flags": [string]
  },
  "literature": [
    {
      "rank": 1|2|3,
      "id": string,
      "title": string,
      "year": number,
      "source": "PubMed"|"Guideline"|"Other",
      "link": string,
      "one_sentence_summary": string,
      "why_relevant": string,
      "evidence_strength": "high"|"medium"|"low"
    }
  ],
  "follow_up_questions": [string],
}
`;

// Function to search PubMed for relevant papers
async function searchPubMedPapers(patient, maxResults = 3) {
  try {
    // Build search terms from patient data
    const searchTerms = [];
    
    if (patient.symptoms) {
      searchTerms.push(...patient.symptoms);
    }
    if (patient.conditions) {
      searchTerms.push(...patient.conditions);
    }
    
    // Add age group and sex if relevant
    if (patient.age && patient.age > 40) {
      searchTerms.push("middle aged");
    }
    if (patient.sex) {
      searchTerms.push(patient.sex);
    }
    
    const query = searchTerms.join(" AND ");
    console.log(`\n--- SEARCHING PUBMED ---\nQuery: ${query}\n`);
    
    // Search PubMed for paper IDs
    const searchUrl = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&term=${encodeURIComponent(query)}&retmax=${maxResults}&retmode=json&sort=relevance`;
    
    const searchResponse = await fetch(searchUrl);
    const searchData = await searchResponse.json();
    
    if (!searchData.esearchresult || !searchData.esearchresult.idlist || searchData.esearchresult.idlist.length === 0) {
      console.log("No papers found, using fallback papers");
      return getFallbackPapers(patient);
    }
    
    const pmids = searchData.esearchresult.idlist.slice(0, maxResults);
    
    // Fetch paper details
    const summaryUrl = `${PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&id=${pmids.join(',')}&retmode=json`;
    const summaryResponse = await fetch(summaryUrl);
    const summaryData = await summaryResponse.json();
    
    const papers = [];
    for (const pmid of pmids) {
      const paper = summaryData.result[pmid];
      if (paper) {
        papers.push({
          id: `pubmed-${pmid}`,
          title: paper.title || "Unknown title",
          year: parseInt(paper.pubdate?.split(' ')[0]) || new Date().getFullYear(),
          source: "PubMed",
          link: `https://pubmed.ncbi.nlm.nih.gov/${pmid}/`,
          abstract: paper.title || "Abstract not available", // PubMed summary API doesn't include full abstracts
          guideline: false,
          tags: searchTerms.slice(0, 3)
        });
      }
    }
    
    return papers.length > 0 ? papers : getFallbackPapers(patient);
    
  } catch (error) {
    console.error("PubMed search failed:", error.message);
    return getFallbackPapers(patient);
  }
}

// Fallback papers when search fails
function getFallbackPapers(patient) {
  const fallbackPapers = [
    {
      id: "cardio-001",
      title: "Exercise testing in patients with cardiac symptoms",
      year: 2022,
      source: "Guideline",
      link: "https://example.com/cardio-guidelines",
      abstract: "Guidelines for stress testing in patients with palpitations and dyspnea",
      guideline: true,
      tags: ["cardiology", "exercise", "palpitations"]
    },
    {
      id: "htn-002", 
      title: "Hypertension management in middle-aged adults",
      year: 2023,
      source: "PubMed",
      link: "https://example.com/htn-study",
      abstract: "Systematic review of antihypertensive therapy effectiveness",
      tags: ["hypertension", "management"]
    },
    {
      id: "dyspnea-003",
      title: "Evaluation of dyspnea in primary care",
      year: 2023,
      source: "PubMed", 
      link: "https://example.com/dyspnea-eval",
      abstract: "Systematic approach to evaluating shortness of breath",
      tags: ["dyspnea", "primary care", "evaluation"]
    }
  ];
  
  // Filter based on patient symptoms/conditions
  const relevantPapers = fallbackPapers.filter(paper => {
    const allTerms = [...(patient.symptoms || []), ...(patient.conditions || [])];
    return paper.tags.some(tag => 
      allTerms.some(term => 
        tag.toLowerCase().includes(term.toLowerCase()) || 
        term.toLowerCase().includes(tag.toLowerCase())
      )
    );
  });
  
  return relevantPapers.length > 0 ? relevantPapers.slice(0, 3) : fallbackPapers.slice(0, 3);
}

async function main() {
  // First, search for relevant papers based on patient data
  const literatureCandidates = await searchPubMedPapers(patient);
  
  const prompt = `
${instructions}

INPUT:
{
  "patient": ${JSON.stringify(patient, null, 2)},
  "literature_candidates": ${JSON.stringify(literatureCandidates, null, 2)}
}

Return ONLY the JSON object as specified in the OUTPUT FORMAT above.
`.trim();
  const res = await fetch(OLLAMA_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma3", // medical AI model
      prompt,
      stream: false
    })
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    throw new Error(`Ollama HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  console.log("\n--- RAW MODEL OUTPUT ---\n");
  console.log(data.response);

  try {
    // Handle markdown code blocks
    let jsonStr = data.response.trim();
    if (jsonStr.startsWith('```json')) {
      jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonStr.startsWith('```')) {
      jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }
    
    const parsed = JSON.parse(jsonStr);
    console.log("\n--- PARSED JSON ---\n");
    console.dir(parsed, { depth: null });
  } catch (error) {
    console.log("\n--- NOTE ---\nModel did not return valid JSON. Try tightening the prompt.");
    console.log("Parse error:", error.message);
  }
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
