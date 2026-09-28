import { G, Line as SvgLine, Rect } from 'react-native-svg';
import { useCSSVariable } from 'uniwind';
import { useHeatmap, type HeatmapCell, type Slot } from './context';

export interface HeatmapCellsProps {
  /** Corner radius of a cell. Falls back to the chart's. */
  cornerRadius?: number;
  /**
   * Per-cell override on top of the ramp — for cell states the count can't
   * carry (a frozen day, today, the future). Return `undefined` to keep the
   * ramp's paint.
   */
  cellStyle?: (cell: HeatmapCell) => HeatmapCellStyle | undefined;
}

export interface HeatmapCellStyle {
  fill?: string;
  fillOpacity?: number;
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
}

/**
 * The grid itself. Every row of every column is drawn, including the ones with
 * nothing in them — a calendar with holes in it stops being a calendar.
 */
export function HeatmapCells({ cornerRadius, cellStyle }: HeatmapCellsProps) {
  const chart = useHeatmap('HeatmapChart.Cells');
  const { grid, data, ramp, opacities, levelOf, activeCell, inactiveOpacity } = chart;
  const radius = cornerRadius ?? chart.cornerRadius;
  const step = grid.size + grid.gap;

  return (
    <G>
      {data.map((column, columnIndex) =>
        Array.from({ length: grid.rows }, (_unused, row) => {
          const bin = column.bins.find((candidate) => candidate.bin === row);
          const count = bin?.count ?? 0;
          const level = levelOf(count);
          const dimmed =
            activeCell !== null &&
            !(activeCell.column === columnIndex && activeCell.row === row);
          const override = cellStyle?.({ column: columnIndex, row, count, level, date: bin?.date });

          return (
            <Rect
              key={`${column.bin}-${row}`}
              x={columnIndex * step}
              y={row * step}
              width={grid.size}
              height={grid.size}
              rx={radius}
              ry={radius}
              fill={override?.fill ?? ramp[level]}
              fillOpacity={(override?.fillOpacity ?? opacities[level]!) * (dimmed ? inactiveOpacity : 1)}
              stroke={override?.stroke}
              strokeWidth={override?.strokeWidth}
              strokeDasharray={override?.strokeDasharray}
            />
          );
        })
      )}
    </G>
  );
}
HeatmapCells.slot = 'cells' as Slot;

/* -------------------------------------------------------------------------- */
/* Rules                                                                      */
/* -------------------------------------------------------------------------- */

export interface HeatmapSeparatorProps {
  /**
   * `quarter` draws a rule every thirteen columns; a number draws one every
   * that many columns.
   */
  every?: 'quarter' | number;
  color?: string;
  /** Dash pattern, e.g. `"2,4"`. Omit for a solid rule. */
  dashArray?: string;
}

/** Vertical rules grouping the columns — quarters, months, sprints. */
export function HeatmapSeparator({ every = 'quarter', color, dashArray }: HeatmapSeparatorProps) {
  const { grid } = useHeatmap('HeatmapChart.Separator');
  const token = useCSSVariable('--color-border');
  const stroke = color ?? (typeof token === 'string' ? token : 'rgba(128,128,128,0.3)');
  const interval = every === 'quarter' ? 13 : every;
  const step = grid.size + grid.gap;

  if (interval <= 0) return null;

  const lines: number[] = [];
  for (let column = interval; column < grid.columns; column += interval) {
    lines.push(column);
  }

  return (
    <G>
      {lines.map((column) => {
        const x = column * step - grid.gap / 2;
        return (
          <SvgLine
            key={column}
            x1={x}
            y1={0}
            x2={x}
            y2={grid.height}
            stroke={stroke}
            strokeWidth={1}
            strokeDasharray={dashArray}
          />
        );
      })}
    </G>
  );
}
HeatmapSeparator.slot = 'rules' as Slot;
