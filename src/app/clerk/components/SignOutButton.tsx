"use client";

import { useClerk } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";

export function SignOutButton() {
  const { signOut } = useClerk();
  const router = useRouter();

  return (
    <button type="button" onClick={() => signOut(() => router.push("/"))}>
      Sign out
    </button>
  );
}
