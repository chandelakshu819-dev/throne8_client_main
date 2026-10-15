import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import AuthService from '@/lib/api/auth.service';
import {
  AvailabilityStatus,
  RegistrationAvailability,
} from './registrationAvailability';

export function useRegistrationAvailability(
  field: 'email' | 'phone',
  value: string | undefined
): {
  status: AvailabilityStatus;
  checkNow: (value?: string) => Promise<AvailabilityStatus>;
} {
  const availability = useMemo(
    () => new RegistrationAvailability(
      (checkedValue, signal) => AuthService.checkRegistrationAvailability(field, checkedValue, signal)
    ),
    [field]
  );
  const snapshot = useSyncExternalStore(
    availability.subscribe,
    availability.getSnapshot,
    availability.getSnapshot
  );

  useEffect(() => {
    availability.setValue(value);
  }, [availability, value]);

  useEffect(() => () => availability.dispose(), [availability]);

  const checkNow = useCallback(
    (checkedValue?: string) => availability.checkNow(checkedValue),
    [availability]
  );

  return {
    status: snapshot.value === value ? snapshot.status : null,
    checkNow,
  };
}
