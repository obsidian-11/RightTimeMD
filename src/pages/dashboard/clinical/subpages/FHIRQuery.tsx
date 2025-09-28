import { useState } from "react";
import { FileText, Brain, Send, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClinic } from "@/hooks";

export function FHIRQuery() {
  const { currentClinic } = useClinic();
  const [selectedPatient, setSelectedPatient] = useState("");
  const [query, setQuery] = useState("");
  const [queryHistory, setQueryHistory] = useState([
    "What medications is this patient currently taking?",
    "Show me the latest vital signs for this patient",
    "What conditions does this patient have?",
    "When was this patient's last appointment?",
  ]);

  const mockPatients = [
    { id: "1", name: "John Doe", mrn: "MRN001" },
    { id: "2", name: "Jane Smith", mrn: "MRN002" },
    { id: "3", name: "Robert Johnson", mrn: "MRN003" },
  ];

  const handleSendQuery = () => {
    if (!query.trim() || !selectedPatient) return;

    // Add to history if not already there
    if (!queryHistory.includes(query)) {
      setQueryHistory((prev) => [query, ...prev.slice(0, 9)]); // Keep only last 10
    }

    // TODO: Implement AI query processing
    console.log("Sending query:", query, "for patient:", selectedPatient);

    // Clear query
    setQuery("");
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

      {/* Coming Soon Banner */}
      <Card className="border-purple-200 bg-purple-50">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-purple-600">
              <Brain className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-medium text-purple-900">
                AI-Powered FHIR Analysis
              </h3>
              <p className="text-sm text-purple-700">
                This feature is currently in development. Soon you'll be able to
                ask natural language questions about patient FHIR data.
              </p>
            </div>
            <Badge variant="secondary" className="ml-auto">
              Coming Soon
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
                <Select
                  value={selectedPatient}
                  onValueChange={setSelectedPatient}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a patient to query..." />
                  </SelectTrigger>
                  <SelectContent>
                    {mockPatients.map((patient) => (
                      <SelectItem key={patient.id} value={patient.id}>
                        {patient.name} - {patient.mrn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Query Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Your Question
                </label>
                <div className="flex space-x-2">
                  <Textarea
                    placeholder="Ask a question about the patient's FHIR data..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="min-h-[100px] flex-1"
                    disabled
                  />
                </div>
              </div>

              {/* Send Button */}
              <Button
                onClick={handleSendQuery}
                disabled={!query.trim() || !selectedPatient}
                className="w-full gap-2"
              >
                <Send className="h-4 w-4" />
                Send Query (Coming Soon)
              </Button>
            </CardContent>
          </Card>

          {/* Query Results Placeholder */}
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Query Results</CardTitle>
            </CardHeader>
            <CardContent>
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
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & History */}
        <div className="space-y-6">
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
                  disabled
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
                  disabled
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
