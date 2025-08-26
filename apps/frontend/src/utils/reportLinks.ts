

// Simple report link format: report://report-id
export function createReportLink(reportId: string): string {
  return `report://${reportId}`;
}

export function parseReportId(url: string): string | null {
  try {
    const urlObj = new URL(url);
    
    if (urlObj.protocol !== 'report:') {
      return null;
    }
    
    return urlObj.hostname;
  } catch (error) {
    console.error('Failed to parse report link:', error);
    return null;
  }
} 