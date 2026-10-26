import { YouTubeLiveSection } from "chiesa-san-marco";

// Takes no props. Without a YouTube API key it deliberately shows the
// "open the channel" invitation rather than inventing statistics, which is the
// state designs will render. Layout is driven by a container query, so the two
// cells show the narrow and wide arrangements.
export function Narrow() {
  return (
    <div style={{ maxWidth: 420 }}>
      <YouTubeLiveSection />
    </div>
  );
}

export function Wide() {
  return (
    <div style={{ maxWidth: 900 }}>
      <YouTubeLiveSection />
    </div>
  );
}
