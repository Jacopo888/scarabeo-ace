import { cn } from "@/lib/utils"
import { ScrabbleTile } from "./ScrabbleTile"
import { useState, useEffect, useRef } from "react"
import { BlankTileDialog } from "./BlankTileDialog"

// Definizioni delle caselle speciali
const SPECIAL_SQUARES = {
  // Triple Word Score
  "0,0": "TW", "0,7": "TW", "0,14": "TW",
  "7,0": "TW", "7,14": "TW",
  "14,0": "TW", "14,7": "TW", "14,14": "TW",
  
  // Double Word Score  
  "1,1": "DW", "1,13": "DW",
  "2,2": "DW", "2,12": "DW",
  "3,3": "DW", "3,11": "DW",
  "4,4": "DW", "4,10": "DW",
  "10,4": "DW", "10,10": "DW",
  "11,3": "DW", "11,11": "DW",
  "12,2": "DW", "12,12": "DW",
  "13,1": "DW", "13,13": "DW",
  
  // Triple Letter Score
  "1,5": "TL", "1,9": "TL",
  "5,1": "TL", "5,5": "TL", "5,9": "TL", "5,13": "TL",
  "9,1": "TL", "9,5": "TL", "9,9": "TL", "9,13": "TL",
  "13,5": "TL", "13,9": "TL",
  
  // Double Letter Score
  "0,3": "DL", "0,11": "DL",
  "2,6": "DL", "2,8": "DL",
  "3,0": "DL", "3,7": "DL", "3,14": "DL",
  "6,2": "DL", "6,6": "DL", "6,8": "DL", "6,12": "DL",
  "7,3": "DL", "7,11": "DL",
  "8,2": "DL", "8,6": "DL", "8,8": "DL", "8,12": "DL",
  "11,0": "DL", "11,7": "DL", "11,14": "DL",
  "12,6": "DL", "12,8": "DL",
  "14,3": "DL", "14,11": "DL",
  
  // Star (center)
  "7,7": "STAR"
}

const getSquareColor = (type: string) => {
  switch (type) {
    case "TW": return "bg-triple-word text-white"
    case "DW": return "bg-double-word text-white" 
    case "TL": return "bg-triple-letter text-white"
    case "DL": return "bg-double-letter text-white"
    case "STAR": return "bg-star text-white"
    default: return "bg-tile border-board-border"
  }
}

const getSquareText = (type: string) => {
  switch (type) {
    case "TW": return "3W"
    case "DW": return "2W"
    case "TL": return "3L"
    case "DL": return "2L"
    case "STAR": return "★"
    default: return ""
  }
}

import { PlacedTile } from '@/types/game'

interface ScrabbleBoardProps {
  placedTiles?: Map<string, PlacedTile>
  pendingTiles?: PlacedTile[]
  onTilePlaced?: (row: number, col: number, tile: PlacedTile) => void
  onTilePickup?: (row: number, col: number) => void
  onEmptySquareClick?: (row: number, col: number) => void
  disabled?: boolean
}

export const ScrabbleBoard = ({
  placedTiles = new Map(),
  pendingTiles = [],
  onTilePlaced,
  onTilePickup,
  onEmptySquareClick,
  disabled = false
}: ScrabbleBoardProps) => {
  const [dragOverSquare, setDragOverSquare] = useState<string | null>(null)
  const [blankTileData, setBlankTileData] = useState<{ row: number; col: number; tile: PlacedTile } | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [boardScale, setBoardScale] = useState(1)

  useEffect(() => {
    const updateScale = () => {
      if (!boardRef.current) return
      const boardWidth = boardRef.current.scrollWidth
      const available = window.innerWidth - 32
      const scale = Math.min(1, available / boardWidth)
      setBoardScale(scale)
    }

    updateScale()
    window.addEventListener('resize', updateScale)
    return () => window.removeEventListener('resize', updateScale)
  }, [])
  const handleDrop = (e: React.DragEvent, row: number, col: number) => {
    if (disabled) return
    e.preventDefault()
    setDragOverSquare(null)
    
    const key = `${row},${col}`
    if (placedTiles.has(key) || pendingTiles.some(t => t.row === row && t.col === col)) {
      return // Square already occupied
    }
    
    try {
      const data = JSON.parse(e.dataTransfer.getData("application/json"))
      if (data.source === "rack") {
        const newTile: PlacedTile = {
          letter: data.tile.letter,
          points: data.tile.points,
          isBlank: data.tile.isBlank,
          row,
          col
        }

        if (newTile.isBlank) {
          setBlankTileData({ row, col, tile: newTile })
        } else {
          onTilePlaced?.(row, col, newTile)
        }
      }
    } catch (error) {
      console.error("Failed to parse drop data:", error)
    }
  }

  const handleDragOver = (e: React.DragEvent, key: string) => {
    if (disabled) return
    if (!placedTiles.has(key) && !pendingTiles.some(t => `${t.row},${t.col}` === key)) {
      e.preventDefault()
      setDragOverSquare(key)
    }
  }

  const handleDragLeave = () => {
    setDragOverSquare(null)
  }

  const renderSquare = (row: number, col: number) => {
    const key = `${row},${col}`
    const specialType = SPECIAL_SQUARES[key as keyof typeof SPECIAL_SQUARES]
    const placedTile = placedTiles.get(key)
    const pendingTile = pendingTiles.find(t => t.row === row && t.col === col)
    const currentTile = placedTile || pendingTile
    const isDragOver = dragOverSquare === key
    
    return (
      <div
        key={key}
        className={cn(
          "w-9 h-9 border border-board-border flex items-center justify-center text-xs font-bold transition-all rounded relative",
          getSquareColor(specialType || ""),
          !currentTile && "cursor-pointer",
          isDragOver && "ring-2 ring-primary ring-opacity-50 bg-primary/10",
          pendingTile && "ring-2 ring-yellow-400 bg-yellow-100/20" // Highlight pending tiles
        )}
        onDrop={(e) => handleDrop(e, row, col)}
        onDragOver={(e) => handleDragOver(e, key)}
        onDragLeave={handleDragLeave}
        onClick={() => {
          if (!currentTile && !disabled) {
            onEmptySquareClick?.(row, col)
          }
        }}
      >
        {currentTile ? (
          <div
            onClick={() => {
              if (disabled) return
              // Allow picking up pending tiles only
              if (pendingTile && onTilePickup) {
                onTilePickup(row, col)
              }
            }}
            className={cn(
              pendingTile && "cursor-pointer"
            )}
          >
            <ScrabbleTile
              letter={currentTile.letter}
              points={currentTile.points}
              isBlank={currentTile.isBlank}
              isOnBoard={true}
              className={cn(
                "w-8 h-8 text-[10px]",
                pendingTile && "border-yellow-400 bg-yellow-50 hover:bg-yellow-100" // Style pending tiles differently
              )}
            />
          </div>
        ) : (
          getSquareText(specialType || "")
        )}
      </div>
    )
  }

  return (
    <div
      className={cn(
        "bg-board p-4 rounded-lg shadow-lg max-w-full",
        disabled && "opacity-50 pointer-events-none"
      )}
    >
      <div
        ref={boardRef}
        className="grid grid-cols-15 gap-0.5 bg-board-border p-2 rounded origin-top-left transition-transform"
        style={{ width: 'fit-content', transform: `scale(${boardScale})` }}
      >
        {Array.from({ length: 15 }, (_, row) =>
          Array.from({ length: 15 }, (_, col) => renderSquare(row, col))
        )}
      </div>
      <BlankTileDialog
        open={!!blankTileData}
        onOpenChange={(open) => {
          if (!open) setBlankTileData(null)
        }}
        onSelect={(letter) => {
          if (blankTileData) {
            onTilePlaced?.(blankTileData.row, blankTileData.col, {
              ...blankTileData.tile,
              letter,
            })
            setBlankTileData(null)
          }
        }}
      />
    </div>
  )
}
