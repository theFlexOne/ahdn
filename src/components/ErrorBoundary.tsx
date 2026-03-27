import { isRouteErrorResponse, useLocation, useRouteError } from 'react-router';

function getValue(source: unknown, key: string): unknown {
  if (
    (typeof source !== 'object' && typeof source !== 'function') ||
    source === null ||
    !(key in source)
  ) {
    return null;
  }

  return (source as Record<string, unknown>)[key];
}

function getText(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function formatValue(value: unknown): string | null {
  if (value == null) {
    return null;
  }

  if (typeof value === 'string') {
    return value;
  }

  if (
    typeof value === 'number' ||
    typeof value === 'boolean' ||
    typeof value === 'bigint' ||
    typeof value === 'symbol'
  ) {
    return String(value);
  }

  if (typeof value === 'function') {
    return value.name ? `[Function ${value.name}]` : '[Function]';
  }

  if (value instanceof Error) {
    return [`${value.name}: ${value.message}`, getText(getValue(value, 'stack'))]
      .filter((part): part is string => Boolean(part))
      .join('\n\n');
  }

  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return Object.prototype.toString.call(value);
  }
}

export function ErrorBoundary() {
  const error = useRouteError();
  const location = useLocation();
  const routeError = isRouteErrorResponse(error) ? error : null;
  const title = routeError
    ? `${routeError.status} ${routeError.statusText}`
    : 'Something went wrong';
  const message = routeError
    ? (getText(routeError.data) ?? routeError.statusText)
    : (getText(getValue(error, 'message')) ?? (typeof error === 'string' ? error : null));
  const errorName = routeError ? 'RouteErrorResponse' : getText(getValue(error, 'name'));
  const errorType = routeError
    ? 'Route error response'
    : (getText(getValue(getValue(error, 'constructor'), 'name')) ??
      (Array.isArray(error) ? 'Array' : typeof error));
  const routeData = routeError ? formatValue(routeError.data) : null;
  const errorCause = !routeError ? formatValue(getValue(error, 'cause')) : null;
  const stack = !routeError ? getText(getValue(error, 'stack')) : null;
  const rawError =
    !routeError && !(error instanceof Error) && typeof error !== 'string'
      ? formatValue(error)
      : null;
  const currentUrl = `${location.pathname}${location.search}${location.hash}`;
  const details = [
    { label: 'Type', value: errorType },
    { label: 'Name', value: errorName },
    { label: 'URL', value: currentUrl },
    { label: 'Status', value: routeError ? String(routeError.status) : null },
    { label: 'Status Text', value: routeError?.statusText ?? null },
  ].filter((detail): detail is { label: string; value: string } => Boolean(detail.value));

  return (
    <section className="mx-auto flex min-h-screen w-full max-w-5xl flex-col justify-center gap-6 px-6 py-16 text-gray-200">
      <div className="space-y-3">
        <p className="text-sm font-medium tracking-[0.3em] text-red-300 uppercase">
          Application error
        </p>
        <h1 className="text-3xl font-semibold sm:text-4xl">{title}</h1>
        <p className="max-w-3xl text-base leading-7 text-gray-300 sm:text-lg">
          {message ?? 'The page could not be rendered.'}
        </p>
      </div>

      {details.length > 0 && (
        <dl className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {details.map((detail) => (
            <div
              key={detail.label}
              className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur"
            >
              <dt className="text-xs font-medium tracking-[0.24em] text-gray-400 uppercase">
                {detail.label}
              </dt>
              <dd className="mt-2 font-mono text-sm leading-6 wrap-break-word text-gray-100">
                {detail.value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {routeData && (
        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-lg font-semibold text-white">Route error data</h2>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/40 p-4 font-mono text-sm leading-6 wrap-break-word whitespace-pre-wrap text-red-100">
            {routeData}
          </pre>
        </div>
      )}

      {errorCause && (
        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-lg font-semibold text-white">Cause</h2>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/40 p-4 font-mono text-sm leading-6 wrap-break-word whitespace-pre-wrap text-gray-100">
            {errorCause}
          </pre>
        </div>
      )}

      {stack && (
        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-lg font-semibold text-white">Stack trace</h2>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/40 p-4 font-mono text-sm leading-6 wrap-break-word whitespace-pre-wrap text-gray-100">
            {stack}
          </pre>
        </div>
      )}

      {rawError && (
        <div className="rounded-3xl border border-white/10 bg-black/30 p-5">
          <h2 className="text-lg font-semibold text-white">Raw error payload</h2>
          <pre className="mt-3 overflow-x-auto rounded-2xl bg-black/40 p-4 font-mono text-sm leading-6 wrap-break-word whitespace-pre-wrap text-gray-100">
            {rawError}
          </pre>
        </div>
      )}
    </section>
  );
}
