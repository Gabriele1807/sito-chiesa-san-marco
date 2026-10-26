import { IosInstallSteps } from "chiesa-san-marco";

export function InSafari() {
  return (
    <div style={{ maxWidth: 420 }}>
      <IosInstallSteps />
    </div>
  );
}

export function NotSafari() {
  return (
    <div style={{ maxWidth: 420 }}>
      <IosInstallSteps notSafari />
    </div>
  );
}
