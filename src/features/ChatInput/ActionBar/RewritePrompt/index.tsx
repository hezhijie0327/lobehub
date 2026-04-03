'use client';

import { Sparkles } from 'lucide-react';
import { memo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { usePromptRewrite } from '@/features/PromptRewrite/usePromptRewrite';

import { useChatInputStore } from '../../store';
import Action from '../components/Action';

const RewritePrompt = memo(() => {
  const { t } = useTranslation(['chat', 'common']);
  const [editor, markdownContent] = useChatInputStore((s) => [s.editor, s.markdownContent]);

  const onPromptChange = useCallback(
    (prompt: string) => {
      if (!editor) return;
      editor.setDocument('markdown', prompt);
    },
    [editor],
  );

  const { isRewriteDisabled, isRewriting, rewritePrompt } = usePromptRewrite({
    mode: 'text',
    onPromptChange,
    prompt: markdownContent,
  });

  return (
    <Action
      disabled={isRewriteDisabled}
      icon={Sparkles}
      loading={isRewriting}
      title={
        isRewriting
          ? t('rewritePrompt.status', { ns: 'common' })
          : t('rewritePrompt.action', { ns: 'common' })
      }
      onClick={rewritePrompt}
    />
  );
});

RewritePrompt.displayName = 'RewritePrompt';

export default RewritePrompt;
