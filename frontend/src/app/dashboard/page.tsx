"use client";

import { useRequireAuth } from "@/lib/use-require-auth";

// The page you land on after logging in. Only logged-in users can see it.
export default function DashboardPage() {
  const { user, errorMessage, logout } = useRequireAuth();

  if (errorMessage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
        <p role="alert" className="max-w-md rounded-md border border-red-300 bg-red-50 px-4 py-3 text-red-800">
          {errorMessage}
        </p>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-gray-100">
        <p className="text-gray-600">Loading...</p>
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="flex items-center justify-between border-b border-gray-300 bg-white px-6 py-4">
        <span className="font-bold text-gray-800">Synoras AI</span>
        <button
          type="button"
          onClick={logout}
          className="cursor-pointer rounded-md border border-gray-600 bg-white px-4 py-2 font-bold text-gray-800 hover:bg-gray-50"
        >
          Log out
        </button>
      </header>

      <main className="mx-auto max-w-2xl px-4 py-10">
        <div className="rounded-2xl border border-gray-300 bg-white p-8">
          <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h1>
          <dl className="mt-6 space-y-3">
            <div>
              <dt className="text-sm text-gray-500">Name</dt>
              <dd className="text-gray-900">{user.name}</dd>
            </div>
            <div>
              <dt className="text-sm text-gray-500">Email</dt>
              <dd className="text-gray-900">{user.email}</dd>
            </div>
          </dl>
          <p className="mt-8 text-sm text-gray-500">
            Chat, memory and projects will appear here as they are built.
          </p>
        </div>
      </main>
    </div>
  );
}
