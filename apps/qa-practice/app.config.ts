import type { AppDefinition } from '../../core/config/env';

/** Where QA Practice runs. Only this file knows about the app's hosts. */
export const qaPractice: AppDefinition = {
  name: 'qa-practice',
  productionHosts: ['qapractice.hakdogan.com'],
  environments: {
    production: { baseURL: 'https://qapractice.hakdogan.com' },
    // `npx serve out -l 4173` in the app repository, or any static server.
    local: { baseURL: 'http://127.0.0.1:4173' },
  },
};

/** GA4 property shared with hakdogan.com (public, from the app source). */
export const QA_PRACTICE_ANALYTICS_IDS = ['G-L3VW7MVS0V'] as const;
