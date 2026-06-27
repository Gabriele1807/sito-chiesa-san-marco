const encoder = new TextEncoder();

type JwtHeader = {
  alg: "HS256";
  typ: "JWT";
};

export type JwtPayload = {
  sub: string;
  iat: number;
  exp: number;
  [key: string]: string | number | boolean | undefined;
};

function getJwtSecret(): string {
  return (
    process.env.ADMIN_SESSION_SECRET ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "san-marco-dev-jwt-secret"
  );
}

function bytesToBase64Url(bytes: Uint8Array): string {
  const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function stringToBase64Url(value: string): string {
  return bytesToBase64Url(encoder.encode(value));
}

function base64UrlToString(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  const binary = atob(padded);
  return Array.from(binary, (char) => String.fromCharCode(char.charCodeAt(0))).join("");
}

async function importJwtKey() {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(getJwtSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function signValue(value: string): Promise<string> {
  const key = await importJwtKey();
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(signature));
}

export async function signJwt(
  payload: Omit<JwtPayload, "iat" | "exp">,
  expiresInSeconds: number
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header: JwtHeader = { alg: "HS256", typ: "JWT" };
  const fullPayload: JwtPayload = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };

  const encodedHeader = stringToBase64Url(JSON.stringify(header));
  const encodedPayload = stringToBase64Url(JSON.stringify(fullPayload));
  const signature = await signValue(`${encodedHeader}.${encodedPayload}`);

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function verifyJwt<T extends JwtPayload>(token: string): Promise<T | null> {
  if (!token) return null;

  const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");
  if (!encodedHeader || !encodedPayload || !encodedSignature) return null;

  try {
    const key = await importJwtKey();
    const verified = await crypto.subtle.verify(
      "HMAC",
      key,
      Uint8Array.from(
        atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(encodedSignature.length / 4) * 4, "=")),
        (char) => char.charCodeAt(0)
      ),
      encoder.encode(`${encodedHeader}.${encodedPayload}`)
    );

    if (!verified) return null;

    const header = JSON.parse(base64UrlToString(encodedHeader)) as JwtHeader;
    if (header.alg !== "HS256" || header.typ !== "JWT") return null;

    const payload = JSON.parse(base64UrlToString(encodedPayload)) as T;
    if (!payload.exp || payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}
