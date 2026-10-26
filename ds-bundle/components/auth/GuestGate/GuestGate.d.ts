import * as React from 'react';

/**
 * GuestGate — from chiesa-san-marco@0.1.0.
 */
export interface GuestGateProps {
  children: React.ReactNode;
  /** Messaggio da mostrare quando la sezione è bloccata */
  message?: string;
}

export declare const GuestGate: React.ComponentType<GuestGateProps>;
