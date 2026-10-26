import * as React from 'react';

/**
 * FooterAccordion — from chiesa-san-marco@0.1.0.
 */
export interface FooterAccordionProps {
title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  /** Drops the bottom divider, for the last row in a stack. */
  isLast?: boolean;
}

export declare const FooterAccordion: React.ComponentType<FooterAccordionProps>;
