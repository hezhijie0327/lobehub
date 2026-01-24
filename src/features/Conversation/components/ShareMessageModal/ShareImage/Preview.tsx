import { OFFICIAL_DOMAIN } from '@lobechat/const';
import { type UIChatMessage } from '@lobechat/types';
import { ModelTag } from '@lobehub/icons';
import { Avatar, Flexbox, Markdown } from '@lobehub/ui';
import { ChatHeaderTitle } from '@lobehub/ui/chat';
import { cx } from 'antd-style';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { ProductLogo } from '@/components/Branding';
import PluginTag from '@/features/PluginTag';
import { useAgentStore } from '@/store/agent';
import { agentSelectors } from '@/store/agent/selectors';

import { useAgentMeta, useIsBuiltinAgent } from '../../../hooks';
import { styles as containerStyles } from '../style';
import { styles } from './style';
import { type FieldType } from './type';

interface PreviewProps extends FieldType {
  message: UIChatMessage;
  previewId?: string;
  title?: string;
}

const Preview = memo<PreviewProps>(
  ({ title, withBackground, withFooter, message, previewId = 'preview' }) => {
    const [model, plugins] = useAgentStore((s) => [
      agentSelectors.currentAgentModel(s),
      agentSelectors.displayableAgentPlugins(s),
    ]);

    const agentMeta = useAgentMeta(message.agentId);
    const isBuiltinAgent = useIsBuiltinAgent();

    const { t } = useTranslation('chat');

    // Handle assistantGroup messages - content might be in children
    let content = message.content;
    if (message.role === 'assistantGroup' && message.children && message.children.length > 0) {
      // For assistantGroup, use the last child's content
      const lastChild = message.children.at(-1);
      content = lastChild?.content || message.content;
    }

    const displayTitle = agentMeta.title || title;
    const displayDesc = isBuiltinAgent ? t('inbox.desc') : agentMeta.description;

    return (
      <div className={containerStyles.preview}>
        <div className={withBackground ? styles.background : undefined} id={previewId}>
          <Flexbox
            className={cx(styles.container, withBackground && styles.container_withBackground_true)}
            gap={16}
          >
            <div className={styles.header}>
              <Flexbox align={'flex-start'} gap={12} horizontal>
                <Avatar
                  avatar={agentMeta.avatar}
                  background={agentMeta.backgroundColor}
                  shape={'square'}
                  size={40}
                  title={displayTitle}
                />
                <ChatHeaderTitle
                  desc={displayDesc}
                  tag={
                    <Flexbox gap={4} horizontal>
                      <ModelTag model={model} />
                      {plugins?.length > 0 && <PluginTag plugins={plugins} />}
                    </Flexbox>
                  }
                  title={displayTitle}
                />
              </Flexbox>
            </div>
            <Flexbox
              height={'100%'}
              style={{ paddingTop: 24, position: 'relative' }}
              width={'100%'}
            >
              <Flexbox
                height={'100%'}
                style={{ paddingTop: 24, position: 'relative' }}
                width={'100%'}
              >
                {/* User avatar on the right */}
                {message.role === 'user' && (
                  <Flexbox align={'flex-end'} gap={8} paddingBlock={8}>
                    <Avatar
                      avatar={agentMeta.avatar}
                      background={agentMeta.backgroundColor}
                      shape={'square'}
                      size={28}
                      title={displayTitle}
                    />
                  </Flexbox>
                )}

                {/* Assistant avatar on the left and content */}
                <Flexbox gap={8} paddingBlock={8}>
                  {message.role !== 'user' && (
                    <Avatar
                      avatar={agentMeta.avatar}
                      background={agentMeta.backgroundColor}
                      shape={'square'}
                      size={28}
                      title={displayTitle}
                    />
                  )}
                  <Flexbox
                    style={{
                      maxWidth: '100%',
                      overflow: 'hidden',
                      width: message.role === 'user' ? undefined : '100%',
                    }}
                  >
                    <Markdown variant="chat">{content}</Markdown>
                  </Flexbox>
                </Flexbox>
              </Flexbox>
            </Flexbox>
            {withFooter ? (
              <Flexbox align={'center'} className={styles.footer} gap={4}>
                <ProductLogo type={'combine'} />
                <div className={styles.url}>{OFFICIAL_DOMAIN}</div>
              </Flexbox>
            ) : (
              <div />
            )}
          </Flexbox>
        </div>
      </div>
    );
  },
);

export default Preview;
