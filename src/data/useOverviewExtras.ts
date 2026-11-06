import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { loadOverviewExtras, type OverviewExtras } from './overview';
import { subscribeData } from './revision';

/** Reloads overview charts when the selected month or the screen focus changes. */
export function useOverviewExtras(year: number, monthIndex: number): {
  extras: OverviewExtras | null;
  failed: boolean;
} {
  const [extras, setExtras] = useState<OverviewExtras | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => subscribeData(() => setRevision((current) => current + 1)), []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setFailed(false);
      loadOverviewExtras(year, monthIndex)
        .then((next) => {
          if (active) setExtras(next);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
      return () => {
        active = false;
      };
    }, [year, monthIndex, revision]),
  );

  return { extras, failed };
}
