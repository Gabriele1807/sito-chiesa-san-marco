import * as React from 'react';

/**
 * UrgentAvvisiBanner — from chiesa-san-marco@0.1.0.
 */
export interface UrgentAvvisiBannerProps {
avvisi: {
    key: string;
    titolo: string;
    messaggio: string;
    link?: string;
  }[];
}

export declare const UrgentAvvisiBanner: React.ComponentType<UrgentAvvisiBannerProps>;
