import { cn } from "@/lib/utils"

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

export const ScrabbleBoard = () => {
  const renderSquare = (row: number, col: number) => {
    const key = `${row},${col}`
    const specialType = SPECIAL_SQUARES[key as keyof typeof SPECIAL_SQUARES]
    
    return (
      <div
        key={key}
        className={cn(
          "w-9 h-9 border border-board-border flex items-center justify-center text-xs font-bold cursor-pointer hover:opacity-80 transition-opacity rounded",
          getSquareColor(specialType || "")
        )}
      >
        {getSquareText(specialType || "")}
      </div>
    )
  }

  return (
    <div className="bg-board p-4 rounded-lg shadow-lg">
      <div className="grid grid-cols-15 gap-0.5 bg-board-border p-2 rounded" style={{ width: 'fit-content' }}>
        {Array.from({ length: 15 }, (_, row) =>
          Array.from({ length: 15 }, (_, col) => renderSquare(row, col))
        )}
      </div>
    </div>
  )
}