"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { storage } from "@/lib/storage";
import { ROUTES } from "@/lib/routes";

export default function PhonePage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [name, setName] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    storage.setUser(phone.trim(), name.trim());
    router.push(ROUTES.home);
  }

  const isValid = phone.trim() && name.trim();

  return (
    <main className="flex flex-1 items-center justify-center">
      <div className="flex flex-col items-center gap-6 px-4">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-semibold tracking-tight">Set up your profile</h1>
          <p className="text-sm text-muted-foreground">Tell us a bit about yourself to get started.</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-72">
          <Input
            type="text"
            placeholder="Your name"
            className="rounded-md"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
          />
          <PhoneInput value={phone} onChange={setPhone} />
          <Button type="submit" className="w-full" disabled={!isValid}>
            Continue
          </Button>
        </form>
      </div>
    </main>
  );
}
