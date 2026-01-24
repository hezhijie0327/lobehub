import { type UIChatMessage } from '@lobechat/types';
import { Button, Flexbox, copyToClipboard } from '@lobehub/ui';
import { App } from 'antd';
import isEqual from 'fast-deep-equal';
import { CopyIcon } from 'lucide-react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { useIsMobile } from '@/hooks/useIsMobile';
import { useChatStore } from '@/store/chat';
import { topicSelectors } from '@/store/chat/selectors';
import { exportFile } from '@/utils/client';

import { styles } from '../style';
import Preview from './Preview';
import { generateMarkdown } from './template';

interface ShareTextProps {
  item: UIChatMessage;
}

const ShareText = memo<ShareTextProps>(({ item }) => {
  const { t } = useTranslation(['chat', 'common']);
  const { message } = App.useApp();

  // Handle assistantGroup messages - content might be in children
  let contentItem = item;
  if (item.role === 'assistantGroup' && item.children && item.children.length > 0) {
    // For assistantGroup, use the last child's content
    const lastChild = item.children.at(-1);
    contentItem = {
      ...item,
      content: lastChild?.content || item.content,
    };
  }

  const messages = [contentItem];
  const topic = useChatStore(topicSelectors.currentActiveTopic, isEqual);

  const title = topic?.title || t('shareModal.exportTitle');
  const content = generateMarkdown({
    includeTool: true,
    includeUser: true,
    messages,
    systemRole: '',
    title,
    withRole: true,
    withSystemRole: false,
  }).replaceAll('\n\n\n', '\n');

  const isMobile = useIsMobile();

  const button = (
    <>
      <Button
        block
        icon={CopyIcon}
        onClick={async () => {
          await copyToClipboard(content);
          message.success(t('copySuccess', { ns: 'common' }));
        }}
        size={isMobile ? undefined : 'large'}
        type={'primary'}
      >
        {t('copy', { ns: 'common' })}
      </Button>
      <Button
        block
        onClick={() => {
          exportFile(content, `${title}.md`);
        }}
        size={isMobile ? undefined : 'large'}
      >
        {t('shareModal.downloadFile')}
      </Button>
    </>
  );

  return (
    <>
      <Flexbox className={styles.body} gap={16} horizontal={!isMobile}>
        <Preview content={content} />
        <Flexbox className={styles.sidebar} gap={12}>
          {!isMobile && button}
        </Flexbox>
      </Flexbox>
      {isMobile && (
        <Flexbox className={styles.footer} gap={8} horizontal>
          {button}
        </Flexbox>
      )}
    </>
  );
});

export default ShareText;
