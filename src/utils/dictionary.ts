// Simplified Italian word dictionary for validation
// In a real app, this would be a more comprehensive dictionary or API call
export const ITALIAN_WORDS = new Set([
  // Common Italian words for testing
  'CIAO', 'CASA', 'GATTO', 'CANE', 'LIBRO', 'VITA', 'AMORE', 'MONDO', 'TEMPO', 'ANNO',
  'GIORNO', 'NOTTE', 'SOLE', 'LUNA', 'MARE', 'MONTAGNA', 'FIUME', 'LAGO', 'BOSCO', 'FIORE',
  'ALBERO', 'ERBA', 'PIETRA', 'FUOCO', 'ACQUA', 'ARIA', 'TERRA', 'CIELO', 'STELLA', 'NUVOLA',
  'VENTO', 'PIOGGIA', 'NEVE', 'GHIACCIO', 'CALDO', 'FREDDO', 'BELLO', 'BRUTTO', 'GRANDE', 'PICCOLO',
  'ALTO', 'BASSO', 'LUNGO', 'CORTO', 'LARGO', 'STRETTO', 'NUOVO', 'VECCHIO', 'GIOVANE', 'RICCO',
  'POVERO', 'BUONO', 'CATTIVO', 'FACILE', 'DIFFICILE', 'FORTE', 'DEBOLE', 'VELOCE', 'LENTO', 'FELICE',
  'TRISTE', 'ROSSO', 'BLU', 'VERDE', 'GIALLO', 'NERO', 'BIANCO', 'GRIGIO', 'ROSA', 'VIOLA',
  'MAMMA', 'PAPA', 'FIGLIO', 'FIGLIA', 'FRATELLO', 'SORELLA', 'NONNO', 'NONNA', 'ZIO', 'ZIA',
  'AMICO', 'AMICA', 'UOMO', 'DONNA', 'BAMBINO', 'BAMBINA', 'RAGAZZO', 'RAGAZZA', 'PERSONA', 'GENTE',
  'MANGIARE', 'BERE', 'DORMIRE', 'CORRERE', 'CAMMINARE', 'PARLARE', 'ASCOLTARE', 'VEDERE', 'GUARDARE', 'SENTIRE',
  'UNO', 'DUE', 'TRE', 'QUATTRO', 'CINQUE', 'SEI', 'SETTE', 'OTTO', 'NOVE', 'DIECI',
  'CHE', 'CHI', 'COSA', 'DOVE', 'QUANDO', 'COME', 'PERCHE', 'QUANTO', 'QUALE', 'CUI',
  'IO', 'TU', 'LUI', 'LEI', 'NOI', 'VOI', 'LORO', 'MIO', 'TUO', 'SUO',
  'IL', 'LA', 'LO', 'GLI', 'LE', 'UN', 'UNA', 'UNO', 'DEL', 'DELLA',
  'DI', 'DA', 'IN', 'CON', 'SU', 'PER', 'TRA', 'FRA', 'SOPRA', 'SOTTO',
  'SI', 'NO', 'FORSE', 'ANCHE', 'ANCORA', 'GIA', 'MAI', 'SEMPRE', 'SPESSO', 'POCO',
  'MOLTO', 'TANTO', 'TUTTO', 'NIENTE', 'QUALCOSA', 'QUALCUNO', 'NESSUNO', 'OGNI', 'ALCUNI', 'PARECCHI'
])

export const isValidWord = (word: string): boolean => {
  return ITALIAN_WORDS.has(word.toUpperCase())
}

export const validateWords = (words: string[]): { valid: string[], invalid: string[] } => {
  const valid: string[] = []
  const invalid: string[] = []
  
  words.forEach(word => {
    if (isValidWord(word)) {
      valid.push(word)
    } else {
      invalid.push(word)
    }
  })
  
  return { valid, invalid }
}