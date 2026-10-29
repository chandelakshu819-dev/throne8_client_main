export type AvailabilityStatus = 'checking' | 'available' | 'taken' | null;

export interface AvailabilitySnapshot {
  value: string | undefined;
  status: AvailabilityStatus;
}

export type AvailabilityRequest = (
  value: string,
  signal: AbortSignal
) => Promise<boolean>;

export class RegistrationAvailability {
  private snapshot: AvailabilitySnapshot = { value: undefined, status: null };
  private activeValue: string | undefined;
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private request: {
    value: string;
    controller: AbortController;
    timer: ReturnType<typeof setTimeout>;
    promise: Promise<AvailabilityStatus>;
    resolve: (status: AvailabilityStatus) => void;
  } | undefined;
  private readonly checked = new Map<string, Exclude<AvailabilityStatus, 'checking'>>();
  private readonly listeners = new Set<() => void>();

  constructor(
    private readonly requestAvailability: AvailabilityRequest,
    private readonly debounceMs = 400,
    private readonly timeoutMs = 3000
  ) {}

  getSnapshot = (): AvailabilitySnapshot => this.snapshot;

  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  setValue(value: string | undefined): void {
    if (value === this.activeValue) return;
    this.activeValue = value;
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = undefined;

    if (this.request && this.request.value !== value) this.cancelRequest();

    const status = value && this.checked.has(value) ? this.checked.get(value) ?? null : null;
    this.publish({ value, status });

    if (value && !this.checked.has(value)) {
      this.debounceTimer = setTimeout(() => {
        this.debounceTimer = undefined;
        void this.startCheck(value);
      }, this.debounceMs);
    }
  }

  checkNow(value?: string): Promise<AvailabilityStatus> {
    if (value !== undefined && value !== this.activeValue) this.setValue(value);
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = undefined;

    const current = this.activeValue;
    if (!current) return Promise.resolve(null);

    if (this.checked.has(current)) {
      const status = this.checked.get(current) ?? null;
      this.publish({ value: current, status });
      return Promise.resolve(status);
    }

    if (this.request?.value === current) return this.request.promise;
    return this.startCheck(current);
  }

  dispose(): void {
    if (this.debounceTimer) clearTimeout(this.debounceTimer);
    this.debounceTimer = undefined;
    this.cancelRequest();
    this.listeners.clear();
  }

  private startCheck(value: string): Promise<AvailabilityStatus> {
    if (value !== this.activeValue) return Promise.resolve(null);
    if (this.checked.has(value)) return Promise.resolve(this.checked.get(value) ?? null);
    if (this.request?.value === value) return this.request.promise;
    if (this.request) this.cancelRequest();

    const controller = new AbortController();
    let resolveRequest!: (status: AvailabilityStatus) => void;
    const promise = new Promise<AvailabilityStatus>((resolve) => {
      resolveRequest = resolve;
    });
    const activeRequest = {
      value,
      controller,
      timer: setTimeout(() => {
        controller.abort();
        this.finishRequest(activeRequest, null);
      }, this.timeoutMs),
      promise,
      resolve: resolveRequest,
    };
    this.request = activeRequest;
    this.publish({ value, status: 'checking' });

    this.requestAvailability(value, controller.signal)
      .then((available) => this.finishRequest(activeRequest, available ? 'available' : 'taken'))
      .catch(() => this.finishRequest(activeRequest, null));

    return promise;
  }

  private finishRequest(
    request: NonNullable<RegistrationAvailability['request']>,
    status: AvailabilityStatus
  ): void {
    if (this.request !== request) return;
    clearTimeout(request.timer);
    this.request = undefined;
    if (status !== 'checking') this.checked.set(request.value, status);
    if (this.activeValue === request.value) this.publish({ value: request.value, status });
    request.resolve(status);
  }

  private cancelRequest(): void {
    if (!this.request) return;
    const request = this.request;
    this.request = undefined;
    clearTimeout(request.timer);
    request.controller.abort();
    request.resolve(null);
  }

  private publish(snapshot: AvailabilitySnapshot): void {
    this.snapshot = snapshot;
    this.listeners.forEach((listener) => listener());
  }
}

export async function canContinueAfterAvailabilityCheck(
  check: () => Promise<AvailabilityStatus>
): Promise<boolean> {
  return (await check()) !== 'taken';
}
