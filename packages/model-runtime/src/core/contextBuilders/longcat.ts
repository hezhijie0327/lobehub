import type { OpenAIChatMessage } from '../../types';

/**
 * Transform generic OpenAI format to LongCat Omni specific format
 * LongCat Omni models require:
 * 1. All content must be array format: [{type: "text", text: "..."}]
 * 2. image_url: { url: string } -> input_image: { data: string[], type: 'url' | 'base64' }
 * 3. video_url: { url: string } -> input_video: { data: string, type: 'url' | 'base64' }
 *
 * Note: Only image data is an array, video data is a single string
 */
export const transformLongCatMessage = (
  content: string | OpenAIChatMessage['content'],
): OpenAIChatMessage['content'] => {
  // Convert string content to text array format
  if (typeof content === 'string') {
    return [{ type: 'text', text: content }];
  }

  return content.map((part) => {
    if (part.type === 'image_url') {
      const url = part.image_url.url;
      const isBase64 = url.startsWith('data:');

      return {
        input_image: {
          data: [url],
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

    // Preserve text and other content types as is
    return part;
  });
};
