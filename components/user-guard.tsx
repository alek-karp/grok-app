"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { storage } from "@/lib/storage";

export function UserGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === "/phone") return;
    // The caretaker console runs on a separate device with no patient signup.
    if (pathname === "/caretaker") return;
    if (!storage.getPhone() || !storage.getName()) {
      router.replace("/phone");
    }
  }, [pathname, router]);

  return <>{children}</>;
}
