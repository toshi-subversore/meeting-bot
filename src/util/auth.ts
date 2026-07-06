import axios from 'axios';
import config from '../config';

const baseURLV2 = config.authBaseUrlV2;

export const createApiV2 = (token: string, serviceKey?: string) =>
  axios.create({
    baseURL: baseURLV2,
    // ponytail: this optional status callback has no real receiver in our
    // self-hosted setup (AUTH_BASE_URL_V2 is the upstream SaaS's own tracking
    // API) — a hung/dropped connection to it must never delay finishing a
    // bot job. Bound it; the join/record/upload path doesn't depend on it.
    timeout: 5000,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(serviceKey && { 'x-sa-api-key': serviceKey }),
    },
  });
