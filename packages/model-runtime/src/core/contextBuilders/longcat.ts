import type { OpenAIChatMessage } from '../../types';

/**
 * Transform generic OpenAI format to LongCat specific format
 * LongCat requires nested object structure for images/videos:
 * - image_url: { url: string } -> input_image: { data: string, type: 'url' | 'base64' }
 * - video_url: { url: string } -> input_video: { data: string, type: 'url' | 'base64' }
 */
export const transformLongCatMessage = (
  content: string | OpenAIChatMessage['content'],
): OpenAIChatMessage['content'] => {
  if (typeof content === 'string') {
    return content;
  }

  return content.map((part) => {
    if (part.type === 'image_url') {
      const url = part.image_url.url;
      const isBase64 = url.startsWith('data:');

      return {
        input_image: {
          data: url,
          type: isBase64 ? 'base64' : 'url',
        },
        type: 'input_image',
      } as any;
    }

    if (part.type === 'video_url') {
      const url = (part as any).video_url?.url;
      const isBase64 = url?.startsWith('data:');

      return {
        input_video: {
          data: url,
          type: isBase64 ? 'base64' : 'url',
        },
        type: 'input_video',
      } as any;
    }

    return part;
  });
};
