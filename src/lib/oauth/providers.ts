/**
 * Adapter per i provider OAuth supportati, costruiti su `arctic`. Apple non
 * è nella whitelist attiva finché non implementato — vedi design spec §8.
 */

import { Google, Facebook, decodeIdToken } from "arctic";

export const SUPPORTED_PROVIDERS = ["google", "facebook"] as const;
export type SupportedProvider = (typeof SUPPORTED_PROVIDERS)[number];

export interface OAuthProfile {
  providerAccountId: string;
  email?: string;
  emailVerified?: boolean;
  givenName?: string;
  familyName?: string;
  pictureUrl?: string;
}

export interface ProviderAdapter {
  usesPkce: boolean;
  createAuthorizationURL(state: string, codeVerifier?: string): URL;
  validateCallback(code: string, codeVerifier?: string): Promise<OAuthProfile>;
}

function callbackUrl(provider: SupportedProvider): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base}/api/auth/oauth/${provider}/callback`;
}

function buildGoogleAdapter(): ProviderAdapter | null {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const google = new Google(clientId, clientSecret, callbackUrl("google"));

  return {
    usesPkce: true,
    createAuthorizationURL(state, codeVerifier) {
      return google.createAuthorizationURL(state, codeVerifier ?? "", [
        "openid",
        "email",
        "profile",
      ]);
    },
    async validateCallback(code, codeVerifier) {
      const tokens = await google.validateAuthorizationCode(code, codeVerifier ?? "");
      const claims = decodeIdToken(tokens.idToken()) as {
        sub: string;
        email?: string;
        email_verified?: boolean;
        given_name?: string;
        family_name?: string;
        picture?: string;
      };
      return {
        providerAccountId: claims.sub,
        email: claims.email,
        emailVerified: claims.email_verified,
        givenName: claims.given_name,
        familyName: claims.family_name,
        pictureUrl: claims.picture,
      };
    },
  };
}

function buildFacebookAdapter(): ProviderAdapter | null {
  const clientId = process.env.FACEBOOK_CLIENT_ID;
  const clientSecret = process.env.FACEBOOK_CLIENT_SECRET;
  if (!clientId || !clientSecret) return null;

  const facebook = new Facebook(clientId, clientSecret, callbackUrl("facebook"));

  return {
    usesPkce: false,
    createAuthorizationURL(state) {
      return facebook.createAuthorizationURL(state, ["email", "public_profile"]);
    },
    async validateCallback(code) {
      const tokens = await facebook.validateAuthorizationCode(code);
      const res = await fetch(
        `https://graph.facebook.com/me?fields=id,first_name,last_name,email,picture&access_token=${encodeURIComponent(
          tokens.accessToken()
        )}`
      );
      if (!res.ok) {
        throw new Error("Impossibile recuperare il profilo Facebook");
      }
      const data = (await res.json()) as {
        id: string;
        first_name?: string;
        last_name?: string;
        email?: string;
        picture?: { data?: { url?: string } };
      };
      return {
        providerAccountId: data.id,
        email: data.email,
        // Facebook restituisce solo email verificate tramite Graph API.
        emailVerified: Boolean(data.email),
        givenName: data.first_name,
        familyName: data.last_name,
        pictureUrl: data.picture?.data?.url,
      };
    },
  };
}

export function getProviderAdapter(provider: SupportedProvider): ProviderAdapter | null {
  if (provider === "google") return buildGoogleAdapter();
  if (provider === "facebook") return buildFacebookAdapter();
  return null;
}
