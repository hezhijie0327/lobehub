import { InputPassword } from '@lobehub/ui';
import { cssVar } from 'antd-style';
import { Image } from 'lucide-react';
import { ModelProvider } from 'model-bank';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';

import { FormAction } from '@/features/Conversation/Error/style';
import { aiProviderSelectors, useAiInfraStore } from '@/store/aiInfra';

const KelingForm = memo<{ description: string }>(({ description }) => {
  const { t } = useTranslation('modelProvider');

  const config = useAiInfraStore(aiProviderSelectors.providerKeyVaults(ModelProvider.Keling));
  const setConfig = useAiInfraStore((s) => s.updateAiProviderConfig);
  const { accessKey, secretKey } = config || {};

  return (
    <FormAction
      avatar={<Image color={cssVar.colorText} size={56} />}
      description={description}
      title={t('keling.unlock.title')}
    >
      <InputPassword
        autoComplete={'new-password'}
        placeholder={t('keling.unlock.accessKey.placeholder')}
        value={accessKey}
        variant={'filled'}
        onChange={(e) => {
          setConfig(ModelProvider.Keling, { keyVaults: { accessKey: e.target.value } });
        }}
      />
      <InputPassword
        autoComplete={'new-password'}
        placeholder={t('keling.unlock.secretKey.placeholder')}
        value={secretKey}
        variant={'filled'}
        onChange={(e) => {
          setConfig(ModelProvider.Keling, { keyVaults: { secretKey: e.target.value } });
        }}
      />
    </FormAction>
  );
});

export default KelingForm;
