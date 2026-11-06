import { useCallback, useEffect, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { loadMonthSnapshot, type MonthSnapshot } from '../data/snapshot';
import { subscribeData } from './revision';

export function useMonthSnapshot(year: number, monthIndex: number): { data: MonthSnapshot | null; failed: boolean } {
  const [data, setData] = useState<MonthSnapshot | null>(null);
  const [failed, setFailed] = useState(false);
  const [revision, setRevision] = useState(0);

  useEffect(() => subscribeData(() => setRevision((current) => current + 1)), []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setFailed(false);
      loadMonthSnapshot(year, monthIndex, new Date())
        .then((snapshot) => {
          if (active) setData(snapshot);
        })
        .catch(() => {
          if (active) setFailed(true);
        });
      return () => {
        active = false;
      };
    }, [year, monthIndex, revision]),
  );

  return { data, failed };
}
