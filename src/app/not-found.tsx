import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-24 text-center">
      <h1 className="font-serif text-4xl tracking-tight">Nothing here</h1>
      <p className="mt-3 max-w-sm text-muted-foreground">
        This link does not exist, or the interface is no longer available.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Create an interface
      </Link>
    </main>
  );
}
