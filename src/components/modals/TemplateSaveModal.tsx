"use client";

import React, { useState, useEffect } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { SubFlowNodeData } from "@/types";
import { TemplateMetadata } from "@/types/subflowTemplates";

interface TemplateSaveModalProps {
  isOpen: boolean;
  onClose: () => void;
  subflowId: string;
  initialName: string;
  previewImage?: string;
}

/**
 * Modal dialog for saving a subflow as a template.
 * Allows users to refine the template name and description before saving.
 */
export function TemplateSaveModal({
  isOpen,
  onClose,
  subflowId,
  initialName,
  previewImage,
}: TemplateSaveModalProps) {
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [existingTemplates, setExistingTemplates] = useState<TemplateMetadata[]>([]);
  const [confirmingSave, setConfirmingSave] = useState<TemplateMetadata | null>(null);

  const saveSubFlowAsTemplate = useWorkflowStore((state) => state.saveSubFlowAsTemplate);
  const nodes = useWorkflowStore((state) => state.nodes);

  // Reset state and fetch existing templates when modal opens
  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setDescription("");
      setConfirmingSave(null);
      
      fetch("/api/subflow-templates/list")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setExistingTemplates(data.templates);
          }
        })
        .catch(console.error);
    }
  }, [isOpen, initialName]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isSaving) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isSaving]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!confirmingSave) {
      const existing = existingTemplates.find(t => t.name.toLowerCase() === name.toLowerCase());
      if (existing) {
        setConfirmingSave(existing);
        return; // Pause and wait for confirmation
      }
    }

    const node = nodes.find((n) => n.id === subflowId);
    if (!node || node.type !== "subflow") {
      console.error("Subflow node not found or invalid type");
      return;
    }

    const nodeData = node.data as SubFlowNodeData;
    if (!nodeData.subgraph) {
      console.error("Subflow subgraph not found");
      return;
    }

    setIsSaving(true);
    try {
      const success = await saveSubFlowAsTemplate({
        subflowId,
        templateName: name,
        description,
        workflow: nodeData.subgraph,
        previewImage,
      });

      if (success) {
        onClose();
      }
    } catch (error) {
      console.error("Error saving template:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isSaving) onClose();
      }}
    >
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl mx-4">
        <h2 className="text-xl font-bold text-white mb-4">Save Subflow Template</h2>

        {previewImage && !confirmingSave && (
          <div className="w-full aspect-video bg-black rounded-lg mb-4 overflow-hidden border border-neutral-800">
            <img
              src={previewImage}
              className="w-full h-full object-cover"
              alt="Subflow Preview"
            />
          </div>
        )}

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
          <>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">
                  Template Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter template name..."
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                  autoFocus
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-neutral-500 uppercase mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="What does this subflow do?"
                  rows={3}
                  className="w-full bg-neutral-800 border border-neutral-700 rounded p-2 text-sm text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none transition-all"
                  disabled={isSaving}
                />
              </div>
            </div>

            <div className="mt-6 flex gap-3 justify-end">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm text-neutral-400 hover:text-white transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving || !name.trim()}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all flex items-center gap-2"
              >
                {isSaving && (
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                )}
                {isSaving ? "Saving..." : "Save Template"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
