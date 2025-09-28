// Known patient files in the FHIR bucket
// Add your actual patient filenames here when you upload them
export const KNOWN_PATIENT_FILES = [
  'Abel832_Zieme486_9f5247cc-6762-3d1d-ebc6-29bf03f921e4.json',
  'Kelly223_Santana368_Gusikowski974_db51b965-a6a0-7d0b-0961-c2684de4f4be.json',
  // Add more filenames here as you upload them
  // Example patterns:
  // 'FirstName123_LastName456_uuid-here.json',
];

// Function to extract patient names from FHIR filenames
export function extractPatientNameFromFHIRFilename(filename: string): string {
  // Remove .json extension
  const nameWithoutExt = filename.replace('.json', '');
  
  // Split by underscore and take first two parts (first name, last name)
  const parts = nameWithoutExt.split('_');
  
  if (parts.length >= 2) {
    // Remove numbers from names
    const firstName = parts[0].replace(/\d+/g, '');
    const lastName = parts[1].replace(/\d+/g, '');
    return `${firstName} ${lastName}`;
  }
  
  // Fallback: just clean up the filename
  return nameWithoutExt.replace(/_/g, ' ').replace(/\d+/g, '').trim();
}