# Design Spec: Subflow Template Management

## 1. Overview
This feature enables users to save Subflows as reusable templates stored on the server. Templates support metadata (name, description), versioning (auto-versioning on save), and visual browsing via a dedicated dialog with preview snapshots.

## 2. Requirements
- **Save as Template:**
  - Metadata dialog to refine template name and description.
  - Automatic snapshot capture of the subflow's visual output.
  - Automatic versioning (v1, v2, etc.) with timestamps.
- **Browse Templates:**
  - Popup dialog showing a list of saved templates.
  - Each template card displays name, description, and preview image.
- **Storage Structure:**
  - Templates are stored in a `subflow_templates/` directory at the project root.
  - Each template has its own folder containing a `metadata.json` index and versioned JSON workflow files.

## 3. Architecture & Data Flow

### 3.1 Storage Schema
```
subflow_templates/
└── [template_name]/
    ├── metadata.json          # Index file for the template
    ├── preview.png            # Visual snapshot
    ├── v1_20240426_1200.json  # Version 1
    └── v2_20240427_0900.json  # Version 2 (latest)
```

### 3.2 Metadata Schema (`metadata.json`)
```typescript
{
  "name": string,              // Display name
  "description": string,       // User-provided description
  "currentVersion": number,    // Latest version number
  "previewPath": string,       // Path to the snapshot
  "versions": {                // Version map
    [versionNumber: string]: {
      "path": string,          // File path relative to template folder
      "timestamp": string      // ISO timestamp
    }
  },
  "lastModified": string       // ISO timestamp
}
```

### 3.3 Components
- **`TemplateSaveModal`**: Metadata input dialog with preview confirmation.
- **`TemplateBrowserModal`**: Grid-based browser with search/filter.
- **`SubFlowControls`**: Updated with "Save as Template" and "Browse Templates" buttons.

### 3.4 API Endpoints
- `POST /api/subflow-templates/save`: Creates directory, saves JSON version, saves PNG preview, and updates/creates `metadata.json`.
- `GET /api/subflow-templates/list`: Scans `subflow_templates/` and returns an array of `metadata.json` objects.
- `GET /api/subflow-templates/load`: Returns the JSON content of a specific version of a template.

## 4. Implementation Details

### 4.1 Snapshot Capture
The Subflow node surface already has a preview area. When saving as a template, the `SubFlowNode` component will extract the current `previewMedia` (if it's a data URL) and send it to the server. If no preview is available, a generic placeholder will be used.

### 4.2 Versioning Logic
On save, the server checks if the template name already exists:
1. If **No**: Create folder, set `currentVersion = 1`.
2. If **Yes**: Read `metadata.json`, increment `currentVersion`, add new entry to `versions` map.

### 4.3 Integration in Workflow Store
Add new actions:
- `saveSubFlowAsTemplate(subflowId, metadata)`
- `loadSubFlowTemplate(subflowId, templateName, version?)`

## 5. UI Details
- **Template Card**: 
  - Top: Preview Image (aspect-ratio: 4/3 or 1/1).
  - Bottom: Name (bold) and Description (truncate to 2 lines).
  - Action: "Apply Template" button.
