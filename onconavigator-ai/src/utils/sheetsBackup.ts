import { SavedAssessment } from "../components/UserProfileSystem";

// Local storage key for persisting the user's active backup spreadsheet ID
const SPREADSHEET_ID_KEY = "onconav_backup_spreadsheet_id";

// Custom type to report progress during bulk synchronization
export interface SyncResult {
  success: boolean;
  spreadsheetId?: string;
  spreadsheetUrl?: string;
  error?: string;
}

/**
 * Creates a new Google Spreadsheet for OncoNavigator backups
 * and writes the default headers.
 */
export async function createBackupSpreadsheet(accessToken: string): Promise<string> {
  const fileBody = {
    properties: {
      title: "OncoNavigator Clinical Screenings Backup",
    },
    sheets: [
      {
        properties: {
          title: "Assessments Log",
          gridProperties: {
            frozenRowCount: 1,
            columnCount: 10,
          },
        },
      },
    ],
  };

  const response = await fetch("https://sheets.googleapis.com/v4/spreadsheets", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify(fileBody),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to create spreadsheet: ${response.statusText}. Details: ${errText}`);
  }

  const result = await response.json();
  const spreadsheetId = result.spreadsheetId;

  if (!spreadsheetId) {
    throw new Error("Spreadsheet created but no spreadsheetId returned from the Google API.");
  }

  // Persist the spreadsheet ID
  localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId);

  // Write headers
  const headers = [
    [
      "Timestamp",
      "Screening Target",
      "Patient Symptoms / Documents Ingest",
      "Calculated Risk Priority",
      "Clinician Decision-Support Explanation",
      "guideline Analysis Narrative",
      "Suggested Next Clinical Steps",
      "AI Follow-up Question",
      "Database Reference ID",
    ],
  ];

  await writeSheetValues(accessToken, spreadsheetId, "Assessments Log!A1:I1", headers);

  return spreadsheetId;
}

/**
 * Writes or appends values to a specific range in a spreadsheet.
 */
async function writeSheetValues(
  accessToken: string,
  spreadsheetId: string,
  range: string,
  values: string[][]
): Promise<void> {
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?valueInputOption=USER_ENTERED`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ values }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to write cells in spreadsheet: ${response.statusText}. Details: ${errText}`);
  }
}

/**
 * Appends a list of assessments to the spreadsheet log.
 */
export async function appendAssessments(
  accessToken: string,
  spreadsheetId: string,
  assessments: SavedAssessment[]
): Promise<void> {
  const rows = assessments.map((item) => [
    item.timestamp || new Date().toLocaleString(),
    item.cancerType || "",
    item.symptoms || "",
    item.riskLevel || "",
    item.explanation || "",
    item.analysisText || "",
    (item.nextSteps || []).map((step, idx) => `${idx + 1}. ${step}`).join("\n"),
    item.followUpQuestion || "",
    item.id || "",
  ]);

  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Assessments%20Log!A1:append?valueInputOption=USER_ENTERED`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ values: rows }),
    }
  );

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Failed to append rows: ${response.statusText}. Details: ${errText}`);
  }
}

/**
 * Helper to get the existing Spreadsheet ID or null
 */
export function getSavedSpreadsheetId(): string | null {
  return localStorage.getItem(SPREADSHEET_ID_KEY);
}

/**
 * Reset spreadsheet reference in case it was deleted
 */
export function clearSavedSpreadsheetId(): void {
  localStorage.removeItem(SPREADSHEET_ID_KEY);
}

/**
 * Performs a complete sync of assessments to the Google Sheet.
 * If a sheet does not exist, it creates it.
 */
export async function syncAssessmentsToGoogleSheet(
  accessToken: string,
  assessments: SavedAssessment[]
): Promise<SyncResult> {
  if (assessments.length === 0) {
    return { success: false, error: "No client assessment history records to backing up." };
  }

  try {
    let spreadsheetId = getSavedSpreadsheetId();
    let isNew = false;

    if (!spreadsheetId) {
      spreadsheetId = await createBackupSpreadsheet(accessToken);
      isNew = true;
    }

    // Attempt to write the rows. If the spreadsheet does not exist (e.g. deleted by user),
    // clear memory and retry once.
    try {
      await appendAssessments(accessToken, spreadsheetId, assessments);
    } catch (err: any) {
      if (isNew) throw err; // Already tried creating new, so rethrow

      console.warn("Retrying sheet backup creation as the existing spreadsheet ID was not found or deleted:", err);
      clearSavedSpreadsheetId();
      spreadsheetId = await createBackupSpreadsheet(accessToken);
      await appendAssessments(accessToken, spreadsheetId, assessments);
    }

    return {
      success: true,
      spreadsheetId,
      spreadsheetUrl: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`,
    };
  } catch (error: any) {
    console.error("Critical Google Sheets sync error:", error);
    return {
      success: false,
      error: error.message || String(error),
    };
  }
}
