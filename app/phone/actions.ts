"use server";

import { users } from "@/lib/db";

export async function upsertUser(phone: string, name: string) {
  return users.upsert(phone, name);
}
