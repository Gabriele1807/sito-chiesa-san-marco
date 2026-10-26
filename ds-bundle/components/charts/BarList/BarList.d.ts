import * as React from 'react';

/**
 * BarList — from chiesa-san-marco@0.1.0.
 */
export interface BarListProps {
/** Ordered categories; every value is also printed, never colour-only. */
  data: { label: string; value: number }[];
  /** Unit suffix shown next to each value, e.g. "persone". */
  unit: string;
}

export declare const BarList: React.ComponentType<BarListProps>;
