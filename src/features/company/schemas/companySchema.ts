import { CompanyFormValues } from "../types";

export function validateCompanyForm(data: CompanyFormValues): Partial<Record<keyof CompanyFormValues, string>> {
  const errors: Partial<Record<keyof CompanyFormValues, string>> = {};

  const name = data.name?.trim() || '';
  if (!name) {
    errors.name = 'Company name is required';
  } else if (name.length < 2) {
    errors.name = 'Company name must be at least 2 characters';
  } else if (name.length > 100) {
    errors.name = 'Company name cannot exceed 100 characters';
  }

  const slug = data.slug?.trim() || '';
  if (!slug) {
    errors.slug = 'Throne8 URL slug is required';
  } else if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) {
    errors.slug = 'Only lowercase letters, numbers, and hyphens (e.g. throne8)';
  }

  if (!data.industry?.trim()) {
    errors.industry = 'Please select an industry';
  }

  if (data.founded) {
    const currentYear = new Date().getFullYear();
    const yearNum = Number(data.founded);
    if (isNaN(yearNum) || !/^\d{4}$/.test(data.founded.trim())) {
      errors.founded = 'Enter a valid 4-digit year (e.g. 2022)';
    } else if (yearNum < 1800) {
      errors.founded = 'Founded year must be after 1800';
    } else if (yearNum > currentYear) {
      errors.founded = 'Founded year cannot be in the future';
    }
  }

  if (data.website?.trim()) {
    try {
      const url = new URL(data.website.trim().startsWith('http') ? data.website.trim() : `https://${data.website.trim()}`);
      if (!['http:', 'https:'].includes(url.protocol)) {
        errors.website = 'Website must start with http:// or https://';
      }
    } catch {
      errors.website = 'Please enter a valid website URL';
    }
  }

  if (data.tagline && data.tagline.length > 150) {
    errors.tagline = 'Tagline cannot exceed 150 characters';
  }

  if (data.description && data.description.length > 1000) {
    errors.description = 'Description cannot exceed 1000 characters';
  }

  return errors;
}