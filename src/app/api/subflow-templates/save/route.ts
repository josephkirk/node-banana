import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";
import { SaveTemplateRequest, TemplateMetadata } from "@/types/subflowTemplates";

export async function POST(request: NextRequest) {
  try {
    const body: SaveTemplateRequest = await request.json();
    const { templateName, description, workflow, previewImage } = body;
    
    if (!templateName) {
      return NextResponse.json({ success: false, error: "Template name is required" }, { status: 400 });
    }

    const baseDir = path.join(process.cwd(), "subflow_templates");
    // Sanitize templateName to use as a directory name
    const sanitizedName = templateName.replace(/[^a-zA-Z0-9-_]/g, "_");
    const templateDir = path.join(baseDir, sanitizedName);
    
    // Ensure directories exist
    await fs.mkdir(templateDir, { recursive: true });
    
    const metadataPath = path.join(templateDir, "metadata.json");
    let metadata: TemplateMetadata = {
      name: templateName,
      description: description || "",
      currentVersion: 0,
      versions: {},
      lastModified: new Date().toISOString()
    };
    
    try {
      const existing = await fs.readFile(metadataPath, "utf-8");
      metadata = JSON.parse(existing);
    } catch (e) {
      // metadata.json doesn't exist yet, use initial metadata
    }
    
    metadata.currentVersion += 1;
    const versionNum = metadata.currentVersion;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `v${versionNum}_${timestamp}.json`;
    const filePath = path.join(templateDir, fileName);
    
    // Save the workflow JSON to the versioned file
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
    
    // Update metadata
    metadata.versions[versionNum.toString()] = {
      path: fileName,
      timestamp: new Date().toISOString()
    };
    metadata.description = description || metadata.description; // Update description if provided
    metadata.lastModified = new Date().toISOString();
    
    // Handle preview image if provided
    if (previewImage && previewImage.startsWith('data:image')) {
      const base64Data = previewImage.replace(/^data:image\/\w+;base64,/, "");
      await fs.writeFile(path.join(templateDir, "preview.png"), Buffer.from(base64Data, "base64"));
      metadata.previewPath = "preview.png";
    }
    
    // Save updated metadata
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return NextResponse.json({ 
      success: true, 
      version: versionNum,
      templateName: sanitizedName 
    });
  } catch (error) {
    console.error("Error saving subflow template:", error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
