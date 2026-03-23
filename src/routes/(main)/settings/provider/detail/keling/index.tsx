'use client';

import { KelingProviderCard } from 'model-bank/modelProviders';
import { useTranslation } from 'react-i18next';

import { FormPassword } from '@/components/FormInput';
import { SkeletonInput } from '@/components/Skeleton';
import { aiProviderSelectors, useAiInfraStore } from '@/store/aiInfra';
import { type GlobalLLMProviderKey } from '@/types/user/settings';

import { KeyVaultsConfigKey } from '../../const';
import { type ProviderItem } from '../../type';
import ProviderDetail from '../default';

const providerKey: GlobalLLMProviderKey = 'keling';

const useKelingCard = (): ProviderItem => {
  const { t } = useTranslation('modelProvider');

  const isLoading = useAiInfraStore(aiProviderSelectors.isAiProviderConfigLoading(providerKey));

  return {
    ...KelingProviderCard,
    apiKeyItems: [
      {
        children: isLoading ? (
          <SkeletonInput />
        ) : (
          <FormPassword
            autoComplete={'new-password'}
            placeholder={t(`${providerKey}.unlock.accessKey.placeholder`)}
          />
        ),
        desc: t(`${providerKey}.accessKey.desc`),
        label: t(`${providerKey}.accessKey.title`),
        name: [KeyVaultsConfigKey, 'apiKey'],
      },
      {
        children: isLoading ? (
          <SkeletonInput />
        ) : (
          <FormPassword
            autoComplete={'new-password'}
            placeholder={t(`${providerKey}.unlock.secretKey.placeholder`)}
          />
        ),
        desc: t(`${providerKey}.secretKey.desc`),
        label: t(`${providerKey}.secretKey.title`),
        name: [KeyVaultsConfigKey, 'secretKey'],
      },
    ],
  };
};

const Page = () => {
  const card = useKelingCard();

  return <ProviderDetail {...card} />;
};

export default Page;
