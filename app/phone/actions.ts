"use server";

import { sql } from "@/lib/db";

export async function upsertUser(phone: string, name: string) {
  const rows = await sql`
    INSERT INTO users (phone, name)
    VALUES (${phone}, ${name})
    ON CONFLICT (phone) DO UPDATE SET name = EXCLUDED.name
    RETURNING id, phone, name
  `;
  return rows[0] as { id: string; phone: string; name: string };
}
