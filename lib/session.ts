import { cookies } from "next/headers";
import { SESSION_COOKIE } from "./session-constants";

export async function hasDemoSession(): Promise<boolean> {
  const store = await cookies();
  return store.get(SESSION_COOKIE)?.value === "1";
}
