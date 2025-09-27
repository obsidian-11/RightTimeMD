// test.js — run with: node test.js

import fetch from 'node-fetch';

const OLLAMA_URL = "http://localhost:11434/api/generate";

// Example patient (replace with your de-identified extract)
const patient = {
  age: 47,
  sex: "male",
  symptoms: ["palpitations", "exertional dyspnea"],
  conditions: ["hypertension"]
};

// Always-on instructions
const instructions = `
ROLE: You are a clinical research assistant.
- Return ONLY JSON, no extra text.
- Keys: assessment_summary, agenda (array), follow_up_questions (3 items),
  papers (3 items with title, year, link, why_relevant).
`;

const prompt = `
${instructions}

Patient facts:
${JSON.stringify(patient, null, 2)}

Task:
1. Write a brief assessment_summary (plain language, not a diagnosis).
2. Agenda: list of items for the HCP visit.
3. follow_up_questions: exactly 3.
4. papers: exactly 3 objects with title, year, link, why_relevant.
Return ONLY JSON, no extra explanation.
`.trim();

async function main() {
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
    const parsed = JSON.parse(data.response);
    console.log("\n--- PARSED JSON ---\n");
    console.dir(parsed, { depth: null });
  } catch {
    console.log("\n--- NOTE ---\nModel did not return valid JSON. Try tightening the prompt.");
  }
}

main().catch(err => {
  console.error("ERROR:", err);
  process.exit(1);
});
