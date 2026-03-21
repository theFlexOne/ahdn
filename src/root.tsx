import type { PropsWithChildren } from "react";
import "./index.css";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteError,
} from "react-router";

export function meta() {
  return [
    { title: "ahdn" },
    { name: "description", content: "Website for A Hard Day's Night." },
  ];
}

export function links() {
  return [{ rel: "icon", href: "/favicon.svg" }];
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

export function ErrorBoundary() {
  const error = useRouteError();
  const title = isRouteErrorResponse(error)
    ? `${error.status} ${error.statusText}`
    : "Something went wrong";
  const message = error instanceof Error ? error.message : null;

  return (
    <section className="mx-auto flex min-h-[40vh] w-full max-w-3xl flex-col justify-center gap-4 px-6 py-16 text-gray-200">
      <h1 className="text-3xl font-semibold">{title}</h1>
      <p className="text-base text-gray-300">
        {message ?? "The page could not be rendered."}
      </p>
    </section>
  );
}

export default function App() {
  return <Outlet />;
}
