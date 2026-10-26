import * as React from 'react';

/**
 * RelatedResourceCard — from chiesa-san-marco@0.1.0.
 */
export interface RelatedResourceCardProps {
  href: string;
  tag: string;
  tagColor: "primary" | "accent";
  title: string;
  subtitle?: string;
}

export declare const RelatedResourceCard: React.ComponentType<RelatedResourceCardProps>;
