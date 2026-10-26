import * as React from 'react';

/**
 * StatTile — from chiesa-san-marco@0.1.0.
 */
export interface StatTileProps {
label: string;
  value: number | string;
  /** Secondary line under the value, e.g. "+12 questo mese". */
  detail?: string;
  /** A lucide-react icon component, passed uninstantiated. */
  icon: React.ComponentType<{ className?: string; size?: string | number; strokeWidth?: string | number; color?: string }>;
}

export declare const StatTile: React.ComponentType<StatTileProps>;
