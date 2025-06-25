// Minimal stub for Chrome extension APIs so that the app can render
// inside Vite dev/preview without the actual browser-extension context.
// When the extension is loaded in Chrome, the real `chrome` object will
// override this stub.

// Declare 'chrome' on the global scope so TypeScript recognizes it.
declare global {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  var chrome: any;
}


// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore -- we purposely add to globalThis
if (typeof globalThis.chrome === 'undefined') {
  globalThis.chrome = {
    storage: {
      local: {
        // Return empty object for any requested keys
        get: (_keys: any, callback: (result: Record<string, unknown>) => void) => callback({}),
        set: () => {},
      },
    },
    runtime: {
      sendMessage: () => {},
      onMessage: {
        addListener: () => {},
        removeListener: () => {},
      },
      lastError: undefined,
    },
  } as any;
}

export {};
