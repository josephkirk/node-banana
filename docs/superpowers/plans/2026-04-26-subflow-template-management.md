# Subflow Template Management Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enable users to save, version, and browse Subflow templates with metadata and preview snapshots.

**Architecture:** Templates are stored on the server in `subflow_templates/`. Each template has a folder with a `metadata.json` index and versioned JSON files. A dedicated API handles storage and retrieval, while two new modals provide the UI for saving and browsing.

**Tech Stack:** Next.js (App Router), TypeScript, Zustand, Tailwind CSS, fs/promises (Server-side storage).

---

### Task 1: Types & Store Infrastructure

**Files:**
- Create: `src/types/subflowTemplates.ts`
- Modify: `src/store/workflowStore.ts`

- [ ] **Step 1: Define Subflow Template types**
Create `src/types/subflowTemplates.ts`.

```typescript
export interface TemplateVersion {
  path: string;
  timestamp: string;
}

export interface TemplateMetadata {
  name: string;
  description: string;
  currentVersion: number;
  previewPath?: string;
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
```

- [ ] **Step 2: Add store actions for templates**
Modify `src/store/workflowStore.ts` to add placeholders for template actions.

```typescript
// Add to WorkflowStore interface
saveSubFlowAsTemplate: (subflowId: string, name: string, description: string, previewImage?: string) => Promise<boolean>;
loadSubFlowTemplate: (subflowId: string, templateName: string, version?: number) => Promise<boolean>;

// Add to create implementation
saveSubFlowAsTemplate: async (subflowId, name, description, previewImage) => {
  const state = get();
  const node = state.nodes.find(n => n.id === subflowId);
  if (!node || node.type !== 'subflow') return false;
  
  try {
    const response = await fetch('/api/subflow-templates/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subflowId,
        templateName: name,
        description,
        workflow: node.data.subgraph,
        previewImage
      })
    });
    return response.ok;
  } catch (err) {
    console.error('Failed to save template', err);
    return false;
  }
},
loadSubFlowTemplate: async (subflowId, templateName, version) => {
  const state = get();
  try {
    const url = `/api/subflow-templates/load?name=${encodeURIComponent(templateName)}${version ? `&version=${version}` : ''}`;
    const response = await fetch(url);
    const result = await response.json();
    
    if (result.success && result.workflow) {
      state.updateNodeData(subflowId, { subgraph: result.workflow });
      return true;
    }
    return false;
  } catch (err) {
    console.error('Failed to load template', err);
    return false;
  }
}
```

- [ ] **Step 3: Commit Infrastructure**
```bash
git add src/types/subflowTemplates.ts src/store/workflowStore.ts
git commit -m "feat: add subflow template types and store actions"
```

---

### Task 2: API - Save Template

**Files:**
- Create: `src/app/api/subflow-templates/save/route.ts`

- [ ] **Step 1: Implement the save endpoint**
Create `src/app/api/subflow-templates/save/route.ts`. It should handle directory creation, auto-versioning, and metadata updates.

```typescript
import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templateName, description, workflow, previewImage } = body;
    
    const baseDir = path.join(process.cwd(), "subflow_templates");
    const templateDir = path.join(baseDir, templateName.replace(/[^a-zA-Z0-9-_]/g, "_"));
    
    await fs.mkdir(templateDir, { recursive: true });
    
    const metadataPath = path.join(templateDir, "metadata.json");
    let metadata: any = {
      name: templateName,
      description,
      currentVersion: 0,
      versions: {},
      lastModified: new Date().toISOString()
    };
    
    try {
      const existing = await fs.readFile(metadataPath, "utf-8");
      metadata = JSON.parse(existing);
    } catch (e) {}
    
    metadata.currentVersion += 1;
    const versionNum = metadata.currentVersion;
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const fileName = `v${versionNum}_${timestamp}.json`;
    const filePath = path.join(templateDir, fileName);
    
    await fs.writeFile(filePath, JSON.stringify(workflow, null, 2));
    
    metadata.versions[versionNum.toString()] = {
      path: fileName,
      timestamp: new Date().toISOString()
    };
    metadata.description = description; // Update description
    metadata.lastModified = new Date().toISOString();
    
    if (previewImage && previewImage.startsWith('data:image')) {
      const base64Data = previewImage.replace(/^data:image\/\w+;base64,/, "");
      await fs.writeFile(path.join(templateDir, "preview.png"), Buffer.from(base64Data, "base64"));
      metadata.previewPath = "preview.png";
    }
    
    await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    
    return NextResponse.json({ success: true, version: versionNum });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Commit API Save**
```bash
git add src/app/api/subflow-templates/save/route.ts
git commit -m "feat: implement subflow template save API"
```

---

### Task 3: API - List & Load

**Files:**
- Create: `src/app/api/subflow-templates/list/route.ts`
- Create: `src/app/api/subflow-templates/load/route.ts`

- [ ] **Step 1: Implement listing endpoint**
Create `src/app/api/subflow-templates/list/route.ts`.

```typescript
import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

export async function GET() {
  try {
    const baseDir = path.join(process.cwd(), "subflow_templates");
    await fs.mkdir(baseDir, { recursive: true });
    
    const dirs = await fs.readdir(baseDir, { withFileTypes: true });
    const templates = [];
    
    for (const dir of dirs) {
      if (dir.isDirectory()) {
        const metaPath = path.join(baseDir, dir.name, "metadata.json");
        try {
          const content = await fs.readFile(metaPath, "utf-8");
          const meta = JSON.parse(content);
          // Add preview URL if it exists
          if (meta.previewPath) {
             // In a real app we might need a route to serve these files, 
             // but for now we'll assume they can be reached or send as base64
             const previewBuf = await fs.readFile(path.join(baseDir, dir.name, meta.previewPath));
             meta.previewData = `data:image/png;base64,${previewBuf.toString('base64')}`;
          }
          templates.push(meta);
        } catch (e) {}
      }
    }
    
    return NextResponse.json({ success: true, templates });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

- [ ] **Step 2: Implement loading endpoint**
Create `src/app/api/subflow-templates/load/route.ts`.

```typescript
import { NextRequest, NextResponse } from "next/server";
import * as fs from "fs/promises";
import * as path from "path";

export async function GET(request: NextRequest) {
  const name = request.nextUrl.searchParams.get("name");
  const version = request.nextUrl.searchParams.get("version");
  
  if (!name) return NextResponse.json({ success: false, error: "Name required" }, { status: 400 });
  
  try {
    const templateDir = path.join(process.cwd(), "subflow_templates", name.replace(/[^a-zA-Z0-9-_]/g, "_"));
    const metaPath = path.join(templateDir, "metadata.json");
    const meta = JSON.parse(await fs.readFile(metaPath, "utf-8"));
    
    const v = version || meta.currentVersion.toString();
    const versionInfo = meta.versions[v];
    
    if (!versionInfo) return NextResponse.json({ success: false, error: "Version not found" }, { status: 404 });
    
    const workflow = JSON.parse(await fs.readFile(path.join(templateDir, versionInfo.path), "utf-8"));
    
    return NextResponse.json({ success: true, workflow });
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit API List/Load**
```bash
git add src/app/api/subflow-templates/list/route.ts src/app/api/subflow-templates/load/route.ts
git commit -m "feat: implement subflow template list and load API"
```

---

### Task 4: UI - Save Modal

**Files:**
- Create: `src/components/modals/TemplateSaveModal.tsx`

- [ ] **Step 1: Build the save modal**
Create `src/components/modals/TemplateSaveModal.tsx`.

```typescript
"use client";
import React, { useState } from "react";
import { useWorkflowStore } from "@/store/workflowStore";

interface TemplateSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  subflowId: string;
  initialName: string;
  previewImage?: string;
}

export function TemplateSaveModal({ isOpen, onClose, subflowId, initialName, previewImage }: TemplateSaveModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const saveSubFlowAsTemplate = useWorkflowStore(state => state.saveSubFlowAsTemplate);

  if (!isOpen) return null;

  const handleSave = async () => {
    setIsSaving(true);
    const success = await saveSubFlowAsTemplate(subflowId, name, description, previewImage);
    setIsSaving(false);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl">
        <h2 className="text-xl font-bold text-white mb-4">Save Subflow Template</h2>
        
        {previewImage && (
          <div className="w-full aspect-video bg-black rounded-lg mb-4 overflow-hidden border border-neutral-800">
             <img src={previewImage} className="w-full h-full object-cover" alt="Preview" />
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Template Name</label>
            <input 
              value={name} 
              onChange={e => setName(e.target.value)}
              className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">Description</label>
            <textarea 
              value={description} 
              onChange={e => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors">Cancel</button>
          <button 
            onClick={handleSave} 
            disabled={isSaving || !name}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all"
          >
            {isSaving ? "Saving..." : "Save Template"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit Save Modal**
```bash
git add src/components/modals/TemplateSaveModal.tsx
git commit -m "feat: add TemplateSaveModal component"
```

---

### Task 5: UI - Browser Modal

**Files:**
- Create: `src/components/modals/TemplateBrowserModal.tsx`

- [ ] **Step 1: Build the browser modal**
Create `src/components/modals/TemplateBrowserModal.tsx`.

```typescript
"use client";
import React, { useEffect, useState } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { TemplateMetadata } from "@/types/subflowTemplates";

interface TemplateBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  subflowId: string;
}

export function TemplateBrowserModal({ isOpen, onClose, subflowId }: TemplateBrowserModalProps) {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const loadSubFlowTemplate = useWorkflowStore(state => state.loadSubFlowTemplate);

  useEffect(() => {
    if (isOpen) {
      fetch('/api/subflow-templates/list')
        .then(res => res.json())
        .then(data => {
          if (data.success) setTemplates(data.templates);
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelect = async (name: string) => {
    const success = await loadSubFlowTemplate(subflowId, name);
    if (success) onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-4xl max-h-[80vh] bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl flex flex-col">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Browse Subflow Templates</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-white">✕</button>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          {isLoading ? (
            <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" /></div>
          ) : templates.length === 0 ? (
            <div className="text-center py-20 text-neutral-500">No templates found. Save one to get started!</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map(tpl => (
                <div 
                  key={tpl.name}
                  onClick={() => handleSelect(tpl.name)}
                  className="group bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-all"
                >
                  <div className="aspect-video bg-black relative">
                    {tpl.previewData ? (
                      <img src={tpl.previewData} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" alt={tpl.name} />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700">No Preview</div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-3">
                    <h3 className="text-sm font-bold text-white truncate">{tpl.name}</h3>
                    <p className="text-xs text-neutral-500 line-clamp-2 mt-1">{tpl.description || "No description provided."}</p>
                    <div className="mt-2 text-[10px] text-neutral-600 font-mono">v{tpl.currentVersion} • {new Date(tpl.lastModified).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit Browser Modal**
```bash
git add src/components/modals/TemplateBrowserModal.tsx
git commit -m "feat: add TemplateBrowserModal component"
```

---

### Task 6: UI Integration

**Files:**
- Modify: `src/components/nodes/ControlPanel.tsx`
- Modify: `src/components/nodes/SubFlowNode.tsx`

- [ ] **Step 1: Update SubFlowControls to support templates**
Modify `src/components/nodes/ControlPanel.tsx` to include the new buttons and state for modals.

```typescript
// Add imports at top
import { TemplateSaveModal } from "../modals/TemplateSaveModal";
import { TemplateBrowserModal } from "../modals/TemplateBrowserModal";

// Inside SubFlowControls component:
const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
const [isBrowserModalOpen, setIsBrowserModalOpen] = useState(false);

// Find the Subflow node in the store to get the preview media if needed
// (Alternatively, pass it via SubFlowNode component state)

// Add buttons in the flex-col gap-2 container:
<button
  onClick={() => setIsBrowserModalOpen(true)}
  className="nodrag nopan w-full px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-xs font-medium rounded border border-neutral-600 transition-colors flex items-center justify-center gap-2"
>
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
  Browse Templates
</button>

<button
  onClick={() => setIsSaveModalOpen(true)}
  className="nodrag nopan w-full px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-neutral-200 text-xs font-medium rounded border border-neutral-600 transition-colors flex items-center justify-center gap-2"
>
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
  Save as Template
</button>

{/* Modals */}
<TemplateSaveModal 
  isOpen={isSaveModalOpen} 
  onClose={() => setIsSaveModalOpen(false)} 
  subflowId={node.id} 
  initialName={nodeData.name || "My Subflow"}
  previewImage={nodeData.previewMedia} // Ensure this is available in node data or fetched
/>
<TemplateBrowserModal 
  isOpen={isBrowserModalOpen} 
  onClose={() => setIsBrowserModalOpen(false)} 
  subflowId={node.id} 
/>
```

- [ ] **Step 2: Update SubFlowNode to pass previewMedia**
Modify `src/components/nodes/SubFlowNode.tsx` to ensure `previewMedia` is updated in `node.data` so the control panel can access it.

```typescript
// Inside SubFlowNode, update node data when previewMedia changes
useEffect(() => {
  if (previewMedia && previewMedia !== data.previewMedia) {
    updateNodeData(id, { previewMedia });
  }
}, [previewMedia, id, data.previewMedia, updateNodeData]);
```

- [ ] **Step 3: Final Commit & Cleanup**
```bash
git add src/components/nodes/ControlPanel.tsx src/components/nodes/SubFlowNode.tsx
git commit -m "feat: integrate subflow template modals into ControlPanel"
```
