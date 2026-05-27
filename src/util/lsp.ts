export interface LSPDiagnostic {
  file: string;
  line: number;
  column: number;
  message: string;
  severity: "error" | "warning" | "info";
}

export function getProjectDiagnostics(projectRoot?: string): LSPDiagnostic[] {
  return [];
}
