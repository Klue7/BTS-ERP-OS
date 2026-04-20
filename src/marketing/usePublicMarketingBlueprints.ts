import { useEffect, useMemo, useState } from 'react';
import { fetchPublicMarketingBlueprints } from './api';
import type {
  MarketingTemplateSummary,
  PublicMarketingBlueprintSnapshot,
  PublicMarketingBlueprintTarget,
} from './contracts';

let publicBlueprintCache: PublicMarketingBlueprintSnapshot | null = null;
let publicBlueprintPromise: Promise<PublicMarketingBlueprintSnapshot> | null = null;

async function loadPublicMarketingBlueprints() {
  if (publicBlueprintCache) {
    return publicBlueprintCache;
  }

  if (!publicBlueprintPromise) {
    publicBlueprintPromise = fetchPublicMarketingBlueprints()
      .then((snapshot) => {
        publicBlueprintCache = snapshot;
        return snapshot;
      })
      .finally(() => {
        publicBlueprintPromise = null;
      });
  }

  return publicBlueprintPromise;
}

export function usePublicMarketingBlueprints() {
  const [data, setData] = useState<PublicMarketingBlueprintSnapshot | null>(publicBlueprintCache);
  const [isLoading, setIsLoading] = useState(!publicBlueprintCache);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    void loadPublicMarketingBlueprints()
      .then((snapshot) => {
        if (!active) {
          return;
        }
        setData(snapshot);
        setIsLoading(false);
      })
      .catch((loadError) => {
        if (!active) {
          return;
        }
        setError(loadError instanceof Error ? loadError.message : 'Failed to load public blueprints.');
        setIsLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return { data, isLoading, error };
}

export function usePublicMarketingBlueprint(target: PublicMarketingBlueprintTarget) {
  const { data, isLoading, error } = usePublicMarketingBlueprints();

  const blueprint = useMemo<MarketingTemplateSummary | null>(() => {
    if (!data) {
      return null;
    }
    return data.surfaces[target] ?? null;
  }, [data, target]);

  return { blueprint, isLoading, error };
}
