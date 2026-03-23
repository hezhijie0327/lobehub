// Keling API Types

export enum KelingTaskStatus {
  Failed = 'failed',
  Processing = 'processing',
  Submitted = 'submitted',
  Succeed = 'succeed',
}

export interface KelingBaseResponse {
  code: number;
  message: string;
  request_id: string;
}

export interface KelingTaskInfo {
  external_task_id?: string;
}

export interface KelingImageResult {
  index: number;
  url: string;
  watermark_url: string;
}

export interface KelingTaskResult {
  images?: KelingImageResult[];
  result_type?: 'single' | 'series';
  series_images?: KelingImageResult[];
}

export interface KelingWatermarkInfo {
  enabled: boolean;
}

// Task submission response
export interface KelingSubmitResponse extends KelingBaseResponse {
  data: {
    task_id: string;
    task_info?: KelingTaskInfo;
    task_status: KelingTaskStatus;
    created_at: number;
    updated_at: number;
  };
}

// Task query response
export interface KelingQueryResponse extends KelingBaseResponse {
  data: {
    task_id: string;
    task_status: KelingTaskStatus;
    task_status_msg?: string;
    task_info?: KelingTaskInfo;
    task_result?: KelingTaskResult;
    watermark_info?: KelingWatermarkInfo;
    final_unit_deduction?: string;
    created_at: number;
    updated_at: number;
  };
}

// Model IDs
export type KelingModelId = 'kling-image-o1' | 'kling-v2-1';

// API endpoints
export const KELING_ENDPOINTS = {
  'kling-image-o1': '/v1/images/omni-image',
  'kling-v2-1': '/v1/images/generations',
} as const;

// Request types for different endpoints
export interface KelingOmniImageRequest {
  aspect_ratio?: string;
  element_list?: Array<{ element_id: number }>;
  image_list?: Array<{ image: string }>;
  model_name: 'kling-image-o1';
  n?: number;
  prompt: string;
  resolution?: '2k' | '1k';
}

export interface KelingGenerationsRequest {
  callback_url?: string;
  external_task_id?: string;
  image?: string;
  model_name: 'kling-v2-1';
  n?: number;
  negative_prompt?: string;
  prompt: string;
}

export interface KelingMultiImage2ImageRequest {
  aspect_ratio?: string;
  model_name: 'kling-v2-1';
  n?: number;
  negative_prompt?: string;
  prompt: string;
  scene_image?: string;
  style_image?: string;
  subject_image_list?: Array<{ subject_image: string }>;
}

// Union type for all request types
export type KelingRequest =
  | KelingOmniImageRequest
  | KelingGenerationsRequest
  | KelingMultiImage2ImageRequest;

// Multi-image2image endpoint (special case, uses kling-v2-1 but different endpoint)
export const KELING_MULTI_IMAGE_ENDPOINT = '/v1/images/multi-image2image';
