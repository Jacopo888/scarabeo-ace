import { TILE_DISTRIBUTION } from '../../../src/types/game'
import { validateMoveLogic } from '../../../src/utils/moveValidation'
import { findNewWordsFormed } from '../../../src/utils/newWordFinder'
import { calculateNewMoveScore } from '../../../src/utils/newScoring'

interface Tile {
  letter: string
  points: number
  isBlank?: boolean
}

interface PlacedTile extends Tile {
  row: number
  col: number
}

interface RushMove {
  tiles: PlacedTile[]
  words: string[]
  score: number
}

interface RushPuzzle {
  id: string
  board: PlacedTile[]  // Only occupied cells
  rack: Tile[]
  topMoves: RushMove[]
}

// TWL06 basic word list for server-side validation
const BASIC_WORD_LIST = new Set([
  'THE', 'AND', 'FOR', 'ARE', 'BUT', 'NOT', 'YOU', 'ALL', 'CAN', 'HER', 'WAS', 'ONE', 'OUR', 'HAD', 'DAY', 'GET', 'HAS', 'HIM', 'HIS', 'HOW', 'ITS', 'NEW', 'NOW', 'OLD', 'SEE', 'TWO', 'WHO', 'BOY', 'DID', 'HAS', 'LET', 'PUT', 'SAY', 'SHE', 'TOO', 'USE',
  'QUIZ', 'FIZZ', 'BUZZ', 'JAZZ', 'FOXY', 'COZY', 'WAXY', 'ZEST', 'APEX', 'JINX', 'QUAY', 'OXIDE', 'PROXY', 'BLITZ', 'WALTZ', 'ZEBRA', 'DOZEN', 'FUZZY', 'JAZZY', 'DIZZY', 'PIZZA', 'PRIZE', 'FROZE', 'MAIZE', 'BRONZE', 'ENZYME', 'QUARTZ', 'WIZARD', 'OXYGEN', 'ZEPHYR',
  'ACE', 'ACT', 'ADD', 'AGE', 'AID', 'AIM', 'AIR', 'ART', 'ASK', 'ATE', 'BIG', 'BIT', 'BOX', 'BUY', 'CAR', 'CUT', 'DOG', 'EAR', 'EAT', 'EGG', 'END', 'EYE', 'FAR', 'FEW', 'FIT', 'FLY', 'GOT', 'GUN', 'HAT', 'HIT', 'HOT', 'ICE', 'JOB', 'KEY', 'LAY', 'LEG', 'LIE', 'LOT', 'LOW', 'MAN', 'MAP', 'MAY', 'MEN', 'MET', 'MIX', 'OIL', 'PAY', 'PEN', 'PET', 'PIG', 'PIT', 'RAN', 'RAT', 'RED', 'RUN', 'SAT', 'SET', 'SIX', 'SKY', 'SUN', 'TEN', 'TOP', 'TRY', 'WAR', 'WAY', 'WET', 'WIN', 'YES', 'YET', 'ZOO',
  'ABLE', 'BACK', 'BALL', 'BANK', 'BASE', 'BEAR', 'BEAT', 'BEEN', 'BELL', 'BEST', 'BIRD', 'BLOW', 'BLUE', 'BOAT', 'BODY', 'BOOK', 'BORN', 'BOTH', 'BOYS', 'CAME', 'CALL', 'CARE', 'CASE', 'CITY', 'CLUB', 'COLD', 'COME', 'COOL', 'CORN', 'COST', 'CREW', 'DARK', 'DATA', 'DAYS', 'DEAL', 'DESK', 'DOOR', 'DOWN', 'DREW', 'EACH', 'EAST', 'EASY', 'EVEN', 'EVER', 'FACE', 'FACT', 'FAIR', 'FALL', 'FARM', 'FAST', 'FEAR', 'FEEL', 'FEET', 'FELL', 'FELT', 'FILE', 'FILL', 'FIND', 'FINE', 'FIRE', 'FISH', 'FIVE', 'FLAT', 'FLEW', 'FOOD', 'FOOT', 'FORM', 'FOUR', 'FREE', 'FROM', 'FULL', 'GAME', 'GAVE', 'GIRL', 'GIVE', 'GOES', 'GOLD', 'GONE', 'GOOD', 'GREW', 'HAIR', 'HALF', 'HALL', 'HAND', 'HARD', 'HEAD', 'HEAR', 'HEAT', 'HELD', 'HELP', 'HERE', 'HIGH', 'HOLD', 'HOME', 'HOPE', 'HOUR', 'HUGE', 'IDEA', 'INTO', 'ITEM', 'JOIN', 'JUST', 'KEEP', 'KEPT', 'KIND', 'KNEW', 'KNOW', 'LAND', 'LAST', 'LATE', 'LEAD', 'LEFT', 'LESS', 'LIFE', 'LINE', 'LIVE', 'LOAN', 'LONG', 'LOOK', 'LORD', 'LOSE', 'LOST', 'LOVE', 'MADE', 'MAIL', 'MAIN', 'MAKE', 'MANY', 'MARK', 'MASS', 'MEAL', 'MEAN', 'MEET', 'MIND', 'MISS', 'MODE', 'MOON', 'MORE', 'MOST', 'MOVE', 'NAME', 'NEAR', 'NEED', 'NEXT', 'NICE', 'NOON', 'NOTE', 'ONCE', 'ONLY', 'OPEN', 'OVER', 'PACE', 'PAGE', 'PAID', 'PAIR', 'PARK', 'PART', 'PASS', 'PAST', 'PATH', 'PICK', 'PLAN', 'PLAY', 'POOL', 'POOR', 'PULL', 'PUSH', 'RACE', 'RAIN', 'RATE', 'READ', 'REAL', 'ROLE', 'ROOM', 'RULE', 'SAFE', 'SAID', 'SALE', 'SAME', 'SAVE', 'SEAT', 'SEEM', 'SELF', 'SELL', 'SEND', 'SENT', 'SHIP', 'SHOP', 'SHOW', 'SHUT', 'SICK', 'SIDE', 'SIGN', 'SIZE', 'SLOW', 'SNOW', 'SOFT', 'SOIL', 'SOLD', 'SOME', 'SONG', 'SOON', 'SORT', 'SPOT', 'STAR', 'STAY', 'STEP', 'STOP', 'SUCH', 'SURE', 'TAKE', 'TALK', 'TALL', 'TAPE', 'TASK', 'TEAM', 'TELL', 'TERM', 'TEST', 'TEXT', 'THAN', 'THAT', 'THEM', 'THEN', 'THEY', 'THIN', 'THIS', 'TIME', 'TOLD', 'TONE', 'TOOK', 'TOOL', 'TOWN', 'TREE', 'TRUE', 'TURN', 'TYPE', 'UNIT', 'USED', 'USER', 'VARY', 'VERY', 'VIEW', 'VOTE', 'WAIT', 'WALK', 'WALL', 'WANT', 'WARM', 'WASH', 'WAVE', 'WAYS', 'WEAR', 'WEEK', 'WELL', 'WENT', 'WERE', 'WEST', 'WHAT', 'WHEN', 'WIDE', 'WIFE', 'WILD', 'WILL', 'WIND', 'WISE', 'WISH', 'WITH', 'WORD', 'WORK', 'YARD', 'YEAR', 'YOUR'
])

function isValidWord(word: string): boolean {
  return BASIC_WORD_LIST.has(word.toUpperCase())
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array]
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  return shuffled
}

function generateInitialBoard(tileBag: Tile[]): { board: Map<string, PlacedTile>, usedTiles: number } {
  const board = new Map<string, PlacedTile>()
  let usedTiles = 0

  // Start with a word at center
  const centerWords = ['GAME', 'PLAY', 'WORD', 'QUIZ', 'STAR']
  const word = centerWords[Math.floor(Math.random() * centerWords.length)]
  
  const startCol = 7 - Math.floor(word.length / 2)
  for (let i = 0; i < word.length; i++) {
    const letter = word[i]
    const tileIndex = tileBag.findIndex(t => t.letter === letter)
    if (tileIndex >= 0) {
      const tile = tileBag.splice(tileIndex, 1)[0]
      board.set(`7,${startCol + i}`, {
        ...tile,
        letter,
        row: 7,
        col: startCol + i
      })
      usedTiles++
    }
  }

  // Add 1-2 more crossing words
  const crossingAttempts = [
    { row: 5, col: 7, word: 'CAT', direction: 'vertical' },
    { row: 9, col: 7, word: 'DOG', direction: 'vertical' },
    { row: 7, col: 5, word: 'TOP', direction: 'horizontal' }
  ]

  for (const attempt of crossingAttempts.slice(0, 2)) {
    if (Math.random() > 0.5) continue // Randomly skip some
    
    let canPlace = true
    const positions: Array<{row: number, col: number, letter: string}> = []
    
    for (let i = 0; i < attempt.word.length; i++) {
      const row = attempt.direction === 'vertical' ? attempt.row + i : attempt.row
      const col = attempt.direction === 'horizontal' ? attempt.col + i : attempt.col
      
      const existing = board.get(`${row},${col}`)
      if (existing && existing.letter !== attempt.word[i]) {
        canPlace = false
        break
      }
      
      if (!existing) {
        positions.push({ row, col, letter: attempt.word[i] })
      }
    }
    
    if (canPlace) {
      for (const pos of positions) {
        const tileIndex = tileBag.findIndex(t => t.letter === pos.letter)
        if (tileIndex >= 0) {
          const tile = tileBag.splice(tileIndex, 1)[0]
          board.set(`${pos.row},${pos.col}`, {
            ...tile,
            letter: pos.letter,
            row: pos.row,
            col: pos.col
          })
          usedTiles++
        }
      }
    }
  }

  return { board, usedTiles }
}

function generateTopMoves(board: Map<string, PlacedTile>, rack: Tile[]): RushMove[] {
  const moves: RushMove[] = []
  
  // Generate all possible moves using simplified bot logic
  const adjacentPositions = findAdjacentPositions(board)
  
  for (const [row, col] of adjacentPositions) {
    // Try placing tiles horizontally and vertically
    for (const direction of ['horizontal', 'vertical']) {
      for (let length = 1; length <= Math.min(rack.length, 7); length++) {
        const permutations = generatePermutations(rack, length)
        
        for (const perm of permutations.slice(0, 20)) { // Limit for performance
          const tiles: PlacedTile[] = []
          
          for (let i = 0; i < length; i++) {
            const newRow = direction === 'vertical' ? row + i : row
            const newCol = direction === 'horizontal' ? col + i : col
            
            if (newRow < 0 || newRow >= 15 || newCol < 0 || newCol >= 15) break
            if (board.has(`${newRow},${newCol}`)) continue
            
            tiles.push({
              ...perm.tiles[i],
              row: newRow,
              col: newCol
            })
          }
          
          if (tiles.length === length) {
            // Validate move
            const validation = validateMoveLogic(board, tiles)
            if (validation.isValid) {
              const words = findNewWordsFormed(board, tiles)
              if (words.length > 0 && words.every(w => isValidWord(w.word))) {
                const score = calculateNewMoveScore(words, tiles)
                if (score >= 30) { // Minimum score threshold
                  moves.push({
                    tiles: [...tiles],
                    words: words.map(w => w.word),
                    score
                  })
                }
              }
            }
          }
        }
      }
    }
  }
  
  // Sort by score and return top 5
  return moves
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
}

function findAdjacentPositions(board: Map<string, PlacedTile>): Array<[number, number]> {
  const adjacent = new Set<string>()
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]]
  
  for (const [key] of board) {
    const [row, col] = key.split(',').map(Number)
    for (const [dr, dc] of directions) {
      const newRow = row + dr
      const newCol = col + dc
      if (newRow >= 0 && newRow < 15 && newCol >= 0 && newCol < 15) {
        if (!board.has(`${newRow},${newCol}`)) {
          adjacent.add(`${newRow},${newCol}`)
        }
      }
    }
  }
  
  return Array.from(adjacent).map(key => {
    const [row, col] = key.split(',').map(Number)
    return [row, col] as [number, number]
  })
}

function generatePermutations(rack: Tile[], length: number): Array<{ tiles: Tile[], indices: number[] }> {
  const results: Array<{ tiles: Tile[], indices: number[] }> = []
  
  const backtrack = (currentTiles: Tile[], currentIndices: number[], usedIndices: Set<number>) => {
    if (currentTiles.length === length) {
      results.push({ tiles: [...currentTiles], indices: [...currentIndices] })
      return
    }
    
    for (let i = 0; i < rack.length; i++) {
      if (!usedIndices.has(i)) {
        usedIndices.add(i)
        currentTiles.push(rack[i])
        currentIndices.push(i)
        backtrack(currentTiles, currentIndices, usedIndices)
        currentTiles.pop()
        currentIndices.pop()
        usedIndices.delete(i)
      }
    }
  }
  
  backtrack([], [], new Set())
  return results.slice(0, 50) // Limit for performance
}

export function generateRushPuzzle(): RushPuzzle {
  const id = `puzzle_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  let attempts = 0
  const maxAttempts = 10
  
  while (attempts < maxAttempts) {
    const tileBag = shuffleArray([...TILE_DISTRIBUTION])
    const { board, usedTiles } = generateInitialBoard(tileBag)
    
    // Generate rack from remaining tiles
    const rack = tileBag.splice(0, 7)
    
    // Calculate top moves
    const topMoves = generateTopMoves(board, rack)
    
    if (topMoves.length >= 3 && topMoves[0].score >= 50) {
      // Convert board to array format for API response
      const boardArray: PlacedTile[] = Array.from(board.values())
      
      return {
        id,
        board: boardArray,
        rack: shuffleArray(rack),
        topMoves
      }
    }
    
    attempts++
  }
  
  // Fallback: generate basic puzzle
  const tileBag = shuffleArray([...TILE_DISTRIBUTION])
  const { board } = generateInitialBoard(tileBag)
  const rack = tileBag.splice(0, 7)
  
  return {
    id: `fallback_${Date.now()}`,
    board: Array.from(board.values()),
    rack: shuffleArray(rack),
    topMoves: [{
      tiles: Array.from(board.values()).slice(0, 2),
      words: ['WORD'],
      score: 50
    }]
  }
}