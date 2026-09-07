import { useState, useCallback, useRef, useEffect } from 'react';
import { CompanyFormValues } from '../types';

const DEFAULT: CompanyFormValues = {
  name: '',
  slug: '',
  tagline: '',
  description: '',
  industry: 'Technology',
  size: '11-50',
  location: '',
  founded: '',
  website: '',
  social: { linkedin: '', twitter: '', facebook: '', instagram: '', youtube: '', github: '' },
  logoUrl: null,
  bannerUrl: null,
};

function normalizeForm(val?: Partial<CompanyFormValues>): CompanyFormValues {
  return {
    name: val?.name ?? DEFAULT.name,
    slug: val?.slug ?? DEFAULT.slug,
    tagline: val?.tagline ?? DEFAULT.tagline,
    description: val?.description ?? DEFAULT.description,
    industry: val?.industry ?? DEFAULT.industry,
    size: val?.size ?? DEFAULT.size,
    location: val?.location ?? DEFAULT.location,
    founded: val?.founded ?? DEFAULT.founded,
    website: val?.website ?? DEFAULT.website,
    social: {
      linkedin: val?.social?.linkedin ?? '',
      twitter: val?.social?.twitter ?? '',
      facebook: val?.social?.facebook ?? '',
      instagram: val?.social?.instagram ?? '',
      youtube: val?.social?.youtube ?? '',
      github: val?.social?.github ?? '',
    },
    logoUrl: val?.logoUrl ?? null,
    bannerUrl: val?.bannerUrl ?? null,
  };
}

export function useCompanyForm(initial: Partial<CompanyFormValues> = {}) {
  const initialRef = useRef<CompanyFormValues>(normalizeForm(initial));
  const [form, setForm] = useState<CompanyFormValues>(initialRef.current);
  const [errors, setErrors] = useState<Partial<Record<keyof CompanyFormValues, string>>>({});
  const [isDirty, setIsDirty] = useState(false);

  // Check if form differs from baseline
  const checkDirty = useCallback((current: CompanyFormValues, baseline: CompanyFormValues) => {
    if (current.name !== baseline.name) return true;
    if (current.slug !== baseline.slug) return true;
    if (current.tagline !== baseline.tagline) return true;
    if (current.description !== baseline.description) return true;
    if (current.industry !== baseline.industry) return true;
    if (current.size !== baseline.size) return true;
    if (current.location !== baseline.location) return true;
    if (current.founded !== baseline.founded) return true;
    if (current.website !== baseline.website) return true;
    if (current.logoUrl !== baseline.logoUrl) return true;
    if (current.bannerUrl !== baseline.bannerUrl) return true;

    const s1 = current.social;
    const s2 = baseline.social;
    if ((s1.linkedin || '') !== (s2.linkedin || '')) return true;
    if ((s1.twitter || '') !== (s2.twitter || '')) return true;
    if ((s1.facebook || '') !== (s2.facebook || '')) return true;
    if ((s1.instagram || '') !== (s2.instagram || '')) return true;
    if ((s1.youtube || '') !== (s2.youtube || '')) return true;
    if ((s1.github || '') !== (s2.github || '')) return true;

    return false;
  }, []);

  const setField = useCallback(<K extends keyof CompanyFormValues>(key: K, value: CompanyFormValues[K]) => {
    setForm(prev => {
      const next = { ...prev, [key]: value };
      setIsDirty(checkDirty(next, initialRef.current));
      return next;
    });
    setErrors(prev => ({ ...prev, [key]: undefined }));
  }, [checkDirty]);

  const setSocialField = useCallback((key: keyof CompanyFormValues['social'], value: string) => {
    setForm(prev => {
      const next = { ...prev, social: { ...prev.social, [key]: value } };
      setIsDirty(checkDirty(next, initialRef.current));
      return next;
    });
  }, [checkDirty]);

  const resetForm = useCallback((newData: Partial<CompanyFormValues>) => {
    const normalized = normalizeForm(newData);
    initialRef.current = normalized;
    setForm(normalized);
    setIsDirty(false);
    setErrors({});
  }, []);

  const markPristine = useCallback(() => {
    initialRef.current = { ...form, social: { ...form.social } };
    setIsDirty(false);
  }, [form]);

  // Unsaved changes beforeunload warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  return { form, setField, setSocialField, errors, setErrors, isDirty, resetForm, markPristine };
}