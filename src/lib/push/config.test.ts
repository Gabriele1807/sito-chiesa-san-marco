import { describe, it, expect } from "vitest";
import { createECDH } from "node:crypto";
import { checkVapidConfig } from "./config";

const b64url = (buf: Buffer) => buf.toString("base64url");

function keyPair() {
  const ecdh = createECDH("prime256v1");
  ecdh.generateKeys();
  return { publicKey: b64url(ecdh.getPublicKey()), privateKey: b64url(ecdh.getPrivateKey()) };
}

const pair = keyPair();
const env = (overrides: Record<string, string | undefined>) =>
  ({
    NEXT_PUBLIC_VAPID_PUBLIC_KEY: pair.publicKey,
    VAPID_PRIVATE_KEY: pair.privateKey,
    VAPID_SUBJECT: "mailto:info@example.test",
    ...overrides,
  }) as unknown as NodeJS.ProcessEnv;

describe("checkVapidConfig", () => {
  it("accepts a valid key pair with a mailto subject", () => {
    const { config, problems } = checkVapidConfig(env({}));
    expect(problems).toEqual([]);
    expect(config?.subject).toBe("mailto:info@example.test");
  });

  it("names the missing variables", () => {
    const { config, problems } = checkVapidConfig(
      env({ VAPID_PRIVATE_KEY: undefined, VAPID_SUBJECT: "" })
    );
    expect(config).toBeNull();
    expect(problems[0]).toContain("VAPID_PRIVATE_KEY, VAPID_SUBJECT");
  });

  it("explains a subject without mailto:", () => {
    const { problems } = checkVapidConfig(env({ VAPID_SUBJECT: "info@example.test" }));
    expect(problems).toEqual([expect.stringContaining('iniziare con "mailto:"')]);
  });

  it("detects values pasted with quotes or as NAME=value", () => {
    const quoted = checkVapidConfig(env({ VAPID_SUBJECT: '"mailto:info@example.test"' }));
    expect(quoted.problems[0]).toContain("virgolette");
    const line = checkVapidConfig(
      env({ VAPID_PRIVATE_KEY: `VAPID_PRIVATE_KEY=${pair.privateKey}` })
    );
    expect(line.problems[0]).toContain("VAPID_PRIVATE_KEY contiene");
  });

  it("detects keys from two different pairs", () => {
    const other = keyPair();
    const { config, problems } = checkVapidConfig(env({ VAPID_PRIVATE_KEY: other.privateKey }));
    expect(config).toBeNull();
    expect(problems).toEqual([expect.stringContaining("non sono della stessa coppia")]);
  });

  it("never includes the secret values in the messages", () => {
    const { problems } = checkVapidConfig(
      env({ VAPID_PRIVATE_KEY: `"${pair.privateKey}"`, VAPID_SUBJECT: "wrong" })
    );
    expect(problems.join(" ")).not.toContain(pair.privateKey);
  });
});
