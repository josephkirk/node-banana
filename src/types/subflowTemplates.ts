export interface TemplateVersion {
  path: string;
  timestamp: string;
}

export interface TemplateMetadata {
  name: string;
  description: string;
  currentVersion: number;
  previewPath?: string;
  previewData?: string; // Base64 data for browser preview
  versions: Record<string, TemplateVersion>;
  lastModified: string;
}

export interface SaveTemplateRequest {
  subflowId: string;
  templateName: string;
  description: string;
  workflow: any;
  previewImage?: string; // Data URL
}
