'use client';

import React from 'react';
import { BaseContainer, FloatSwitchColorMode } from '_components/custom';
import { IntegrationsProviderModule } from '_store/state-management';
import { GoogleDriveUpload } from './components/GoogleDriveUpload';

function IntegrationsProviderPage() {
  const [enabled, setEnabled] = React.useState(false);
  const { data } = IntegrationsProviderModule.getProviderUrlQueries({
    params: {
      provider: 'GOOGLE_DRIVE',
    },
    queryOptions: { enabled },
  });

  React.useEffect(() => {
    if (data) {
      window.location.href = data.url;
    }
  }, [data]);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('connected')) {
    }
  }, []);

  return (
    <BaseContainer border={'none'}>
      <GoogleDriveUpload onEnabled={() => setEnabled(true)} />
      <FloatSwitchColorMode />
    </BaseContainer>
  );
}

export default IntegrationsProviderPage;
