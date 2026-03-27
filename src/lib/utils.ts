import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function buildUrl(
  rootUrl = '',
  path: string | string[] = '',
  searchParams?: Record<string, string>,
): string {
  if (!rootUrl && !path && !searchParams) {
    console.error('No rootUrl, path, or searchParams provided');
    return '';
  }

  const protocol = parseProtocol(rootUrl);
  rootUrl = formatSlashesInPath(rootUrl.split(':').at(-1));
  path &&= `/${formatSlashesInPath(Array.isArray(path) ? path.join('/') : path)}`;
  let fullUrl = `${protocol}${rootUrl}${path}`;
  if (searchParams && Object.keys(searchParams).length > 0) {
    fullUrl += `?${new URLSearchParams(searchParams).toString()}`;
  }
  return fullUrl;
}

function formatSlashesInPath(path = ''): string {
  return path.split('/').filter(Boolean).join('/');
}

function parseProtocol(url: string): string {
  const protocolRegex = /^[A-Za-z0-9\\+\\.-]+:\/{0,2}/;
  return url.match(protocolRegex)?.[0] || '';
}
