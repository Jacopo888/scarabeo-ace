import { ScrabbleTile } from "./ScrabbleTile"

interface Tile {
  letter: string
  points: number
  isBlank?: boolean
}

interface TileRackProps {
  tiles: Tile[]
  selectedTiles?: number[]
  onTileSelect?: (index: number) => void
}

export const TileRack = ({ tiles, selectedTiles = [], onTileSelect }: TileRackProps) => {
  return (
    <div className="bg-secondary p-4 rounded-lg shadow-lg">
      <h3 className="text-sm font-medium text-secondary-foreground mb-3">Le tue tessere</h3>
      <div className="flex gap-2 justify-center">
        {tiles.map((tile, index) => (
          <ScrabbleTile
            key={index}
            letter={tile.letter}
            points={tile.points}
            isBlank={tile.isBlank}
            isSelected={selectedTiles.includes(index)}
            onSelect={() => onTileSelect?.(index)}
          />
        ))}
      </div>
    </div>
  )
}