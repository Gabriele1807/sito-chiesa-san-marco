import * as React from 'react';

/**
 * PreghieraExpand — from chiesa-san-marco@0.1.0.
 */
export interface PreghieraExpandProps {
/** Full prayer text; collapsed behind a "read more" control until expanded. */
  testo: string;
  /** Label for the expand control, e.g. "Leggi la preghiera". */
  labelRead: string;
}

export declare const PreghieraExpand: React.ComponentType<PreghieraExpandProps>;
