// extra matchers such as toBeInTheDocument and toBeDisabled
import '@testing-library/jest-dom/vitest';
// an in-memory IndexedDB, since jsdom does not have one
import 'fake-indexeddb/auto';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// unmount whatever a test rendered so the next test starts clean
afterEach(() => cleanup());
