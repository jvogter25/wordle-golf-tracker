"use client";
import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../contexts/AuthContext";

// Only protect main app routes, not / or /auth/*
const protectedPrefixes = [
  "/golf",
  "/leaderboard",
  "/clubhouse",
  "/player",
  "/submit",
  "/tournaments"
];

function isProtectedRoute(pathname: string) {
  return protectedPrefixes.some(prefix => pathname.startsWith(prefix));
}

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user && isProtectedRoute(pathname) && !pathname.startsWith("/auth")) {
      router.replace("/auth/login");
    }
  }, [user, loading, pathname, router]);

  if (loading) return null;
  if (!user && isProtectedRoute(pathname) && !pathname.startsWith("/auth")) return null;

  return <>{children}</>;
} 