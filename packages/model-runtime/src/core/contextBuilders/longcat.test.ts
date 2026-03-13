import { describe, expect, it } from 'vitest';

import type { OpenAIChatMessage } from '../../types';
import { transformLongCatMessage } from './longcat';

describe('transformLongCatMessage', () => {
  describe('string content', () => {
    it('should return string content unchanged', () => {
      const content = 'Hello, world!';
      const result = transformLongCatMessage(content);
      expect(result).toBe('Hello, world!');
    });

    it('should return empty string unchanged', () => {
      const content = '';
      const result = transformLongCatMessage(content);
      expect(result).toBe('');
    });
  });

  describe('array content', () => {
    it('should return text content unchanged', () => {
      const content = [
        { type: 'text', text: 'Hello' },
        { type: 'text', text: 'World' },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        { type: 'text', text: 'Hello' },
        { type: 'text', text: 'World' },
      ]);
    });

    it('should transform image_url with URL to input_image format', () => {
      const content = [
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image.jpg' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_image',
          input_image: {
            data: 'https://example.com/image.jpg',
            type: 'url',
          },
        },
      ]);
    });

    it('should transform image_url with base64 to input_image format', () => {
      const content = [
        {
          type: 'image_url',
          image_url: { url: 'data:image/jpeg;base64,abc123' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_image',
          input_image: {
            data: 'data:image/jpeg;base64,abc123',
            type: 'base64',
          },
        },
      ]);
    });

    it('should transform image_url with PNG base64 to input_image format', () => {
      const content = [
        {
          type: 'image_url',
          image_url: { url: 'data:image/png;base64,xyz789' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_image',
          input_image: {
            data: 'data:image/png;base64,xyz789',
            type: 'base64',
          },
        },
      ]);
    });

    it('should transform video_url with URL to input_video format', () => {
      const content = [
        {
          type: 'video_url',
          video_url: { url: 'https://example.com/video.mp4' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_video',
          input_video: {
            data: 'https://example.com/video.mp4',
            type: 'url',
          },
        },
      ]);
    });

    it('should transform video_url with base64 to input_video format', () => {
      const content = [
        {
          type: 'video_url',
          video_url: { url: 'data:video/mp4;base64,video123' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_video',
          input_video: {
            data: 'data:video/mp4;base64,video123',
            type: 'base64',
          },
        },
      ]);
    });

    it('should transform video_url with MOV format to input_video format', () => {
      const content = [
        {
          type: 'video_url',
          video_url: { url: 'data:video/quicktime;base64,mov123' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_video',
          input_video: {
            data: 'data:video/quicktime;base64,mov123',
            type: 'base64',
          },
        },
      ]);
    });

    it('should handle mixed content with text, image, and video', () => {
      const content = [
        { type: 'text', text: 'Check out this image and video' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image.png' },
        },
        {
          type: 'video_url',
          video_url: { url: 'https://example.com/video.mp4' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        { type: 'text', text: 'Check out this image and video' },
        {
          type: 'input_image',
          input_image: {
            data: 'https://example.com/image.png',
            type: 'url',
          },
        },
        {
          type: 'input_video',
          input_video: {
            data: 'https://example.com/video.mp4',
            type: 'url',
          },
        },
      ]);
    });

    it('should handle multiple images in sequence', () => {
      const content = [
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image1.jpg' },
        },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/image2.jpg' },
        },
        {
          type: 'image_url',
          image_url: { url: 'data:image/jpeg;base64,base64img' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_image',
          input_image: {
            data: 'https://example.com/image1.jpg',
            type: 'url',
          },
        },
        {
          type: 'input_image',
          input_image: {
            data: 'https://example.com/image2.jpg',
            type: 'url',
          },
        },
        {
          type: 'input_image',
          input_image: {
            data: 'data:image/jpeg;base64,base64img',
            type: 'base64',
          },
        },
      ]);
    });

    it('should handle multiple videos in sequence', () => {
      const content = [
        {
          type: 'video_url',
          video_url: { url: 'https://example.com/video1.mp4' },
        },
        {
          type: 'video_url',
          video_url: { url: 'data:video/mp4;base64,video1' },
        },
        {
          type: 'video_url',
          video_url: { url: 'https://example.com/video2.avi' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_video',
          input_video: {
            data: 'https://example.com/video1.mp4',
            type: 'url',
          },
        },
        {
          type: 'input_video',
          input_video: {
            data: 'data:video/mp4;base64,video1',
            type: 'base64',
          },
        },
        {
          type: 'input_video',
          input_video: {
            data: 'https://example.com/video2.avi',
            type: 'url',
          },
        },
      ]);
    });

    it('should handle empty array content', () => {
      const content: any[] = [];
      const result = transformLongCatMessage(content);
      expect(result).toEqual([]);
    });

    it('should preserve unknown content types', () => {
      const content = [
        { type: 'text', text: 'Hello' },
        { type: 'unknown_type', data: 'something' },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        { type: 'text', text: 'Hello' },
        { type: 'unknown_type', data: 'something' },
      ]);
    });

    it('should handle thinking content type (for Claude compatibility)', () => {
      const content = [
        { type: 'thinking', thinking: 'Let me think...', signature: 'sig123' },
        { type: 'text', text: 'Response' },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        { type: 'thinking', thinking: 'Let me think...', signature: 'sig123' },
        { type: 'text', text: 'Response' },
      ]);
    });
  });

  describe('integration scenarios', () => {
    it('should handle typical user message with image attachment', () => {
      const content: OpenAIChatMessage['content'] = [
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/photo.jpeg' },
        },
      ];
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        { type: 'text', text: 'What is in this image?' },
        {
          type: 'input_image',
          input_image: {
            data: 'https://example.com/photo.jpeg',
            type: 'url',
          },
        },
      ]);
    });

    it('should handle typical user message with video attachment', () => {
      const content: OpenAIChatMessage['content'] = [
        { type: 'text', text: 'Analyze this video' },
        {
          type: 'video_url',
          video_url: { url: 'data:video/mp4;base64,videodata' },
        },
      ];
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        { type: 'text', text: 'Analyze this video' },
        {
          type: 'input_video',
          input_video: {
            data: 'data:video/mp4;base64,videodata',
            type: 'base64',
          },
        },
      ]);
    });

    it('should handle multimodal message with image and video', () => {
      const content: OpenAIChatMessage['content'] = [
        { type: 'text', text: 'Compare these' },
        {
          type: 'image_url',
          image_url: { url: 'data:image/png;base64,img123' },
        },
        {
          type: 'video_url',
          video_url: { url: 'https://example.com/clip.mov' },
        },
      ];
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        { type: 'text', text: 'Compare these' },
        {
          type: 'input_image',
          input_image: {
            data: 'data:image/png;base64,img123',
            type: 'base64',
          },
        },
        {
          type: 'input_video',
          input_video: {
            data: 'https://example.com/clip.mov',
            type: 'url',
          },
        },
      ]);
    });

    it('should handle complex conversation with multiple modalities', () => {
      const content: OpenAIChatMessage['content'] = [
        { type: 'text', text: 'First, look at this image:' },
        {
          type: 'image_url',
          image_url: { url: 'https://cdn.example.com/img1.jpg' },
        },
        { type: 'text', text: 'Now watch this video:' },
        {
          type: 'video_url',
          video_url: { url: 'https://cdn.example.com/vid1.mp4' },
        },
        { type: 'text', text: 'And this base64 image:' },
        {
          type: 'image_url',
          image_url: { url: 'data:image/webp;base64,webpdata' },
        },
        { type: 'text', text: 'What do you think?' },
      ];
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        { type: 'text', text: 'First, look at this image:' },
        {
          type: 'input_image',
          input_image: {
            data: 'https://cdn.example.com/img1.jpg',
            type: 'url',
          },
        },
        { type: 'text', text: 'Now watch this video:' },
        {
          type: 'input_video',
          input_video: {
            data: 'https://cdn.example.com/vid1.mp4',
            type: 'url',
          },
        },
        { type: 'text', text: 'And this base64 image:' },
        {
          type: 'input_image',
          input_image: {
            data: 'data:image/webp;base64,webpdata',
            type: 'base64',
          },
        },
        { type: 'text', text: 'What do you think?' },
      ]);
    });
  });

  describe('edge cases', () => {
    it('should handle image_url with undefined video_url field', () => {
      const content = [
        {
          type: 'image_url',
          image_url: { url: 'https://example.com/test.png' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result[0]).toHaveProperty('type', 'input_image');
      expect(result[0]).toHaveProperty('input_image');
      expect((result[0] as any).input_image.type).toBe('url');
    });

    it('should handle video_url with missing url gracefully', () => {
      const content = [
        {
          type: 'video_url',
          video_url: {} as any,
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_video',
          input_video: {
            data: undefined,
            type: 'url',
          },
        },
      ]);
    });

    it('should handle data URLs without explicit media type', () => {
      const content = [
        {
          type: 'image_url',
          image_url: { url: 'data:application/octet-stream;base64,rawdata' },
        },
      ] as any;
      const result = transformLongCatMessage(content);
      expect(result).toEqual([
        {
          type: 'input_image',
          input_image: {
            data: 'data:application/octet-stream;base64,rawdata',
            type: 'base64',
          },
        },
      ]);
    });

    it('should preserve additional properties on content parts', () => {
      const content = [
        {
          type: 'text',
          text: 'Hello',
          customProp: 'value',
        } as any,
      ];
      const result = transformLongCatMessage(content);
      expect(result[0]).toHaveProperty('customProp', 'value');
    });
  });
});
