import type { PostHog } from '../posthog-rn';
import { PostHogDecideResponse } from 'posthog-core';
export declare function useFeatureFlags(client?: PostHog): PostHogDecideResponse['featureFlags'] | undefined;
