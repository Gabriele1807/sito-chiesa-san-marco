import { EmailVerificationStatus } from "chiesa-san-marco";

export function Unverified() {
  return (
    <div style={{ maxWidth: 480 }}>
      <EmailVerificationStatus verified={false} />
    </div>
  );
}

export function Verified() {
  return (
    <div style={{ maxWidth: 480 }}>
      <EmailVerificationStatus verified />
    </div>
  );
}
