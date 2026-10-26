import * as React from 'react';

/**
 * ColumnChart — from chiesa-san-marco@0.1.0.
 */
export interface ColumnChartProps {
data: { label: string; fullLabel: string; value: number }[];
  unit: string;
  title: string;
}

export declare const ColumnChart: React.ComponentType<ColumnChartProps>;
