"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authMutation, type Operation } from "@/lib/auth/mutations";
import type { AuthState } from "@/lib/auth/inputs";

async function perform(operation: Operation, form: FormData): Promise<AuthState> {
  const request = await headers();
  // Next Server Actions also enforce POST + Origin/Host matching.
  const state = await authMutation(operation, form, request.get("origin"), request.get("host"));
  if (state.redirectTo) redirect(state.redirectTo);
  return state;
}
export async function signInAction(_previous: AuthState, form: FormData) { return perform("sign-in", form); }
export async function enrollAction(_previous: AuthState, form: FormData) { return perform("enroll", form); }
export async function verifyAction(_previous: AuthState, form: FormData) { return perform("verify", form); }
export async function signOutAction(_previous: AuthState, form: FormData) { return perform("sign-out", form); }
export async function recheckAction(_previous: AuthState, form: FormData) { return perform("recheck", form); }
