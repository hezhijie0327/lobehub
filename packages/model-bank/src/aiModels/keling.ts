import type { ModelParamsSchema } from '../standard-parameters';
import { PRESET_ASPECT_RATIOS } from '../standard-parameters';
import type { AIImageModelCard } from '../types';

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

export const allModels = [...imageModels];

export default allModels;
