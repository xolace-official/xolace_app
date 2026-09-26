// PROTOTYPE — throwaway (#429). Draws the frozen-day third state over the grid.
import { G, Rect } from 'react-native-svg';
import { useHeatmap } from '@/src/components/ui/heatmap-chart';
import { isSameDay } from '@/src/lib/date';

export function FrozenCells({ dates, color }: { dates: Date[]; color: string }) {
  const { data, grid, cornerRadius } = useHeatmap('FrozenCells');
  const step = grid.size + grid.gap;
  const cells: { column: number; row: number }[] = [];
  data.forEach((column, columnIndex) =>
    column.bins.forEach((bin) => {
      if (dates.some((date) => isSameDay(date, bin.date))) cells.push({ column: columnIndex, row: bin.bin });
    })
  );
  return (
    <G>
      {cells.map(({ column, row }) => (
        <Rect
          key={`${column}-${row}`}
          x={column * step + 1}
          y={row * step + 1}
          width={grid.size - 2}
          height={grid.size - 2}
          rx={cornerRadius}
          fill={color}
          fillOpacity={0.25}
          stroke={color}
          strokeWidth={1.5}
        />
      ))}
    </G>
  );
}
