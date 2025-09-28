import { useState, useEffect } from "react";
import { useParams } from "react-router";
import { usePatients, testBucketAccess } from "@/hooks";

interface AnalysisResult {
  id: string;
  timestamp: string;
  patientName: string;
  type: string;
  status: 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
}


export function Clinical() {
  const { id: clinicId } = useParams<{ id: string }>();
  const { patients: availablePatients, loading: patientsLoading, error: patientsError, refetch } = usePatients(clinicId);
  const [selectedPatient, setSelectedPatient] = useState<string>("");
  const [analysisHistory, setAnalysisHistory] = useState<AnalysisResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedResult, setSelectedResult] = useState<AnalysisResult | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Fetch analysis history from backend
  const fetchAnalysisHistory = async (patientFile?: string) => {
    if (!clinicId) return;
    
    setHistoryLoading(true);
    try {
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const queryParams = patientFile ? `?patientFile=${encodeURIComponent(patientFile)}` : '';
      const response = await fetch(`${backendUrl}/api/analysis-history/${clinicId}${queryParams}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch analysis history: ${response.status}`);
      }
      
      const data = await response.json();
      if (data.success) {
        setAnalysisHistory(data.history || []);
        console.log(`📊 Loaded ${data.history?.length || 0} analysis records from Diagnosis bucket`);
      }
    } catch (error) {
      console.error('❌ Error fetching analysis history:', error);
    } finally {
      setHistoryLoading(false);
    }
  };

  // Load analysis history when component mounts or clinic changes
  useEffect(() => {
    if (clinicId) {
      fetchAnalysisHistory();
    }
  }, [clinicId]);

  // Load patient-specific history when patient selection changes
  useEffect(() => {
    if (clinicId && selectedPatient) {
      fetchAnalysisHistory(selectedPatient);
    }
  }, [clinicId, selectedPatient]);

  const runAnalysis = async (analysisType: string, patientFile?: string) => {
    const patientName = patientFile ? 
      availablePatients.find(p => p.name === patientFile)?.patientName || "Unknown Patient" :
      "Selected Patient";

    const newAnalysis: AnalysisResult = {
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      patientName,
      type: analysisType,
      status: 'running'
    };

    setAnalysisHistory(prev => [newAnalysis, ...prev]);
    setIsLoading(true);

    try {
      console.log(`🩺 Starting ${analysisType} analysis for ${patientFile || selectedPatient}`);
      
      // Call the backend API that will execute the real analysis commands
      const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
      const response = await fetch(`${backendUrl}/api/medical-analysis`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: analysisType,
          patientFile: patientFile || selectedPatient,
          clinicId,
          bucketName: 'FHIR'
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Analysis failed: ${response.status} ${response.statusText}\n${errorText}`);
      }

      const result = await response.json();
      console.log(`✅ Analysis result:`, result);

      setAnalysisHistory(prev => 
        prev.map(analysis => 
          analysis.id === newAnalysis.id 
            ? { ...analysis, status: 'completed', result }
            : analysis
        )
      );
      
      // Refresh analysis history from saved files to get the newly saved analysis
      setTimeout(() => fetchAnalysisHistory(selectedPatient), 1000);
    } catch (error) {
      setAnalysisHistory(prev => 
        prev.map(analysis => 
          analysis.id === newAnalysis.id 
            ? { 
                ...analysis, 
                status: 'failed', 
                error: error instanceof Error ? error.message : 'Unknown error' 
              }
            : analysis
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return '⏳';
      case 'completed': return '✅';
      case 'failed': return '❌';
      default: return '⚪';
    }
  };

  const getAnalysisDescription = (type: string) => {
    switch (type) {
      case 'complete-analysis':
        return 'Complete patient analysis with FHIR data extraction, medical diagnosis, insurance recommendations, and PubMed literature search';
      case 'medical-diagnosis':
        return 'AI-powered medical analysis using OpenAI with PubMed literature search';
      case 'patient-extraction':
        return 'Extract and parse patient data from FHIR bundles';
      case 'insurance-lookup':
        return 'Generate insurance plan recommendations based on patient diagnoses';
      case 'patient-selector':
        return 'Interactive patient selection and comprehensive analysis pipeline';
      default:
        return 'Medical analysis command';
    }
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          🩺 Doctor Dashboard - Medical Analysis Tools
        </h1>
        <p className="text-gray-600">
          AI-powered medical analysis tools for patient care and diagnosis
        </p>
        {patientsLoading && (
          <div className="mt-2 text-sm text-blue-600">
            ⟳ Loading patient data from Supabase...
          </div>
        )}
      </div>

      {/* Quick Actions Section */}
      <div className="grid md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-blue-800">
            🩺 Complete Analysis
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Run comprehensive patient analysis including FHIR extraction, medical diagnosis, insurance recommendations, and PubMed literature search
          </p>
          <button
            onClick={() => runAnalysis('complete-analysis')}
            disabled={isLoading || !selectedPatient}
            className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Run Complete Analysis
          </button>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4 text-orange-800">
            📋 FHIR Extraction
          </h2>
          <p className="text-gray-600 text-sm mb-4">
            Extract and parse patient data from FHIR bundles into structured format
          </p>
          <button
            onClick={() => runAnalysis('patient-extraction')}
            disabled={isLoading || !selectedPatient}
            className="w-full bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            Extract Patient Data
          </button>
        </div>
      </div>

      {/* Patient Selection */}
      <div className="bg-white border rounded-lg p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            👥 Patient Selection
          </h2>
          <div className="flex gap-2">
            <button
              onClick={refetch}
              disabled={patientsLoading}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
            >
              {patientsLoading ? '⟳ Loading...' : '🔄 Refresh'}
            </button>
            <button
              onClick={async () => {
                console.log('🧪 Running bucket access test...');
                const result = await testBucketAccess();
                console.log('🧪 Test result:', result);
                alert(`Bucket test: ${result.success ? 'SUCCESS' : 'FAILED'}\n${result.success ? `Found ${result.files?.length} files in ${result.bucketName}` : result.error}`);
              }}
              className="text-sm bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded"
            >
              🧪 Test Access
            </button>
          </div>
        </div>

        {patientsError && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
            <div className="flex">
              <div className="text-red-600 text-sm">
                <strong>Error loading patients:</strong> {patientsError}
              </div>
            </div>
            <details className="mt-2">
              <summary className="text-xs text-red-500 cursor-pointer">Debug Information</summary>
              <div className="mt-2 text-xs text-gray-600 font-mono bg-gray-100 p-2 rounded">
                <p>Clinic ID: {clinicId}</p>
                <p>Bucket: FHIR</p>
                <p>Check browser console for detailed logs</p>
              </div>
            </details>
          </div>
        )}

        {/* Debug Info */}
        {process.env.NODE_ENV === 'development' && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4 mb-4">
            <details>
              <summary className="text-sm text-blue-700 cursor-pointer">🔧 Debug Information</summary>
              <div className="mt-2 text-xs text-gray-600">
                <p><strong>Clinic ID:</strong> {clinicId}</p>
                <p><strong>Patients Loading:</strong> {patientsLoading ? 'Yes' : 'No'}</p>
                <p><strong>Patients Count:</strong> {availablePatients.length}</p>
                <p><strong>Error:</strong> {patientsError || 'None'}</p>
                <p><strong>Selected Patient:</strong> {selectedPatient || 'None'}</p>
                <p className="mt-2"><em>Check browser console for detailed logs</em></p>
              </div>
            </details>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Patient File
            </label>
            <select
              value={selectedPatient}
              onChange={(e) => setSelectedPatient(e.target.value)}
              disabled={patientsLoading || availablePatients.length === 0}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">
                {patientsLoading 
                  ? "Loading patients..." 
                  : availablePatients.length === 0 
                    ? "No patients found" 
                    : "Select a patient..."
                }
              </option>
              {availablePatients.map((patient) => (
                <option key={patient.name} value={patient.name}>
                  {patient.patientName} ({patient.size})
                </option>
              ))}
            </select>
            {availablePatients.length > 0 && (
              <p className="text-xs text-gray-500 mt-1">
                {availablePatients.length} patient file{availablePatients.length !== 1 ? 's' : ''} available
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected Patient Details
            </label>
            {selectedPatient ? (
              <div className="bg-gray-50 p-3 rounded border">
                {(() => {
                  const patient = availablePatients.find(p => p.name === selectedPatient);
                  return patient ? (
                    <>
                      <p className="font-medium">{patient.patientName}</p>
                      <p className="text-sm text-gray-600">
                        File: {patient.name} ({patient.size})
                      </p>
                      <p className="text-sm text-gray-600">
                        Last Modified: {patient.lastModified}
                      </p>
                    </>
                  ) : null;
                })()}
              </div>
            ) : (
              <div className="bg-gray-50 p-3 rounded border text-gray-500">
                No patient selected
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Analysis History */}
      <div className="bg-white border rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-800">
            📊 Analysis History
          </h2>
          <div className="flex gap-2">
            <button
              onClick={() => fetchAnalysisHistory(selectedPatient)}
              disabled={historyLoading}
              className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 rounded disabled:opacity-50"
            >
              {historyLoading ? '⟳ Loading...' : '🔄 Refresh History'}
            </button>
            {selectedPatient && (
              <button
                onClick={() => fetchAnalysisHistory()}
                className="text-sm bg-blue-100 hover:bg-blue-200 px-3 py-1 rounded"
              >
                📊 Show All Patients
              </button>
            )}
          </div>
        </div>
        {historyLoading ? (
          <div className="text-center py-8">
            <div className="text-blue-600">⟳ Loading analysis history from Diagnosis bucket...</div>
          </div>
        ) : analysisHistory.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            {selectedPatient 
              ? `No analyses found for ${availablePatients.find(p => p.name === selectedPatient)?.patientName || 'selected patient'}. Run an analysis to see history here.`
              : 'No analyses run yet. Select a patient and choose an analysis type to get started.'
            }
          </p>
        ) : (
          <div className="space-y-4">
            {analysisHistory.map((analysis) => (
              <div
                key={analysis.id}
                className="border rounded-lg p-4 hover:bg-gray-50"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg">
                        {getStatusIcon(analysis.status)}
                      </span>
                      <h3 className="font-semibold text-gray-900">
                        {analysis.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                      </h3>
                      <span className="text-sm text-gray-500">
                        for {analysis.patientName}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">
                      {getAnalysisDescription(analysis.type)}
                    </p>
                    <p className="text-xs text-gray-400">
                      {new Date(analysis.timestamp).toLocaleString()}
                    </p>
                  </div>
                  <div className="ml-4">
                    {analysis.status === 'completed' && (
                      <button 
                        onClick={() => setSelectedResult(analysis)}
                        className="text-blue-600 hover:text-blue-800 text-sm underline"
                      >
                        View Results
                      </button>
                    )}
                    {analysis.status === 'failed' && (
                      <div className="text-red-600 text-sm">
                        Error: {analysis.error}
                      </div>
                    )}
                    {analysis.status === 'running' && (
                      <div className="text-blue-600 text-sm">
                        Processing...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Results Modal */}
      {selectedResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  Analysis Results - {selectedResult.patientName}
                </h2>
                <button
                  onClick={() => setSelectedResult(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
              
              <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Analysis Type:</strong> {selectedResult.type.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                  <div><strong>Status:</strong> {getStatusIcon(selectedResult.status)} {selectedResult.status}</div>
                  <div><strong>Timestamp:</strong> {new Date(selectedResult.timestamp).toLocaleString()}</div>
                  <div><strong>Patient:</strong> {selectedResult.patientName}</div>
                </div>
              </div>

              {selectedResult.result && (
                <div className="space-y-6">
                  {/* Formatted display for specific analysis types */}
                  <div>
                    <h3 className="text-lg font-semibold mb-3">Analysis Results</h3>
                    <div className="space-y-4">
                      
                      {/* Complete Analysis Results */}
                      {selectedResult.type === 'complete-analysis' && selectedResult.result.medical && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold text-green-800 mb-2">🏥 Medical Analysis</h4>
                          <div className="text-sm space-y-2">
                            {selectedResult.result.medical.clinicalSummary && (
                              <p><strong>Clinical Summary:</strong> {selectedResult.result.medical.clinicalSummary}</p>
                            )}
                            {selectedResult.result.medical.urgencyLevel && (
                              <p><strong>Urgency Level:</strong> {selectedResult.result.medical.urgencyLevel}</p>
                            )}
                            {selectedResult.result.medical.riskFactors && (
                              <div>
                                <strong>Risk Factors:</strong>
                                <ul className="list-disc list-inside ml-2">
                                  {selectedResult.result.medical.riskFactors.map((factor: string, i: number) => (
                                    <li key={i}>{factor}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {selectedResult.result.medical.recommendations && (
                              <div>
                                <strong>Recommendations:</strong>
                                <ul className="list-disc list-inside ml-2">
                                  {selectedResult.result.medical.recommendations.map((rec: string, i: number) => (
                                    <li key={i}>{rec}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                            {selectedResult.result.medical.followUpNeeded && (
                              <p><strong>Follow-up:</strong> {selectedResult.result.medical.followUpNeeded}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Insurance Results */}
                      {selectedResult.type === 'complete-analysis' && selectedResult.result.insurance && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold text-purple-800 mb-2">💰 Insurance Recommendations</h4>
                          <div className="text-sm space-y-2">
                            {selectedResult.result.insurance.recommendedPlans && selectedResult.result.insurance.recommendedPlans.length > 0 ? (
                              <div>
                                <strong>Recommended Plans:</strong>
                                <div className="space-y-2 mt-2">
                                  {selectedResult.result.insurance.recommendedPlans.map((plan: any, i: number) => (
                                    <div key={i} className="bg-gray-50 p-2 rounded">
                                      <p><strong>{plan.planName || 'Plan ' + (i + 1)}</strong></p>
                                      {plan.estimatedAnnualCost && <p>Estimated Annual Cost: ${plan.estimatedAnnualCost}</p>}
                                      {plan.recommendationScore && <p>Score: {plan.recommendationScore}%</p>}
                                      {plan.coverageHighlights && (
                                        <p>Coverage: {plan.coverageHighlights.join(', ')}</p>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <p className="text-gray-500">No insurance recommendations available</p>
                            )}
                            {selectedResult.result.insurance.potentialSavings && (
                              <p><strong>Potential Savings:</strong> ${selectedResult.result.insurance.potentialSavings}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* FHIR Data Results */}
                      {selectedResult.result.fhirData && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold text-orange-800 mb-2">📋 FHIR Data</h4>
                          <div className="text-sm">
                            {selectedResult.result.fhirData.resourceCounts && (
                              <div>
                                <strong>Resource Counts:</strong>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                  {Object.entries(selectedResult.result.fhirData.resourceCounts).map(([key, value]) => (
                                    <div key={key} className="bg-gray-50 p-1 rounded text-center">
                                      <div className="font-medium">{key}</div>
                                      <div className="text-lg">{value as number}</div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {selectedResult.result.fhirData.extractedFields && (
                              <div className="mt-3">
                                <strong>Extracted Fields:</strong>
                                <div className="flex flex-wrap gap-1 mt-1">
                                  {selectedResult.result.fhirData.extractedFields.map((field: string, i: number) => (
                                    <span key={i} className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                      {field}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Patient Basic Info */}
                      {(selectedResult.result.patientAge || selectedResult.result.conditionsCount !== undefined) && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold text-blue-800 mb-2">👤 Patient Information</h4>
                          <div className="text-sm grid grid-cols-2 gap-2">
                            {selectedResult.result.patientAge && (
                              <p><strong>Age:</strong> {selectedResult.result.patientAge} years</p>
                            )}
                            {selectedResult.result.conditionsCount !== undefined && (
                              <p><strong>Documented Conditions:</strong> {selectedResult.result.conditionsCount}</p>
                            )}
                          </div>
                        </div>
                      )}

                      {/* PubMed Literature */}
                      {selectedResult.result.literature && selectedResult.result.literature.length > 0 && (
                        <div className="border rounded-lg p-4">
                          <h4 className="font-semibold text-indigo-800 mb-2">📚 Relevant Literature (PubMed)</h4>
                          <div className="space-y-3">
                            {selectedResult.result.literature.map((article: any, i: number) => (
                              <div key={i} className="bg-gray-50 p-3 rounded border-l-4 border-indigo-400">
                                <h5 className="font-medium text-gray-900 mb-1">{article.title}</h5>
                                <div className="text-sm text-gray-600 space-y-1">
                                  <p><strong>Authors:</strong> {article.authors}</p>
                                  <p><strong>Journal:</strong> {article.journal} ({article.year})</p>
                                  <div className="flex items-center justify-between">
                                    <p><strong>PMID:</strong> {article.pmid}</p>
                                    <div className="flex items-center gap-2">
                                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded text-xs">
                                        Relevance: {article.relevanceScore}%
                                      </span>
                                      {article.url && (
                                        <a
                                          href={article.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-indigo-600 hover:text-indigo-800 text-xs underline"
                                        >
                                          View on PubMed →
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                </div>
              )}

              {selectedResult.error && (
                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <h3 className="text-lg font-semibold text-red-800 mb-2">Error Details</h3>
                  <p className="text-red-700">{selectedResult.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Command Reference */}
      <div className="mt-8 bg-gray-50 border rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-gray-800">
          📋 Available Commands Reference
        </h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <h3 className="font-semibold mb-2">Available Analysis Tools:</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• <code>complete-analysis</code> - Full patient analysis pipeline with FHIR extraction, medical diagnosis, insurance recommendations, and PubMed literature search</li>
              <li>• <code>patient-extraction</code> - Extract and parse patient data from FHIR bundles into structured format</li>
            </ul>
          </div>
          <div>
            <h3 className="font-semibold mb-2">Integration Details:</h3>
            <ul className="space-y-1 text-gray-600">
              <li>• FHIR data extraction and processing</li>
              <li>• AI-powered medical analysis with OpenAI</li>
              <li>• PubMed literature search integration</li>
              <li>• Supabase data storage and retrieval</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
