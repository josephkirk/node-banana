import { NodeTypes, EdgeTypes } from "@xyflow/react";
import dynamic from "next/dynamic";
import {
  ImageInputNode,
  AudioInputNode,
  VideoInputNode,
  AnnotationNode,
  PromptNode,
  ArrayNode,
  PromptConstructorNode,
  GenerateImageNode,
  GenerateVideoNode,
  Generate3DNode,
  GenerateAudioNode,
  LLMGenerateNode,
  SplitGridNode,
  OutputNode,
  OutputGalleryNode,
  ImageCompareNode,
  VideoStitchNode,
  EaseCurveNode,
  VideoTrimNode,
  VideoFrameGrabNode,
  RouterNode,
  SwitchNode,
  ConditionalSwitchNode,
  CropNode,
  SubFlowNode,
  FloatInputNode,
  GroupNode,
} from "./nodes";

import { EditableEdge, ReferenceEdge } from "./edges";

// Lazy-load GLBViewerNode to avoid bundling three.js for users who don't use 3D nodes
const GLBViewerNode = dynamic(() => import("./nodes/GLBViewerNode").then(mod => ({ default: mod.GLBViewerNode })), { ssr: false });

export const nodeTypes: NodeTypes = {
  imageInput: ImageInputNode,
  audioInput: AudioInputNode,
  videoInput: VideoInputNode,
  annotation: AnnotationNode,
  prompt: PromptNode,
  array: ArrayNode,
  promptConstructor: PromptConstructorNode,
  nanoBanana: GenerateImageNode,
  generateVideo: GenerateVideoNode,
  generate3d: Generate3DNode,
  generateAudio: GenerateAudioNode,
  llmGenerate: LLMGenerateNode,
  splitGrid: SplitGridNode,
  output: OutputNode,
  outputGallery: OutputGalleryNode,
  imageCompare: ImageCompareNode,
  videoStitch: VideoStitchNode,
  easeCurve: EaseCurveNode,
  videoTrim: VideoTrimNode,
  videoFrameGrab: VideoFrameGrabNode,
  router: RouterNode,
  switch: SwitchNode,
  conditionalSwitch: ConditionalSwitchNode,
  crop: CropNode,
  subflow: SubFlowNode,
  floatInput: FloatInputNode,
  glbViewer: GLBViewerNode,
  group: GroupNode,
};

export const edgeTypes: EdgeTypes = {
  editable: EditableEdge,
  reference: ReferenceEdge,
};
