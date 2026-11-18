import type { ReactNode } from "react";

// The white card in the middle of the page, as in the Register / Log In mockup.
export default function AuthCard({ title, children }: { title: string; children: ReactNode }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border border-gray-300 bg-white p-8">
        <div className="mx-auto flex h-14 w-24 items-center justify-center border border-gray-300 bg-gray-100 text-xs text-gray-500">
          LOGO
        </div>
        <h1 className="mt-4 text-center text-xl font-bold text-gray-800">{title}</h1>
        {children}
      </div>
    </main>
  );
}
