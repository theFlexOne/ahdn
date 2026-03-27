import { Link } from 'react-router';

export default function NotFound() {
  return (
    <section className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-center justify-center gap-4 px-6 py-16 text-center text-gray-200">
      <p className="text-lg tracking-[0.3em] text-gray-400 uppercase">404</p>
      <h1 className="text-4xl font-semibold">Page not found</h1>
      <p className="text-base text-gray-300">The page you were looking for does not exist.</p>
      <Link
        to="/"
        className="rounded border border-gray-600 px-4 py-2 text-sm tracking-wider uppercase hover:bg-white hover:text-black"
      >
        Back home
      </Link>
    </section>
  );
}
