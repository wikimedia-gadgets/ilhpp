function isMobileDevice(): boolean {
  // Browser support:
  // Chromium on some Android device (e.g. Samsung) has "(hover: hover)" set
  // So check pointer together
  return matchMedia('(hover: none), (pointer: coarse)').matches;
}

function newAbortError(): Error {
  const error = new Error();
  error.name = 'AbortError';
  return error;
}

/**
 * Wait for a certain time before resolving. Reject if aborted.
 * @param ms
 * @param signal
 * @returns
 */
function wait(ms: number, signal?: AbortSignal) {
  return new Promise<void>((resolve, reject) => {
    if (signal?.aborted) {
      return reject(newAbortError());
    }

    const id = setTimeout(resolve, ms);

    signal?.addEventListener('abort', () => {
      clearTimeout(id);
      return reject(newAbortError());
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

function queueTask(func: (...args: any[]) => unknown) {
  if (queueMicrotask) {
    queueMicrotask(func);
  } else {
    setTimeout(func, 0);
  }
}

class Mutex {
  private lock: Promise<void> = Promise.resolve();

  acquire(): Promise<() => void> {
    let release: () => void;
    const newLock = new Promise<void>((resolve) => {
      release = resolve;
    });
    const currentLock = this.lock;
    this.lock = this.lock.then(() => newLock);
    return currentLock.then(() => release);
  }
}

export { isMobileDevice, wait, debounce, throttle, queueTask, Mutex };
