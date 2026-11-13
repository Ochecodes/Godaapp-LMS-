import { createServerClient } from "@supabase/ssr";
import { cookies, headers } from "next/headers";
import { cache } from "react";

export type AuthenticatedUserClaims = {
	id: string;
	email: string | null;
	user_metadata: Record<string, unknown>;
	email_verified: boolean;
};

function isRecord(value: unknown): value is Record<string, unknown> {
	return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isAuthenticatedUserClaims(value: unknown): value is AuthenticatedUserClaims {
	return (
		isRecord(value) &&
		typeof value.id === "string" &&
		(value.email === null || typeof value.email === "string") &&
		isRecord(value.user_metadata) &&
		typeof value.email_verified === "boolean"
	);
}

export async function createClient() {
	const cookieStore = await cookies();
	const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
	const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

	if (!supabaseUrl || !supabaseAnonKey) {
		throw new Error("Supabase URL and anonymous key must be configured.");
	}

	return createServerClient(supabaseUrl, supabaseAnonKey, {
		cookies: {
			getAll() {
				return cookieStore.getAll();
			},
			setAll(cookiesToSet) {
				try {
					cookiesToSet.forEach(({ name, value, options }) => {
						cookieStore.set(name, value, options);
					});
				} catch {
					// Server Components cannot write cookies; middleware handles session refresh.
				}
			},
		},
	});
}

export const getAuthenticatedUser = cache(async () => {
	const verifiedClaims = (await headers()).get("x-goda-verified-user");
	if (!verifiedClaims || verifiedClaims.length > 16_384) return null;

	try {
		const parsed: unknown = JSON.parse(verifiedClaims);
		return isAuthenticatedUserClaims(parsed) ? parsed : null;
	} catch (error) {
		console.error("[Auth] Middleware supplied invalid verified-user claims:", error);
		return null;
	}
});
