# RightTimeMD - NPM Commands Reference

## 🏥 RightTimeMD Patient Analysis & FHIR Processing Commands

This document provides a comprehensive guide to all available npm commands in the RightTimeMD project.

---

## 🚀 Web Application Commands

### **Start the Web Application**
```bash
npm run start-server
```
**Description:** Starts the Express.js API server on port 5001  
**Use Case:** Run this to start the backend API for the web application  
**Endpoints Available:**
- `/api/health` - Health check
- `/api/patient/:id` - Patient lookup
- `/api/analyze-patient` - Full patient analysis
- `/api/fhir-files` - List FHIR files
- `/api/fhir-parse/:filename` - Parse FHIR files
- `/api/chat` - Patient chatbot

### **Start the React Frontend**
```bash
cd web-app/client && npm start
```
**Description:** Starts the React development server on port 3000  
**Use Case:** Access the web interface with tabs for Patient Analysis and FHIR Parser

### **Interactive Patient Chatbot**
```bash
npm run chatbot
```
**Description:** Launches a command-line chatbot interface  
**Use Case:** Interactive medical chatbot for patient questions  
**Commands:**
- `patient <id>` - Set patient context
- `clear` - Clear conversation history
- `quit` or `exit` - Exit chatbot

---

## 🔬 Medical Analysis Commands

### **Complete Patient Analysis by UUID**
```bash
npm run analyze-uid <patient-uuid>
```
**Description:** Runs complete medical and insurance analysis for a specific patient  
**Use Case:** Full analysis pipeline including medical diagnosis and insurance recommendations  
**Example:** `npm run analyze-uid 0516d26b-1ff6-4918-aaa2-2ba115617620`

### **Patient Selection and Analysis**
```bash
npm run patient-selector
```
**Description:** Interactive patient selection tool  
**Use Case:** Choose a patient from the database and run analysis

### **Quick Patient Analysis**
```bash
npm run analyze
```
**Description:** Builds the patient selector without running it  
**Use Case:** Prepare analysis tools

---

## 🩺 Core Medical Processing

### **Patient Data Extraction**
```bash
npm run patient-extraction
```
**Description:** Extracts patient data from FHIR files  
**Use Case:** Parse FHIR bundles and extract medical information

### **Medical Diagnosis Generation**
```bash
npm run medical-diagnosis
```
**Description:** Generates AI-powered medical analysis using OpenAI  
**Use Case:** Create medical summaries and recommendations

### **Complete Medical Analysis**
```bash
npm run complete-analysis
```
**Description:** Runs full medical analysis with insurance lookup  
**Use Case:** Comprehensive patient analysis including insurance recommendations

---

## 🏗️ Build Commands

### **Build Patient Extraction**
```bash
npm run build
```
**Description:** Compiles patient_extraction.ts to JavaScript  
**Output:** `build/patient_extraction.js`

### **Build Medical Diagnosis**
```bash
npm run build-diagnosis
```
**Description:** Compiles medical_diagnosis.ts to JavaScript  
**Output:** `build/medical_diagnosis.js`

### **Build Insurance Lookup**
```bash
npm run build-insurance
```
**Description:** Compiles insurance_lookup.ts to JavaScript  
**Output:** `build/insurance_lookup.js`

### **Build Complete Analysis**
```bash
npm run build-complete
```
**Description:** Compiles complete analysis modules  
**Output:** `build/complete_analysis.js`, `build/insurance_lookup.js`

### **Build Patient Selector**
```bash
npm run build-selector
```
**Description:** Compiles all selector and analysis modules  
**Output:** All analysis JavaScript files in `build/` directory

---

## 🗄️ Database Commands

### **Query Patient Information**
```bash
npm run query-patient <patient-id>
```
**Description:** Looks up patient information in the database  
**Use Case:** Quick patient data retrieval  
**Example:** `npm run query-patient 0516d26b-1ff6-4918-aaa2-2ba115617620`

---

## 🧪 Testing & Development

### **Run Tests**
```bash
npm test
```
**Description:** Currently shows "no test specified" error  
**Use Case:** Placeholder for future test implementation

### **Run Test Analysis**
```bash
npm run run-test
```
**Description:** Builds and runs patient extraction for testing  
**Use Case:** Test the patient extraction functionality

---

## 🔧 Environment Setup

### **Prerequisites**
Before running any commands, ensure you have:

1. **Environment Variables** - `.env` file with:
   ```
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   OPENAI_API_KEY=your_openai_api_key
   ```

2. **Dependencies Installed**:
   ```bash
   npm install
   ```

3. **React Dependencies** (for web app):
   ```bash
   cd web-app/client && npm install
   ```

---

## 📋 Common Workflows

### **1. Start the Complete Web Application**
```bash
# Terminal 1: Start the API server
npm run start-server

# Terminal 2: Start the React frontend
cd web-app/client && npm start
```
Then open http://localhost:3000

### **2. Analyze a Specific Patient**
```bash
npm run analyze-uid 0516d26b-1ff6-4918-aaa2-2ba115617620
```

### **3. Use the Interactive Chatbot**
```bash
npm run chatbot
```

### **4. Parse FHIR Files via Web Interface**
1. Run the web application (see workflow #1)
2. Click "🩺 FHIR Parser" tab
3. Select a patient file and click "Parse Medical Records"

---

## 🚨 Troubleshooting

### **Common Issues:**

1. **"Cannot connect to server"** - Ensure API server is running with `npm run start-server`

2. **"Missing environment variables"** - Check that `.env` file exists with all required keys

3. **"TypeScript compilation errors"** - Run individual build commands to identify issues

4. **"Port already in use"** - Check if another instance is running:
   ```bash
   lsof -ti:5001  # Check port 5001 (API)
   lsof -ti:3000  # Check port 3000 (React)
   ```

### **Reset Everything:**
```bash
# Kill all processes
pkill -f "node.*server.js"
pkill -f "react-scripts"

# Clean build directory
rm -rf build/

# Restart
npm run start-server
```

---

## 📊 Output Files

### **Generated Files:**
- `build/` - Compiled JavaScript files
- `patient_json/` - Medical analysis JSON outputs
- `parsed_fhir/` - Parsed FHIR summaries
- Various analysis reports in Supabase storage

### **Key Directories:**
- `fhir/` - FHIR patient data files
- `web-app/` - React web application
- `database/` - Database configuration
- `cache/` - Temporary cache files

---

## 📞 Support

For issues or questions:
- Check the troubleshooting section above
- Review console output for error messages
- Ensure all environment variables are properly configured

---

**Last Updated:** September 28, 2025  
**Version:** 1.0.0