"use client";

import React, { useEffect, useState } from "react";
import { useWorkflowStore } from "@/store/workflowStore";
import { TemplateMetadata } from "@/types/subflowTemplates";

interface TemplateBrowserModalProps {
  isOpen: boolean;
  onClose: () => void;
  subflowId: string;
}

/**
 * Modal dialog for browsing and loading subflow templates.
 * Fetches the list of available templates from the server and allows the user to apply one to a subflow node.
 */
export function TemplateBrowserModal({
  isOpen,
  onClose,
  subflowId,
}: TemplateBrowserModalProps) {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingTemplate, setIsLoadingTemplate] = useState(false);
  const [versionSelectionFor, setVersionSelectionFor] = useState<TemplateMetadata | null>(null);
  const loadSubFlowTemplate = useWorkflowStore((state) => state.loadSubFlowTemplate);

  useEffect(() => {
    if (isOpen) {
      setIsLoading(true);
      fetch("/api/subflow-templates/list")
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setTemplates(data.templates);
          }
        })
        .catch((err) => {
          console.error("Failed to fetch templates:", err);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoadingTemplate) {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, isLoadingTemplate]);

  if (!isOpen) return null;

  const handleLoadVersion = async (name: string, version: string) => {
    setIsLoadingTemplate(true);
    try {
      const success = await loadSubFlowTemplate(
        subflowId,
        name,
        parseInt(version, 10)
      );
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

  const handleTemplateClick = (tpl: TemplateMetadata) => {
    if (isLoadingTemplate) return;

    const versionKeys = Object.keys(tpl.versions || {});
    if (versionKeys.length > 1) {
      setVersionSelectionFor(tpl);
    } else {
      handleLoadVersion(tpl.name, tpl.currentVersion.toString());
    }
  };

  return (
    <div
      className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isLoadingTemplate) onClose();
      }}
    >
      <div className="w-full max-w-4xl max-h-[85vh] mx-4 bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-2xl flex flex-col relative">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Browse Subflow Templates</h2>
          <button
            onClick={onClose}
            disabled={isLoadingTemplate}
            className="text-neutral-500 hover:text-white transition-colors p-1"
            aria-label="Close"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Version Selection Overlay */}
        {versionSelectionFor && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-neutral-900/80 backdrop-blur-sm rounded-xl">
            <div className="w-full max-w-sm bg-neutral-800 border border-neutral-700 rounded-xl p-6 shadow-2xl mx-4">
              <h3 className="text-lg font-bold text-white mb-2">
                Select Version
              </h3>
              <p className="text-xs text-neutral-400 mb-4">
                Choose a version of <strong>{versionSelectionFor.name}</strong>{" "}
                to load.
              </p>

              <div className="max-h-[40vh] overflow-y-auto custom-scrollbar space-y-2 pr-2">
                {Object.entries(versionSelectionFor.versions || {})
                  .sort(([a], [b]) => Number(b) - Number(a)) // Descending
                  .map(([v, info]) => (
                    <button
                      key={v}
                      onClick={() =>
                        handleLoadVersion(versionSelectionFor.name, v)
                      }
                      disabled={isLoadingTemplate}
                      className="w-full flex items-center justify-between p-3 bg-neutral-900 border border-neutral-700 hover:border-blue-500 rounded-lg transition-colors group text-left disabled:opacity-50"
                    >
                      <div>
                        <div className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                          Version {v}{" "}
                          {Number(v) === versionSelectionFor.currentVersion &&
                            "(Latest)"}
                        </div>
                        <div className="text-[10px] text-neutral-500 mt-1">
                          {new Date(info.timestamp).toLocaleString()}
                        </div>
                      </div>
                      <svg
                        className="w-4 h-4 text-neutral-600 group-hover:text-blue-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
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

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar min-h-[300px]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="w-10 h-10 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-neutral-400 text-sm animate-pulse">Loading templates...</p>
            </div>
          ) : templates.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 bg-neutral-800 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-white font-medium mb-1">No templates found</h3>
              <p className="text-neutral-500 text-sm max-w-xs">
                Save your subflows as templates to see them here and reuse them across your project.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-4">
              {templates.map((tpl) => (
                <div
                  key={tpl.name}
                  onClick={() => !isLoadingTemplate && handleTemplateClick(tpl)}
                  className={`group bg-neutral-800 border border-neutral-700 rounded-lg overflow-hidden cursor-pointer hover:border-blue-500 transition-all shadow-lg hover:shadow-blue-900/10 ${
                    isLoadingTemplate ? "opacity-50 pointer-events-none" : ""
                  }`}
                >
                  <div className="aspect-video bg-black relative overflow-hidden">
                    {tpl.previewData ? (
                      <img
                        src={tpl.previewData}
                        className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-105 transition-all duration-300"
                        alt={tpl.name}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-700 bg-neutral-900/50">
                        <svg className="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />
                    
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-blue-600/10 backdrop-blur-[2px]">
                      <div className="bg-blue-600 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-xl transform translate-y-2 group-hover:translate-y-0 transition-transform">
                        Load Template
                      </div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <h3 className="text-sm font-bold text-white truncate flex-1" title={tpl.name}>
                        {tpl.name}
                      </h3>
                      <span className="text-[10px] bg-neutral-700 text-neutral-300 px-1.5 py-0.5 rounded font-mono uppercase tracking-wider">
                        v{tpl.currentVersion}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-500 line-clamp-2 h-8">
                      {tpl.description || "No description provided."}
                    </p>
                    <div className="mt-3 pt-3 border-t border-neutral-700/50 flex justify-between items-center">
                      <div className="text-[10px] text-neutral-600 font-mono">
                        {new Date(tpl.lastModified).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </div>
                      <div className="flex gap-1">
                        {/* Placeholder for potential actions like delete/rename in future */}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {isLoadingTemplate && (
          <div className="mt-4 flex items-center justify-center gap-2 text-blue-400 text-xs font-medium animate-pulse">
            <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" />
            Applying template to subflow...
          </div>
        )}
      </div>
    </div>
  );
}
