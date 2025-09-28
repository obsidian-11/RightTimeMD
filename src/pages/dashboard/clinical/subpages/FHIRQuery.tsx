import { useState, useMemo } from "react";
import { FileText, Brain, Send, History, Search, User, Calendar, Phone, ChevronDown, Loader2, ExternalLink, AlertTriangle, CheckCircle, Shield } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useClinic } from "@/hooks";
import type { Patient } from "@/types";
import { fhirAnalysisService, type AnalysisResult } from "@/lib/fhir-analysis";

export function FHIRQuery() {
  const { currentClinic } = useClinic();
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [patientSearchOpen, setPatientSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [query, setQuery] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [queryHistory, setQueryHistory] = useState([
    "What medications is this patient currently taking?",
    "Show me the latest vital signs for this patient",
    "What conditions does this patient have?",
    "When was this patient's last appointment?",
  ]);

  // Mock patients with full Patient interface structure
  const mockPatients: Patient[] = useMemo(() => [
    {
      id: "1",
      clinic_id: currentClinic?.id || "",
      mrn: "MRN001",
      ssn_encrypted: "encrypted_ssn_1",
      firstname: "John",
      lastname: "Doe",
      sex: "male",
      date_of_birth: new Date("1985-03-15"),
      phone_primary: "(555) 123-4567",
      phone_secondary: "",
      email: "john.doe@email.com",
      emergency_contact_name: "Jane Doe",
      emergency_contact_phone: "(555) 987-6543",
      insurance_primary: null,
      insurance_secondary: null,
      allergies: [{ allergen: "Penicillin", reaction: "Rash", severity: "moderate" }],
      medical_alerts: [],
      preferred_language: "english",
      zip: 12345,
      state: "CA",
      city: "Los Angeles",
      street: "123 Main St",
      suite: "Apt 1A",
      icon_url: "",
      created_at: new Date("2023-01-15"),
      updated_at: new Date("2024-01-15"),
    },
    {
      id: "2",
      clinic_id: currentClinic?.id || "",
      mrn: "MRN002",
      ssn_encrypted: "encrypted_ssn_2",
      firstname: "Jane",
      lastname: "Smith",
      sex: "female",
      date_of_birth: new Date("1992-07-22"),
      phone_primary: "(555) 234-5678",
      phone_secondary: "(555) 345-6789",
      email: "jane.smith@email.com",
      emergency_contact_name: "Bob Smith",
      emergency_contact_phone: "(555) 876-5432",
      insurance_primary: null,
      insurance_secondary: null,
      allergies: [],
      medical_alerts: [{ 
        alert_type: "condition", 
        description: "Diabetes Type 2", 
        severity: "medium", 
        active: true, 
        created_date: new Date("2023-05-10") 
      }],
      preferred_language: "english",
      zip: 90210,
      state: "CA",
      city: "Beverly Hills",
      street: "456 Oak Ave",
      suite: "",
      icon_url: "",
      created_at: new Date("2023-02-20"),
      updated_at: new Date("2024-02-20"),
    },
    {
      id: "3",
      clinic_id: currentClinic?.id || "",
      mrn: "MRN003",
      ssn_encrypted: "encrypted_ssn_3",
      firstname: "Robert",
      lastname: "Johnson",
      sex: "male",
      date_of_birth: new Date("1978-11-08"),
      phone_primary: "(555) 345-6789",
      phone_secondary: "",
      email: "robert.johnson@email.com",
      emergency_contact_name: "Mary Johnson",
      emergency_contact_phone: "(555) 765-4321",
      insurance_primary: null,
      insurance_secondary: null,
      allergies: [
        { allergen: "Shellfish", reaction: "Anaphylaxis", severity: "life_threatening" },
        { allergen: "Latex", reaction: "Contact dermatitis", severity: "mild" }
      ],
      medical_alerts: [],
      preferred_language: "english",
      zip: 10001,
      state: "NY",
      city: "New York",
      street: "789 Pine St",
      suite: "Suite 5B",
      icon_url: "",
      created_at: new Date("2023-03-10"),
      updated_at: new Date("2024-03-10"),
    },
  ], [currentClinic?.id]);

  // Filter patients based on search
  const filteredPatients = useMemo(() => {
    if (!searchValue) return mockPatients;
    
    const searchTerm = searchValue.toLowerCase();
    return mockPatients.filter(patient => 
      `${patient.firstname} ${patient.lastname}`.toLowerCase().includes(searchTerm) ||
      patient.mrn.toLowerCase().includes(searchTerm) ||
      patient.phone_primary.includes(searchTerm) ||
      patient.email.toLowerCase().includes(searchTerm)
    );
  }, [searchValue, mockPatients]);

  const handleSendQuery = async () => {
    if (!query.trim() || !selectedPatient || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      // Add to history if not already there
      if (!queryHistory.includes(query)) {
        setQueryHistory((prev) => [query, ...prev.slice(0, 9)]); // Keep only last 10
      }

      console.log("Analyzing query:", query, "for patient:", selectedPatient);

      // Perform the analysis
      const result = await fhirAnalysisService.analyzePatientQuery(selectedPatient, query);
      setAnalysisResult(result);

      // Clear query
      setQuery("");
    } catch (error) {
      console.error("Analysis error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred during analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleComprehensiveAnalysis = async () => {
    if (!selectedPatient || isAnalyzing) return;

    try {
      setIsAnalyzing(true);
      setError(null);
      setAnalysisResult(null);

      console.log("Running comprehensive analysis for patient:", selectedPatient);

      // Perform comprehensive analysis
      const result = await fhirAnalysisService.runComprehensiveAnalysis(selectedPatient);
      setAnalysisResult(result);

    } catch (error) {
      console.error("Comprehensive analysis error:", error);
      setError(error instanceof Error ? error.message : "An unknown error occurred during comprehensive analysis");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const formatAge = (dateOfBirth: Date) => {
    const today = new Date();
    const age = today.getFullYear() - dateOfBirth.getFullYear();
    const monthDiff = today.getMonth() - dateOfBirth.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dateOfBirth.getDate())) {
      return age - 1;
    }
    return age;
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const handleQuickQuery = (quickQuery: string) => {
    setQuery(quickQuery);
  };

  if (!currentClinic) {
    return (
      <div className="flex h-96 items-center justify-center">
        <p className="text-gray-500">
          Please select a clinic to use FHIR Query.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
            <Brain className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              FHIR Query Assistant
            </h1>
            <p className="text-sm text-gray-600">
              Ask questions about patient FHIR data using AI
            </p>
          </div>
        </div>
      </div>

      {/* Active Feature Banner */}
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 text-green-600">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-green-900">
                AI-Powered Medical Analysis
              </h3>
              <p className="text-sm text-green-700">
                Ask natural language questions about patient medical data. Get AI-powered analysis with clinical recommendations and relevant literature.
              </p>
            </div>
            <Badge variant="default" className="ml-auto bg-green-600">
              Active
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Query Interface */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Query Interface
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Patient Selection */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Select Patient
                </label>
                <Popover open={patientSearchOpen} onOpenChange={setPatientSearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-between"
                    >
                      {selectedPatient ? (
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          <span>{`${selectedPatient.firstname} ${selectedPatient.lastname}`}</span>
                          <Badge variant="secondary" className="text-xs">
                            {selectedPatient.mrn}
                          </Badge>
                        </div>
                      ) : (
                        <span className="text-gray-500">Choose a patient to query...</span>
                      )}
                      <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[400px] p-0" side="bottom" align="start">
                    <div className="flex flex-col">
                      <div className="flex items-center border-b px-3">
                        <Search className="mr-2 h-4 w-4 shrink-0 opacity-50" />
                        <Input
                          placeholder="Search patients by name, MRN, phone..."
                          value={searchValue}
                          onChange={(e) => setSearchValue(e.target.value)}
                          className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                        />
                      </div>
                      <div className="max-h-60 overflow-auto">
                        {filteredPatients.length === 0 ? (
                          <div className="py-6 text-center text-sm text-gray-500">
                            No patients found.
                          </div>
                        ) : (
                          <div className="p-1">
                            {filteredPatients.map((patient) => (
                              <div
                                key={patient.id}
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setPatientSearchOpen(false);
                                  setSearchValue("");
                                }}
                                className="flex cursor-pointer flex-col items-start gap-1 rounded-sm px-3 py-2 hover:bg-accent hover:text-accent-foreground"
                              >
                                <div className="flex w-full items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-gray-500" />
                                    <span className="font-medium">
                                      {`${patient.firstname} ${patient.lastname}`}
                                    </span>
                                    <Badge variant="outline" className="text-xs">
                                      {patient.mrn}
                                    </Badge>
                                  </div>
                                  <div className="flex items-center gap-1 text-xs text-gray-500">
                                    <Calendar className="h-3 w-3" />
                                    <span>Age {formatAge(patient.date_of_birth)}</span>
                                  </div>
                                </div>
                                <div className="flex w-full items-center justify-between text-xs text-gray-500">
                                  <div className="flex items-center gap-1">
                                    <Phone className="h-3 w-3" />
                                    <span>{patient.phone_primary}</span>
                                  </div>
                                  <span>DOB: {formatDate(patient.date_of_birth)}</span>
                                </div>
                                {patient.allergies.length > 0 && (
                                  <div className="flex gap-1">
                                    {patient.allergies.map((allergy, idx) => (
                                      <Badge 
                                        key={idx} 
                                        variant={allergy.severity === 'life_threatening' ? 'destructive' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {allergy.allergen}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                                {patient.medical_alerts.length > 0 && (
                                  <div className="flex gap-1">
                                    {patient.medical_alerts.filter(alert => alert.active).map((alert, idx) => (
                                      <Badge 
                                        key={idx} 
                                        variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {alert.description}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>

              {/* Selected Patient Summary */}
              {selectedPatient && (
                <Card className="bg-blue-50 border-blue-200">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium text-blue-900">
                          {`${selectedPatient.firstname} ${selectedPatient.lastname}`}
                        </h4>
                        <Badge variant="outline" className="text-blue-700">
                          {selectedPatient.mrn}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm text-blue-700">
                        <div>
                          <span className="font-medium">Age:</span> {formatAge(selectedPatient.date_of_birth)}
                        </div>
                        <div>
                          <span className="font-medium">Sex:</span> {selectedPatient.sex}
                        </div>
                        <div>
                          <span className="font-medium">Phone:</span> {selectedPatient.phone_primary}
                        </div>
                        <div>
                          <span className="font-medium">DOB:</span> {formatDate(selectedPatient.date_of_birth)}
                        </div>
                      </div>
                      {(selectedPatient.allergies.length > 0 || selectedPatient.medical_alerts.length > 0) && (
                        <div className="pt-2 border-t border-blue-200">
                          {selectedPatient.allergies.length > 0 && (
                            <div className="mb-2">
                              <span className="text-xs font-medium text-blue-700">Allergies: </span>
                              {selectedPatient.allergies.map((allergy, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant={allergy.severity === 'life_threatening' ? 'destructive' : 'secondary'}
                                  className="text-xs mr-1"
                                >
                                  {allergy.allergen}
                                </Badge>
                              ))}
                            </div>
                          )}
                          {selectedPatient.medical_alerts.filter(alert => alert.active).length > 0 && (
                            <div>
                              <span className="text-xs font-medium text-blue-700">Medical Alerts: </span>
                              {selectedPatient.medical_alerts.filter(alert => alert.active).map((alert, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant={alert.severity === 'critical' || alert.severity === 'high' ? 'destructive' : 'secondary'}
                                  className="text-xs mr-1"
                                >
                                  {alert.description}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Query Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Your Question
                </label>
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Ask a question about the patient's medical data..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[100px] flex-1"
                    disabled={isAnalyzing}
                  />
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendQuery}
                disabled={!query.trim() || !selectedPatient || isAnalyzing}
                className="w-full gap-2"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Query
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Query Results */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Analysis Results</CardTitle>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
                  <AlertTriangle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Analysis Error</p>
                    <p className="text-sm">{error}</p>
                  </div>
                </div>
              )}

              {isAnalyzing && (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <Loader2 className="mx-auto h-12 w-12 animate-spin text-blue-500" />
                    <p className="mt-4 text-sm font-medium text-gray-700">
                      Analyzing patient data...
                    </p>
                    <p className="text-xs text-gray-500">
                      This may take a few moments
                    </p>
                  </div>
                </div>
              )}

              {analysisResult && (
                <div className="space-y-6">
                  {/* Clinical Summary */}
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="font-medium text-green-900">Clinical Summary</h3>
                        <p className="mt-1 text-sm text-green-700">{analysisResult.diagnosis.clinicalSummary}</p>
                      </div>
                    </div>
                  </div>

                  {/* Health Assessment */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Health Assessment</h3>
                    <p className="text-sm text-gray-700">{analysisResult.diagnosis.healthAssessment}</p>
                  </div>

                  {/* Recommendations */}
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Recommendations</h3>
                    <ul className="space-y-1">
                      {analysisResult.diagnosis.recommendations.map((rec, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                          <span className="font-medium text-blue-600">{index + 1}.</span>
                          <span>{rec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Risk Factors */}
                  {analysisResult.diagnosis.riskFactors.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-2">Risk Factors</h3>
                      <div className="flex flex-wrap gap-2">
                        {analysisResult.diagnosis.riskFactors.map((risk, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {risk}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Follow-up */}
                  <div className="flex items-center justify-between rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <div>
                      <span className="text-sm font-medium text-blue-900">Follow-up: </span>
                      <span className="text-sm text-blue-700">{analysisResult.diagnosis.followUpNeeded}</span>
                    </div>
                    <Badge 
                      variant={analysisResult.diagnosis.urgencyLevel === 'high' ? 'destructive' : 
                               analysisResult.diagnosis.urgencyLevel === 'moderate' ? 'default' : 'secondary'}
                    >
                      {analysisResult.diagnosis.urgencyLevel} priority
                    </Badge>
                  </div>

                  {/* Insurance Recommendations */}
                  {analysisResult.insurance && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-blue-600" />
                        Insurance Recommendations
                      </h3>
                      
                      {/* Summary */}
                      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 mb-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-blue-900">Available Plans:</span>
                            <span className="ml-2 text-blue-700">{analysisResult.insurance.availablePlans}</span>
                          </div>
                          <div>
                            <span className="font-medium text-blue-900">Best Plan:</span>
                            <span className="ml-2 text-blue-700">{analysisResult.insurance.summary.bestPlan}</span>
                          </div>
                          <div>
                            <span className="font-medium text-blue-900">Avg. Annual Cost:</span>
                            <span className="ml-2 text-blue-700">${analysisResult.insurance.summary.averageEstimatedCost.toFixed(0)}</span>
                          </div>
                          <div>
                            <span className="font-medium text-blue-900">Potential Savings:</span>
                            <span className="ml-2 text-blue-700">${Math.abs(analysisResult.insurance.summary.estimatedSavings).toFixed(0)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Top Recommendations */}
                      <div className="space-y-3">
                        {analysisResult.insurance.recommendations.slice(0, 3).map((rec, index) => (
                          <div key={index} className="rounded-lg border border-gray-200 p-4">
                            <div className="flex items-start justify-between mb-2">
                              <div>
                                <h4 className="font-medium text-gray-900">{rec.planName}</h4>
                                <p className="text-xs text-gray-600">
                                  {rec.planDetails?.issuer} • {rec.planDetails?.metalLevel} Level
                                </p>
                              </div>
                              <div className="text-right">
                                <div className="text-lg font-bold text-green-600">
                                  ${rec.estimatedAnnualCost.toFixed(0)}/year
                                </div>
                                <div className="text-xs text-gray-500">
                                  Score: {rec.recommendationScore.toFixed(1)}/100
                                </div>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-3">
                              <div>Premium: ${rec.breakdown.premiums.toFixed(0)}/year</div>
                              <div>Deductible: ${rec.planDetails?.deductible.toFixed(0)}</div>
                              <div>Primary Care: ${rec.planDetails?.copayPrimaryVisit}</div>
                              <div>Specialist: ${rec.planDetails?.copaySpecialistVisit}</div>
                            </div>
                            
                            <div className="flex items-center gap-1 mt-2">
                              {[...Array(5)].map((_, i) => (
                                <div
                                  key={i}
                                  className={`h-2 w-4 rounded ${
                                    i < Math.floor((rec.planDetails?.qualityRating || 0))
                                      ? 'bg-yellow-400'
                                      : 'bg-gray-200'
                                  }`}
                                />
                              ))}
                              <span className="text-xs text-gray-500 ml-1">
                                {rec.planDetails?.qualityRating}/5 stars
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Medical Codes */}
                      {analysisResult.insurance.medicalCodes.length > 0 && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 mb-2">Medical Codes Identified</h4>
                          <div className="space-y-2">
                            {analysisResult.insurance.medicalCodes.slice(0, 3).map((code, index) => (
                              <div key={index} className="rounded border border-gray-200 p-2">
                                <div className="flex items-center justify-between">
                                  <div>
                                    <span className="font-mono text-sm font-medium">{code.icd10}</span>
                                    <span className="ml-2 text-sm text-gray-700">{code.description}</span>
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Avg: ${code.estimatedCost.average}
                                  </div>
                                </div>
                                {code.cptCodes.length > 0 && (
                                  <div className="mt-1 flex gap-1">
                                    {code.cptCodes.map((cpt, i) => (
                                      <Badge key={i} variant="outline" className="text-xs">
                                        {cpt}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Literature References */}
                  {analysisResult.literature.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-900 mb-3">Related Literature</h3>
                      <div className="space-y-3">
                        {analysisResult.literature.slice(0, 3).map((article, index) => (
                          <div key={index} className="rounded-lg border border-gray-200 p-3">
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex-1">
                                <h4 className="text-sm font-medium text-gray-900 overflow-hidden">
                                  {article.title}
                                </h4>
                                <p className="mt-1 text-xs text-gray-600">
                                  {article.authors} • {article.journal} • {article.year}
                                </p>
                                <p className="mt-2 text-xs text-gray-700 overflow-hidden">
                                  {article.abstract}
                                </p>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="shrink-0"
                                onClick={() => window.open(article.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Disclaimer */}
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
                    <p className="text-xs text-yellow-800">
                      <strong>Disclaimer:</strong> {analysisResult.disclaimer}
                    </p>
                  </div>
                </div>
              )}

              {!analysisResult && !isAnalyzing && !error && (
                <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-200 text-gray-500">
                  <div className="text-center">
                    <Brain className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="mt-2 text-sm font-medium">
                      AI analysis results will appear here
                    </p>
                    <p className="text-xs">
                      Select a patient and ask a question to get started
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & History */}
        <div className="space-y-6">
          {/* Comprehensive Analysis */}
          <Card className="border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="text-lg text-blue-900">Comprehensive Analysis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-blue-700">
                Generate a complete medical analysis including health assessment, risk factors, and preventive care recommendations.
              </p>
              <Button
                onClick={handleComprehensiveAnalysis}
                disabled={!selectedPatient || isAnalyzing}
                className="w-full gap-2 bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Running Analysis...
                  </>
                ) : (
                  <>
                    <Brain className="h-5 w-5" />
                    Run Comprehensive Analysis
                  </>
                )}
              </Button>
              {!selectedPatient && (
                <p className="text-xs text-blue-600">
                  Select a patient to run comprehensive analysis
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Queries */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Queries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                "What medications is this patient taking?",
                "Show me recent vital signs",
                "List active conditions",
                "Recent lab results",
                "Appointment history",
                "Allergies and reactions",
              ].map((quickQuery, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start text-left"
                  onClick={() => handleQuickQuery(quickQuery)}
                  disabled={isAnalyzing || !selectedPatient}
                >
                  {quickQuery}
                </Button>
              ))}
            </CardContent>
          </Card>

          {/* Query History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-4 w-4" />
                Recent Queries
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {queryHistory.map((historyQuery, index) => (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-left text-xs"
                  onClick={() => setQuery(historyQuery)}
                  disabled={isAnalyzing}
                >
                  {historyQuery}
                </Button>
              ))}
              {queryHistory.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-500">
                  No recent queries
                </p>
              )}
            </CardContent>
          </Card>

          {/* Features Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Planned Features</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <h4 className="text-sm font-medium">
                  Natural Language Queries
                </h4>
                <p className="text-xs text-gray-600">
                  Ask questions in plain English about patient data
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">FHIR Data Analysis</h4>
                <p className="text-xs text-gray-600">
                  Deep analysis of patient FHIR resources and relationships
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Smart Insights</h4>
                <p className="text-xs text-gray-600">
                  AI-powered insights and recommendations based on patient data
                </p>
              </div>
              <div className="space-y-2">
                <h4 className="text-sm font-medium">Export Results</h4>
                <p className="text-xs text-gray-600">
                  Export query results and insights for documentation
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
