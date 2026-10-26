import * as React from 'react';

/**
 * EventRegistrations — from chiesa-san-marco@0.1.0.
 */
export interface EventRegistrationsProps {
events: {
    id: string;
    titolo: string;
    data: string;
    persone: number;
    iscrizioni: number;
    pagate: number;
    postiDisponibili?: number;
    passato: boolean;
  }[];
}

export declare const EventRegistrations: React.ComponentType<EventRegistrationsProps>;
