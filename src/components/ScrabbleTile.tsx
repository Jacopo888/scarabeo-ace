import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"

interface ScrabbleTileProps {
  letter: string
  points: number
  isSelected?: boolean
  isBlank?: boolean
  isOnBoard?: boolean
  isDragging?: boolean
  onSelect?: () => void
  onDragStart?: (e: React.DragEvent) => void
  onDragEnd?: (e: React.DragEvent) => void
  className?: string
}

export const ScrabbleTile = ({
  letter,
  points,
  isSelected = false,
  isBlank = false,
  isOnBoard = false,
  isDragging = false,
  onSelect,
  onDragStart,
  onDragEnd,
  className
}: ScrabbleTileProps) => {
  const isMobile = useIsMobile()
  return (
    <div
      className={cn(
        "w-12 h-12 bg-tile border-2 border-tile-text rounded-md flex flex-col items-center justify-center transition-all shadow-md select-none",
        !isOnBoard && "cursor-grab hover:scale-105",
        isOnBoard && "cursor-pointer",
        isSelected && "border-primary bg-primary/10",
        isDragging && "opacity-50 cursor-grabbing",
        isBlank && "bg-yellow-100",
        className
      )}
      draggable={!isOnBoard && !isMobile}
      onClick={onSelect}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
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