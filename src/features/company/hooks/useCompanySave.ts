import { useState, useCallback } from 'react';
import { validateCompanyForm } from '../schemas/companySchema';
import { CompanyFormValues } from '../types';
import CompanyService from '@/lib/api/company.service';
import { useAppDispatch } from '@/store/hooks';
import { fetchCompanyById } from '../store/slices/companySlice';

type Status = 'idle' | 'saving' | 'saved' | 'error';

function parseLocation(loc: string) {
  const parts = loc.split(',').map(s => s.trim());
  return {
    address: loc.trim(),
    city: parts[0] || loc.trim(),
    state: parts[1] || '',
    country: parts[2] || 'India',
  };
}

export function useCompanySave({
  companyId,
  onSuccess,
}: {
  companyId: string;
  onSuccess?: () => void;
}) {
  const dispatch = useAppDispatch();
  const [status, setStatus] = useState<Status>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const save = useCallback(async (
    data: CompanyFormValues,
    setErrors: (e: Partial<Record<keyof CompanyFormValues, string>>) => void
  ) => {
    if (!companyId) {
      setStatus('error');
      setErrorMessage('Company ID not found. Please refresh or create a company first.');
      return false;
    }

    const fieldErrors = validateCompanyForm(data);
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return false;
    }

    setStatus('saving');
    setErrorMessage(null);

    try {
      const payload: any = {
        companyName: data.name.trim(),
        companySlug: data.slug.trim().toLowerCase(),
        tagline: data.tagline?.trim() || '',
        description: data.description?.trim() || '',
        descriptions: {
          short: data.description?.trim() || '',
          tagline: data.tagline?.trim() || '',
        },
        industry: data.industry,
        companySize: data.size,
        size: data.size,
        headquarters: parseLocation(data.location),
        website: data.website?.trim() || '',
        socialMedia: {
          linkedin: data.social.linkedin?.trim() || '',
          twitter: data.social.twitter?.trim() || '',
          facebook: data.social.facebook?.trim() || '',
          instagram: data.social.instagram?.trim() || '',
          youtube: data.social.youtube?.trim() || '',
          github: data.social.github?.trim() || '',
        },
      };

      if (data.founded && !isNaN(Number(data.founded))) {
        payload.foundedYear = Number(data.founded);
        payload.founded = Number(data.founded);
      }

      await CompanyService.updateCompany(companyId, payload);

      // Refresh company state in Redux
      dispatch(fetchCompanyById(companyId));

      setStatus('saved');
      onSuccess?.();
      setTimeout(() => setStatus('idle'), 3000);
      return true;
    } catch (err: any) {
      setStatus('error');
      const msg = err?.message || 'Failed to save company profile';
      setErrorMessage(msg);
      return false;
    }
  }, [companyId, dispatch, onSuccess]);

  return {
    save,
    isSaving: status === 'saving',
    isSaved: status === 'saved',
    isError: status === 'error',
    errorMessage,
  };
}