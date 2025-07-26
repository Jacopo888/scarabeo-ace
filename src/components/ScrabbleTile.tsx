import { cn } from "@/lib/utils"

interface ScrabbleTileProps {
  letter: string
  points: number
  isSelected?: boolean
  isBlank?: boolean
  onSelect?: () => void
  className?: string
}

export const ScrabbleTile = ({ 
  letter, 
  points, 
  isSelected = false, 
  isBlank = false,
  onSelect,
  className 
}: ScrabbleTileProps) => {
  return (
    <div
      className={cn(
        "w-12 h-12 bg-tile border-2 border-tile-text rounded-md flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 shadow-md",
        isSelected && "border-primary bg-primary/10",
        isBlank && "bg-yellow-100",
        className
      )}
      onClick={onSelect}
    >
      <span className="text-tile-text font-bold text-lg leading-none">
        {letter}
      </span>
      <span className="text-tile-text text-xs leading-none mt-px">
        {points}
      </span>
    </div>
  )
}