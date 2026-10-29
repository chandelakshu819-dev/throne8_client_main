'use client'

import { useAppSelector } from '@/store/hooks';

export function useCompanyPage() {
  const meta    = useAppSelector((s) => s.company.meta)
  const isReady = !!meta?.id
  return { meta, isReady }
}
