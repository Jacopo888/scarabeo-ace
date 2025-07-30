import { ScrabbleTile } from "./ScrabbleTile"
import { useState } from "react"
import { useGameStore, type Tile } from '@/store/game'

interface TileRackProps {
  selectedTiles?: number[]
  onTileSelect?: (index: number) => void
  onTileDragStart?: (index: number, tile: Tile) => void
}

export const TileRack = ({ selectedTiles = [], onTileSelect, onTileDragStart }: TileRackProps) => {
  const rack = useGameStore(s => s.rack)
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null)
  return (
    <div className="bg-secondary p-4 rounded-lg shadow-lg">
      <h3 className="text-sm font-medium text-secondary-foreground mb-3">Your tiles</h3>
      <div className="flex gap-2 justify-center">
        {rack.map((tile, index) => (
          <ScrabbleTile
            key={index}
            letter={tile.letter}
            points={('value' in tile ? (tile as any).value : (tile as any).points) as number}
            isSelected={selectedTiles.includes(index)}
            isDragging={draggingIndex === index}
            onSelect={() => onTileSelect?.(index)}
            onDragStart={(e) => {
              setDraggingIndex(index)
              e.dataTransfer.setData("application/json", JSON.stringify({
                index,
                tile,
                source: "rack" 
              }))
              onTileDragStart?.(index, tile)
            }}
            onDragEnd={() => setDraggingIndex(null)}
          />
        ))}
      </div>
    </div>
  )
}