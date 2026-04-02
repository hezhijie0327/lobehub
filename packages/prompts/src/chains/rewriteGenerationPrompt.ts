import type { ChatStreamPayload } from '@lobechat/types';

interface RewriteGenerationPromptParams {
  locale: string;
  mode: 'image' | 'video' | 'text';
  prompt: string;
}

export const chainRewriteGenerationPrompt = ({
  mode,
  prompt,
  locale,
}: RewriteGenerationPromptParams): Partial<ChatStreamPayload> => ({
  messages: [
    {
      content: `You are an expert AI ${mode} prompt engineer. Rewrite the user's prompt to make it clearer, richer in visual details, and more production-ready while preserving the original intent.

Rules:
1. Output only the rewritten prompt, without explanation.
2. Keep the output in ${locale}.
3. Keep important entities, style, scene, and constraints from the original prompt.
4. Keep it concise and practical for direct model input.`,
      role: 'system',
    },
    {
      content: prompt,
      role: 'user',
    },
  ],
});
