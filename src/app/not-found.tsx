import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen px-4 py-8 flex flex-col items-center justify-center bg-green-200 text-center">
      <h1 className="text-4xl font-bold">404 - Page not found</h1>
      <p className="my-4">The page you were looking for doesn&apos;t exist.</p>
      <Link href="/" className="underline">Go back home</Link>
    </main>
  );
}
