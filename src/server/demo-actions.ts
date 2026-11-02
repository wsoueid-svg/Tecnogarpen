"use server";

import { redirect } from "next/navigation";
import { isFileDataBackend, wipeLocalDemoStore } from "../data/reset-demo";

function safeNext(value: FormDataEntryValue | null): string {
  const next = String(value ?? "/login").split("?")[0] ?? "/login";
  if (!next.startsWith("/") || next.startsWith("//") || next.includes("\\")) return "/login";
  return next;
}

export async function resetDemo(formData: FormData) {
  const next = safeNext(formData.get("next"));
  if (isFileDataBackend()) {
    await wipeLocalDemoStore();
    redirect(`${next}?reset=ok`);
  }
  redirect(`${next}?reset=remoto`);
}
