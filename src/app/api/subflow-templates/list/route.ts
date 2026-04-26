import { NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { TemplateMetadata } from "@/types/subflowTemplates";

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), "subflow_templates");
    
    // Ensure the base directory exists
    try {
      await fs.access(baseDir);
    } catch {
      await fs.mkdir(baseDir, { recursive: true });
      return NextResponse.json({ success: true, templates: [] });
    }
    
    const dirs = await fs.readdir(baseDir, { withFileTypes: true });
    const templates: TemplateMetadata[] = [];
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const templateDir = path.join(baseDir, dir.name);
        const metaPath = path.join(templateDir, "metadata.json");
        
        try {
          const content = await fs.readFile(metaPath, "utf-8");
          const meta: TemplateMetadata = JSON.parse(content);
          
          // Add sanitized folder name as id for loading
          // meta.id = dir.name; // TemplateMetadata type doesn't have id, but we might need it.
          // The plan shows loading by name, but sanitized name is used for dir.
          
          // Add preview data if it exists
          if (meta.previewPath) {
            try {
              const previewBuf = await fs.readFile(path.join(templateDir, meta.previewPath));
              meta.previewData = `data:image/png;base64,${previewBuf.toString('base64')}`;
            } catch (previewErr) {
              console.warn(`Could not read preview for template ${meta.name}:`, previewErr);
            }
          }
          
          templates.push(meta);
        } catch (metaErr) {
          // Skip directories without valid metadata
          console.warn(`Skipping invalid template directory ${dir.name}:`, metaErr);
        }
      }
    }
    
    // Sort templates by lastModified descending
    templates.sort((a, b) => new Date(b.lastModified).getTime() - new Date(a.lastModified).getTime());
    
    return NextResponse.json({ success: true, templates });
  } catch (error) {
    console.error("Error listing subflow templates:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
