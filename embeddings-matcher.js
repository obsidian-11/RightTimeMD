import fs from 'fs';
import path from 'path';

// Simple tokenizer for text processing
function tokenize(text) {
    return text
        .toLowerCase()
        .replace(/[^\w\s]/g, ' ')
        .split(/\s+/)
        .filter(token => token.length > 0);
}

// Simple TF-IDF vectorizer
class TfidfVectorizer {
    constructor() {
        this.vocab = new Map();
        this.idf = new Map();
        this.docCount = 0;
    }
    
    fitTransform(docs) {
        // First pass: build vocabulary and count document frequencies
        const docTerms = [];
        const docFreqs = new Map();
        
        // Process each document
        docs.forEach((doc, docIndex) => {
            const terms = tokenize(doc);
            const termSet = new Set(terms);
            docTerms.push(terms);
            
            // Update document frequencies
            termSet.forEach(term => {
                docFreqs.set(term, (docFreqs.get(term) || 0) + 1);
            });
            
            this.docCount++;
        });
        
        // Build vocabulary with terms that appear in at least 2 documents
        let termId = 0;
        for (const [term, df] of docFreqs.entries()) {
            if (df >= 2) {  // Only include terms that appear in at least 2 documents
                this.vocab.set(term, termId++);
                this.idf.set(term, Math.log((this.docCount + 1) / (df + 1)) + 1);
            }
        }
        
        // Second pass: create TF-IDF vectors
        const vectors = [];
        docTerms.forEach(terms => {
            const vec = new Array(this.vocab.size).fill(0);
            const termCounts = new Map();
            
            // Count term frequencies
            terms.forEach(term => {
                if (this.vocab.has(term)) {
                    termCounts.set(term, (termCounts.get(term) || 0) + 1);
                }
            });
            
            // Calculate TF-IDF
            let norm = 0;
            termCounts.forEach((count, term) => {
                const tf = count / terms.length;
                const tfidf = tf * this.idf.get(term);
                vec[this.vocab.get(term)] = tfidf;
                norm += tfidf * tfidf;
            });
            
            // Normalize the vector
            norm = Math.sqrt(norm) || 1;
            for (let i = 0; i < vec.length; i++) {
                vec[i] /= norm;
            }
            
            vectors.push(vec);
        });
        
        return vectors;
    }
    
    transform(doc) {
        const terms = tokenize(doc);
        const vec = new Array(this.vocab.size).fill(0);
        const termCounts = new Map();
        
        // Count term frequencies
        terms.forEach(term => {
            if (this.vocab.has(term)) {
                termCounts.set(term, (termCounts.get(term) || 0) + 1);
            }
        });
        
        // Calculate TF-IDF
        let norm = 0;
        termCounts.forEach((count, term) => {
            const tf = count / terms.length;
            const tfidf = tf * this.idf.get(term);
            vec[this.vocab.get(term)] = tfidf;
            norm += tfidf * tfidf;
        });
        
        // Normalize the vector
        norm = Math.sqrt(norm) || 1;
        for (let i = 0; i < vec.length; i++) {
            vec[i] /= norm;
        }
        
        return vec;
    }
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
    if (vecA.length !== vecB.length) return 0;
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    
    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);
    
    if (normA === 0 || normB === 0) return 0;
    return dotProduct / (normA * normB);
}

export class TrialMatcher {
    constructor() {
        this.vectorizer = new TfidfVectorizer();
        this.trials = [];
        this.trialVectors = [];
        this.isFitted = false;
    }

    /**
     * Initialize the vector store
     */
    async initialize() {
        // No initialization needed for the simple vectorizer
        console.log('Initializing TrialMatcher with TF-IDF vectorizer...');
    }

    /**
     * Process a clinical trial and add it to the vector store
     * @param {Object} trial - The trial to process
     * @returns {Promise<string>} The ID of the processed trial
     */
    async processTrial(trial) {
        try {
            // Create a text representation of the trial
            const trialText = this._createTrialText(trial);
            const trialId = trial.nctId || `trial-${Date.now()}`;
            
            // Store the full trial data
            this.trials.push({
                ...trial,
                id: trialId,
                text: trialText
            });
            
            // We'll process all trials together when findMatchingTrials is called
            return trialId;
        } catch (error) {
            console.error('Error processing trial:', error);
            throw error;
        }
    }

    /**
     * Find matching trials for a patient
     * @param {Object} patientData - Patient data including conditions
     * @param {number} k - Number of matches to return
     * @returns {Promise<Array>} Array of matching trials with scores
     */
    async findMatchingTrials(patientData, k = 5) {
        try {
            if (this.trials.length === 0) {
                return [];
            }

            // Create a text representation of the patient
            const patientText = this._createPatientText(patientData);
            
            // Get all trial texts
            const trialTexts = this.trials.map(trial => trial.text);
            
            // Add the patient query to the texts for vectorization
            const allTexts = [...trialTexts, patientText];
            
            // Fit and transform all texts
            const vectors = this.vectorizer.fitTransform(allTexts);
            
            // The last vector is the query vector
            const queryVector = vectors[vectors.length - 1];
            
            // Calculate cosine similarity with all trials
            const similarities = [];
            for (let i = 0; i < this.trials.length; i++) {
                const similarity = cosineSimilarity(vectors[i], queryVector);
                similarities.push({
                    id: this.trials[i].id,
                    score: Math.max(0, Math.min(100, (similarity + 1) * 50)) // Scale to 0-100
                });
            }
            
            // Sort by score in descending order and take top k
            const topK = similarities
                .sort((a, b) => b.score - a.score)
                .slice(0, k);
            
            // Map to include full trial data
            return topK.map(item => {
                const trial = this.trials.find(t => t.id === item.id) || {};
                return {
                    id: trial.id,
                    title: trial.title,
                    conditions: trial.conditions || [],
                    status: trial.status || 'Unknown',
                    url: trial.url || '',
                    score: item.score,
                    description: trial.description,
                    eligibility: trial.eligibility,
                    phases: trial.phases,
                    studyType: trial.studyType
                };
            });
        } catch (error) {
            console.error('Error finding matching trials:', error);
            throw error;
        }
    }

    /**
     * Create a text representation of a trial for embedding
     * @private
     */
    _createTrialText(trial) {
        return [
            `Title: ${trial.title || 'No title'}`,
            `Conditions: ${(trial.conditions || []).join(', ')}`,
            `Description: ${trial.description || 'No description'}`,
            `Eligibility: ${trial.eligibility || 'No eligibility criteria'}`,
            `Study Type: ${trial.studyType || 'Not specified'}`,
            `Phases: ${(trial.phases || []).join(', ') || 'Not specified'}`,
            `Status: ${trial.status || 'Unknown'}`
        ].join('\n');
    }

    /**
     * Create a text representation of a patient for embedding
     * @private
     */
    _createPatientText(patientData) {
        const activeConditions = (patientData.conditions || [])
            .filter(c => c.status === 'active' || c.status === 'recurrence')
            .map(c => c.name)
            .join(', ');
            
        return [
            `Patient with the following conditions: ${activeConditions || 'No active conditions'}`,
            `Age: ${patientData.age || 'Not specified'}`,
            `Gender: ${patientData.gender || 'Not specified'}`,
            `Looking for clinical trials for: ${activeConditions || 'any condition'}`
        ].join('\n');
    }
    
    /**
     * Calculate cosine similarity between two vectors
     * @private
     */
    // Removed as we're now using the standalone cosineSimilarity function
}
