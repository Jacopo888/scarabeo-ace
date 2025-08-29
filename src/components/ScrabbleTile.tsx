import { cn } from "@/lib/utils"
import { useIsMobile } from "@/hooks/use-mobile"
import { motion } from "framer-motion"

interface ScrabbleTileProps {
  letter: string
  points: number
  isSelected?: boolean
  isBlank?: boolean
  isOnBoard?: boolean
  isDragging?: boolean
  draggable?: boolean
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
  draggable = !isOnBoard,
  onSelect,
  onDragStart,
  onDragEnd,
  className
}: ScrabbleTileProps) => {
  const isMobile = useIsMobile()
  const displayLetter = isBlank && letter === '' ? '★' : letter
  const displayPoints = isBlank ? '★' : points
  return (
    <motion.div
      layout={!isOnBoard} // Disable layout animations when on board to prevent grid conflicts
      whileHover={!isOnBoard ? { y: -4, scale: 1.05 } : {}}
      whileTap={!isOnBoard ? { scale: 0.95 } : {}} // Disable tap animations on board to prevent position shifts
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        // Responsive dimensions: match board cell sizes
        isOnBoard ? "w-8 h-8 sm:w-9 sm:h-9" : "w-12 h-12",
        "bg-tile rounded-md flex flex-col items-center justify-center select-none",
        // Different transition behavior for on-board vs off-board tiles
        isOnBoard ? "transition-colors" : "transition-all",
        // Use thinner border and smaller shadow on-board to fit in small squares
        isOnBoard ? "border border-tile-text shadow" : "border-2 border-tile-text shadow-md",
        draggable && "cursor-grab",
        !draggable && isOnBoard && "cursor-pointer",
        isSelected && "border-primary bg-primary/10",
        isDragging && "opacity-50 cursor-grabbing",
        isBlank && "bg-yellow-100",
        className
      )}
      draggable={draggable && !isMobile}
      onClick={onSelect}
      onDragStart={onDragStart as any}
      onDragEnd={onDragEnd as any}
    >
      <span
        className={cn(
          "text-tile-text font-bold leading-none",
          // Smaller letter on-board for compact cells
          isOnBoard ? "text-sm" : "text-lg"
        )}
      >
        {displayLetter}
      </span>
      <span
        className={cn(
          "text-tile-text leading-none mt-px",
          // Smaller corner points on-board
          isOnBoard ? "text-[10px]" : "text-xs"
        )}
      >
        {displayPoints}
      </span>
    </motion.div>
  )
}