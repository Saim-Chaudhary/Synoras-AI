"use client";

// Put this at the top of every page that needs a login:
//
//     const { user, errorMessage, logout } = useRequireAuth();
//
// No token, or a token the backend refuses: the visitor is sent to /login.

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { ApiError } from "@/lib/api";
import { fetchMe, getToken, logout as clearLogin, type User } from "@/lib/auth";

export function useRequireAuth() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false; // stops us from updating a page the visitor has already left

    async function check() {
      if (!getToken()) {
        router.replace("/login");
        return;
      }
      try {
        const me = await fetchMe(); // also proves that the token is still valid
        if (!cancelled) setUser(me);
      } catch (error) {
        if (error instanceof ApiError && error.status === 401) {
          router.replace("/login"); // authFetch has already thrown the bad token away
        } else if (!cancelled) {
          setErrorMessage(error instanceof ApiError ? error.message : "Something went wrong.");
        }
      }
    }

    check();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function logout() {
    clearLogin();
    router.replace("/login");
  }

  return { user, errorMessage, logout };
}
