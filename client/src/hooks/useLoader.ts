import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import { errorMessage } from '../api/client';

interface LoadState<T> {
  key: string | null; // which request this data belongs to
  data: T | null;
  error: string | null;
}

// Loads data when the page opens, again when `deps` change or `reload()` is called,
// and tracks loading / error state so every page does not repeat that code.
export function useLoader<T>(load: () => Promise<T>, deps: unknown[] = []) {
  const [version, setVersion] = useState(0);
  const key = `${JSON.stringify(deps)}#${version}`;
  const [state, setState] = useState<LoadState<T>>({ key: null, data: null, error: null });

  // always call the latest loader without re-running the effect on every render
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    let active = true;
    loadRef
      .current()
      .then((data) => {
        if (active) setState({ key, data, error: null });
      })
      .catch((err) => {
        // keep the old data on screen if a refresh fails
        if (active) setState((s) => ({ key, data: s.data, error: errorMessage(err) }));
      });

    // ignore a late answer if the page has moved on (eg the date changed again)
    return () => {
      active = false;
    };
  }, [key]);

  const setData = useCallback((update: SetStateAction<T | null>) => {
    setState((s) => ({
      ...s,
      data:
        typeof update === 'function' ? (update as (prev: T | null) => T | null)(s.data) : update,
    }));
  }, []);

  const reload = useCallback(() => setVersion((v) => v + 1), []);

  return {
    data: state.data,
    error: state.key === key ? state.error : null,
    loading: state.key !== key,
    setData,
    reload,
  };
}
