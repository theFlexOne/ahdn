import './index.css';

import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router';

import type { PropsWithChildren } from 'react';

export { ErrorBoundary } from './components/ErrorBoundary';

export function meta() {
  return [{ title: 'ahdn' }, { name: 'description', content: "Website for A Hard Day's Night." }];
}

export function links() {
  return [{ rel: 'icon', href: '/favicon.svg' }];
}

function Document({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>

      <body className="bg-neutral-950">
        {children}
        <Scripts />
        <ScrollRestoration />
      </body>
    </html>
  );
}

export function Layout({ children }: PropsWithChildren) {
  return <Document>{children}</Document>;
}

export function HydrateFallback() {
  return (
    <div
      aria-busy="true"
      aria-live="polite"
      className="mx-auto min-h-[40vh] w-full max-w-5xl px-6 py-16"
    >
      <span className="sr-only">Loading page</span>
    </div>
  );
}

export default function App() {
  return <Outlet />;
}
