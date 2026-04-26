import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { TemplateMetadata } from "@/types/subflowTemplates";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const version = request.nextUrl.searchParams.get("version");
  
  if (!name) {
    return NextResponse.json({ success: false, error: "Template name is required" }, { status: 400 });
  }
  
  try {
    const sanitizedName = name.replace(/[^a-zA-Z0-9-_]/g, "_");
    const templateDir = path.join(process.cwd(), "subflow_templates", sanitizedName);
    const metaPath = path.join(templateDir, "metadata.json");
    
    // Check if template exists
    try {
      await fs.access(metaPath);
    } catch {
      return NextResponse.json({ success: false, error: `Template "${name}" not found` }, { status: 404 });
    }
    
    const meta: TemplateMetadata = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    
    // If no version specified, use currentVersion
    const v = version || meta.currentVersion.toString();
    const versionInfo = meta.versions[v];
    
    if (!versionInfo) {
      return NextResponse.json({ 
        success: false, 
        error: `Version ${v} not found for template "${name}"` 
      }, { status: 404 });
    }
    
    const filePath = path.join(templateDir, versionInfo.path);
    
    // Check if version file exists
    try {
      await fs.access(filePath);
    } catch {
      return NextResponse.json({ 
        success: false, 
        error: `File for version ${v} of template "${name}" is missing` 
      }, { status: 500 });
    }
    
    const workflow = JSON.parse(await fs.readFile(filePath, "utf-8"));
    
    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    console.error(`Error loading subflow template "${name}":`, error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
