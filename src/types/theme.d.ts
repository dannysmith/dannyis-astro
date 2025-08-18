// Type declarations for the global theme API

declare global {
  interface Window {
    theme: {
      readonly current: 'auto' | 'light' | 'dark';
      readonly resolved: 'light' | 'dark';
      readonly system: 'light' | 'dark';
      readonly themes: readonly ['auto', 'light', 'dark'];
      set: (theme: 'auto' | 'light' | 'dark') => void;
    };
  }

  interface DocumentEventMap {
    'theme-changed': CustomEvent<{
      theme: 'auto' | 'light' | 'dark';
      resolvedTheme: 'light' | 'dark';
    }>;
  }
}

export {};
