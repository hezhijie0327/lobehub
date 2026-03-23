import type { ModelParamsSchema } from '../standard-parameters';
import { PRESET_ASPECT_RATIOS } from '../standard-parameters';
import type { VideoModelParamsSchema } from '../standard-parameters/video';
import { PRESET_VIDEO_ASPECT_RATIOS } from '../standard-parameters/video';
import type { AIImageModelCard, AIVideoModelCard } from '../types';

const kelingImageParamsSchema: ModelParamsSchema = {
  aspectRatio: {
    default: '1:1',
    enum: PRESET_ASPECT_RATIOS,
  },
  imageUrls: {
    default: [],
    maxCount: 4,
  },
  prompt: { default: '' },
  resolution: {
    default: '2k',
    enum: ['1k', '2k'],
  },
  seed: { default: null },
};

const kelingV21ParamsSchema: ModelParamsSchema = {
  aspectRatio: {
    default: '1:1',
    enum: PRESET_ASPECT_RATIOS,
  },
  imageUrl: { default: null },
  imageUrls: {
    default: [],
    maxCount: 4,
  },
  prompt: { default: '' },
  seed: { default: null },
};

const imageModels: AIImageModelCard[] = [
  {
    description:
      'Advanced multi-image fusion and generation model for complex visual compositions.',
    displayName: 'Keling Image O1',
    enabled: true,
    id: 'kling-image-o1',
    parameters: kelingImageParamsSchema,
    type: 'image',
  },
  {
    description:
      'Versatile image generation and editing model supporting text-to-image and image-to-image.',
    displayName: 'Keling V2.1',
    enabled: true,
    id: 'kling-v2-1',
    parameters: kelingV21ParamsSchema,
    type: 'image',
  },
];

const klingVideoV26ParamsSchema: VideoModelParamsSchema = {
  aspectRatio: {
    default: '16:9',
    enum: PRESET_VIDEO_ASPECT_RATIOS,
  },
  duration: {
    default: 5,
    max: 10,
    min: 3,
    step: 1,
  },
  endImageUrl: {
    default: null,
    requiresImageUrl: true,
  },
  imageUrl: {
    default: null,
  },
  prompt: {
    default: '',
  },
};

const klingVideoO1ParamsSchema: VideoModelParamsSchema = {
  aspectRatio: {
    default: '16:9',
    enum: PRESET_VIDEO_ASPECT_RATIOS,
  },
  duration: {
    default: 5,
    max: 10,
    min: 3,
    step: 1,
  },
  endImageUrl: {
    default: null,
  },
  imageUrl: {
    default: null,
  },
  prompt: {
    default: '',
  },
};

const klingV3OmniParamsSchema: VideoModelParamsSchema = {
  aspectRatio: {
    default: '16:9',
    enum: PRESET_VIDEO_ASPECT_RATIOS,
  },
  duration: {
    default: 5,
    max: 15,
    min: 3,
    step: 1,
  },
  endImageUrl: {
    default: null,
  },
  imageUrl: {
    default: null,
  },
  prompt: {
    default: '',
  },
};

const videoModels: AIVideoModelCard[] = [
  {
    description:
      'Advanced video generation model supporting text-to-video, image-to-video, and first-last frame generation. Supports sound control.',
    displayName: 'Keling V2.6',
    enabled: true,
    id: 'kling-v2-6',
    parameters: klingVideoV26ParamsSchema,
    type: 'video',
  },
  {
    description:
      'Professional video generation model supporting text-to-video and image-to-video. Standard and Pro modes with 3-10s duration.',
    displayName: 'Keling Video O1',
    enabled: true,
    id: 'kling-video-o1',
    parameters: klingVideoO1ParamsSchema,
    type: 'video',
  },
  {
    description:
      'Advanced omni video generation model with multi-shot support. Standard and Pro modes with 3-15s duration.',
    displayName: 'Keling V3 Omni',
    enabled: true,
    id: 'kling-v3-omni',
    parameters: klingV3OmniParamsSchema,
    type: 'video',
  },
  {
    description:
      'Multi-image video generation model. Supports subject control with multiple reference images.',
    displayName: 'Keling V1.6',
    enabled: true,
    id: 'kling-v1-6',
    parameters: klingVideoV26ParamsSchema,
    type: 'video',
  },
];

export const allModels = [...imageModels, ...videoModels];

export default allModels;
