export const hints = {
  search: ['Your first search', 'Open a promising title and compare its abstract with your question.'],
  paper: ['Your first paper is saved', 'Find it in Library or screen it in Evidence Desk.'],
  screening: ['Screening decision recorded', 'Keep your reason with the paper so you can explain your choice later.'],
  evidence: ['Evidence recorded', 'Keep the page or table alongside the finding. Your interpretation belongs in its own field.'],
  notebook: ['Your notebook has its first entry', 'Link the note to a paper when you want to return to its source.'],
  citation: ['Citation inserted', 'Preview the bibliography and check the authors, year and title against the source.'],
  backup: ['Encrypted backup downloaded', 'Use Check backup file to verify the file with your passphrase. Keep a copy on another device.'],
} as const;
export type Hint = keyof typeof hints;
export function showResearchHint(hint: Hint) {
  window.dispatchEvent(new CustomEvent('atlas-research-hint', {detail:hint}));
}
