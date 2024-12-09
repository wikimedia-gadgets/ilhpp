function isMobileDevice(): boolean {
  // Browser support:
  // Chromium on some Android device (e.g. Samsung) has "(hover: hover)" set
  // So check pointer together
  return matchMedia('(hover: none), (pointer: coarse)').matches;
}

/// Wait for a certain time before resolving. Reject if aborted.
function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      return reject(new Error('Aborted!'));
    }

    const id = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      return reject(new Error('Aborted!'));
    });
  });
}

function debounce<T extends (...args: any[]) => unknown>(func: T, delay: number): T {
  let id: ReturnType<typeof setTimeout> | undefined;
  return function (this: unknown, ...args: any[]) {
    clearTimeout(id);
    id = setTimeout(() => func.apply(this, args), delay);
  } as T;
}

function throttle<T extends (...args: any[]) => unknown>(func: T, limit: number): T {
  let inThrottle = false;
  return function (this: unknown, ...args: any[]) {
    if (!inThrottle) {
      inThrottle = true;
      func.apply(this, args);
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  } as T;
}

export { isMobileDevice, wait, debounce, throttle };
