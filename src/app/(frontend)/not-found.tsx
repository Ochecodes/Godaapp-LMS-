import Link from "next/link";

export default function NotFound() {
  return (
    <main className="grid min-h-[65vh] place-items-center px-5 py-16">
      <div className="max-w-lg text-center">
        <p className="text-sm font-semibold tracking-wide text-primary">404</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
        <p className="mt-3 text-muted-foreground">
          This page may have moved, or the link may be incorrect.
        </p>
        <Link
          className="mt-6 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          href="/"
        >
          Go to home
        </Link>
      </div>
    </main>
  );
}
