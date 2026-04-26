# Subflow Template Management Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Enhance the Subflow Template Management feature by adding version selection when loading templates and overwrite confirmation when saving new versions of existing templates.

**Architecture:** Modify the existing `TemplateSaveModal` to fetch available templates and prompt for confirmation before incrementing a version. Modify `TemplateBrowserModal` to show a secondary overlay for version selection when a template has multiple versions.

**Tech Stack:** React, Tailwind CSS, Zustand.

---

### Task 1: Save Confirmation Dialog

**Files:**
- Modify: `src/components/modals/TemplateSaveModal.tsx`

- [ ] **Step 1: Fetch existing templates**
Add state to fetch and store existing templates when the modal opens so we can check for name collisions.

```typescript
const [existingTemplates, setExistingTemplates] = useState<TemplateMetadata[]>([]);
const [confirmingSave, setConfirmingSave] = useState<TemplateMetadata | null>(null);

useEffect(() => {
  if (isOpen) {
    setName(initialName);
    setDescription("");
    setConfirmingSave(null);
    fetch("/api/subflow-templates/list")
      .then(res => res.json())
      .then(data => {
        if (data.success) setExistingTemplates(data.templates);
      })
      .catch(console.error);
  }
}, [isOpen, initialName]);
```

- [ ] **Step 2: Add confirmation logic to handleSave**
Modify `handleSave` to check for collisions before calling the store action.

```typescript
const handleSave = async () => {
  if (!confirmingSave) {
    const existing = existingTemplates.find(t => t.name.toLowerCase() === name.toLowerCase());
    if (existing) {
      setConfirmingSave(existing);
      return; // Pause and wait for confirmation
    }
  }
  
  // ... proceed with actual save logic ...
}
```

- [ ] **Step 3: Render confirmation UI**
Add a conditional render inside the modal to show the confirmation prompt if `confirmingSave` is not null.

```tsx
{confirmingSave ? (
  <div className="space-y-4">
    <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
      <h3 className="text-sm font-bold text-yellow-500 mb-2">Template Already Exists</h3>
      <p className="text-xs text-neutral-300">
        A template named <strong>"{name}"</strong> already exists at version {confirmingSave.currentVersion}. 
        Do you want to save this as <strong>Version {confirmingSave.currentVersion + 1}</strong>?
      </p>
    </div>
    <div className="mt-6 flex gap-3 justify-end">
      <button
        onClick={() => setConfirmingSave(null)}
        disabled={isSaving}
        className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
      >
        Back
      </button>
      <button
        onClick={handleSave}
        disabled={isSaving}
        className="px-6 py-2 bg-yellow-600 hover:bg-yellow-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
      >
        {isSaving ? "Saving..." : "Save New Version"}
      </button>
    </div>
  </div>
) : (
  // ... existing form and buttons ...
)}
```

- [ ] **Step 4: Commit Save Confirmation**
```bash
git add src/components/modals/TemplateSaveModal.tsx
git commit -m "feat: add version increment confirmation to save modal"
```

---

### Task 2: Load Version Selection Overlay

**Files:**
- Modify: `src/components/modals/TemplateBrowserModal.tsx`

- [ ] **Step 1: Add state for version selection**
Add state to track which template's versions are currently being viewed.

```typescript
const [versionSelectionFor, setVersionSelectionFor] = useState<TemplateMetadata | null>(null);
```

- [ ] **Step 2: Modify handleSelect logic**
Change `handleSelect` to intercept templates with multiple versions.

```typescript
const handleTemplateClick = (tpl: TemplateMetadata) => {
  if (isLoadingTemplate) return;
  
  const versionKeys = Object.keys(tpl.versions || {});
  if (versionKeys.length > 1) {
    setVersionSelectionFor(tpl);
  } else {
    handleLoadVersion(tpl.name, tpl.currentVersion.toString());
  }
};

const handleLoadVersion = async (name: string, version: string) => {
  setIsLoadingTemplate(true);
  try {
    const success = await loadSubFlowTemplate(subflowId, name, parseInt(version, 10));
    if (success) {
      setVersionSelectionFor(null);
      onClose();
    }
  } catch (error) {
    console.error("Error loading template:", error);
  } finally {
    setIsLoadingTemplate(false);
  }
};
```

- [ ] **Step 3: Render the version selection overlay**
Render a secondary overlay over the grid when `versionSelectionFor` is not null.

```tsx
{/* Version Selection Overlay */}
{versionSelectionFor && (
  <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm rounded-xl">
    <div className="w-full max-w-sm bg-neutral-800 border border-neutral-700 rounded-xl p-6 shadow-2xl mx-4">
      <h3 className="text-lg font-bold text-white mb-2">Select Version</h3>
      <p className="text-xs text-neutral-400 mb-4">Choose a version of <strong>{versionSelectionFor.name}</strong> to load.</p>
      
      <div className="max-h-[40vh] overflow-y-auto custom-scrollbar space-y-2 pr-2">
        {Object.entries(versionSelectionFor.versions || {})
          .sort(([a], [b]) => Number(b) - Number(a)) // Descending
          .map(([v, info]) => (
            <button
              key={v}
              onClick={() => handleLoadVersion(versionSelectionFor.name, v)}
              disabled={isLoadingTemplate}
              className="w-full flex items-center justify-between p-3 bg-neutral-900 border border-neutral-700 hover:border-blue-500 rounded-lg transition-colors group text-left disabled:opacity-50"
            >
              <div>
                <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                  Version {v} {Number(v) === versionSelectionFor.currentVersion && "(Latest)"}
                </div>
                <div className="text-[10px] text-neutral-500 mt-1">
                  {new Date(info.timestamp).toLocaleString()}
                </div>
              </div>
              <svg className="w-4 h-4 text-neutral-600 group-hover:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          ))}
      </div>
      
      <div className="mt-4 flex justify-end">
        <button
          onClick={() => setVersionSelectionFor(null)}
          disabled={isLoadingTemplate}
          className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
        >
          Cancel
        </button>
      </div>
    </div>
  </div>
)}
```

- [ ] **Step 4: Commit Load Version Selection**
```bash
git add src/components/modals/TemplateBrowserModal.tsx
git commit -m "feat: add version selection overlay to template browser"
```