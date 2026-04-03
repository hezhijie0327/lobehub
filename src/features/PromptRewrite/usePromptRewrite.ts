import { chainRewriteGenerationPrompt } from '@lobechat/prompts';
import { useCallback, useState } from 'react';

import { chatService } from '@/services/chat';
import { useUserStore } from '@/store/user';
import { systemAgentSelectors, userGeneralSettingsSelectors } from '@/store/user/selectors';
import { merge } from '@/utils/merge';

interface UsePromptRewriteParams {
  mode: 'image' | 'video' | 'text';
  onPromptChange: (prompt: string) => void;
  prompt?: string | null;
}

export const usePromptRewrite = ({ mode, prompt, onPromptChange }: UsePromptRewriteParams) => {
  const [isRewriting, setIsRewriting] = useState(false);

  const rewriteConfig = useUserStore(systemAgentSelectors.promptRewrite);
  const locale = useUserStore(userGeneralSettingsSelectors.currentResponseLanguage);
  const isEnabled = rewriteConfig?.enabled ?? false;

  const rewritePrompt = useCallback(async () => {
    if (!prompt?.trim() || !isEnabled) return;

    let rewrittenPrompt = '';

    await chatService.fetchPresetTaskResult({
      onError: () => {
        setIsRewriting(false);
      },
      onFinish: async (text) => {
        const nextPrompt = text.trim() || rewrittenPrompt.trim();
        if (nextPrompt) onPromptChange(nextPrompt);
      },
      onLoadingChange: setIsRewriting,
      onMessageHandle: (chunk) => {
        if (chunk.type === 'text') rewrittenPrompt += chunk.text;
      },
      params: merge(
        rewriteConfig ?? {},
        chainRewriteGenerationPrompt({
          locale,
          mode,
          prompt,
        }),
      ),
    });
  }, [isEnabled, locale, mode, onPromptChange, prompt, rewriteConfig]);

  return {
    isRewriteDisabled: !isEnabled || !prompt?.trim(),
    isRewriting,
    rewritePrompt,
  };
};
