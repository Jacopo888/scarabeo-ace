import { generateRushPuzzle } from '../puzzle'

describe('Rush Puzzle Generator', () => {
  test('should generate a valid puzzle', () => {
    const puzzle = generateRushPuzzle()
    
    expect(puzzle).toHaveProperty('id')
    expect(puzzle).toHaveProperty('board')
    expect(puzzle).toHaveProperty('rack')
    expect(puzzle).toHaveProperty('bestScore')
    
    expect(typeof puzzle.id).toBe('string')
    expect(puzzle.id.length).toBeGreaterThan(0)
  })
  
  test('should generate 5x5 board', () => {
    const puzzle = generateRushPuzzle()
    
    expect(puzzle.board).toHaveLength(5)
    puzzle.board.forEach(row => {
      expect(row).toHaveLength(5)
    })
  })
  
  test('should generate rack with 7 tiles or less', () => {
    const puzzle = generateRushPuzzle()
    
    expect(puzzle.rack.length).toBeLessThanOrEqual(7)
    expect(puzzle.rack.length).toBeGreaterThan(0)
  })
  
  test('should ensure bestScore is at least 40', () => {
    const puzzle = generateRushPuzzle()
    
    expect(puzzle.bestScore).toBeGreaterThanOrEqual(40)
  })
  
  test('rack tiles should have valid letter and points', () => {
    const puzzle = generateRushPuzzle()
    
    puzzle.rack.forEach(tile => {
      expect(typeof tile.letter).toBe('string')
      expect(typeof tile.points).toBe('number')
      expect(tile.points).toBeGreaterThanOrEqual(0)
    })
  })
  
  test('should generate unique puzzle IDs', () => {
    const puzzle1 = generateRushPuzzle()
    const puzzle2 = generateRushPuzzle()
    
    expect(puzzle1.id).not.toBe(puzzle2.id)
  })
})