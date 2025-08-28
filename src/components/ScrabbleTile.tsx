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
      layout
      whileHover={!isOnBoard ? { y: -4, scale: 1.05 } : {}}
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(
        "w-12 h-12 bg-tile rounded-md flex flex-col items-center justify-center transition-all select-none",
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