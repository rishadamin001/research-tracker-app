declare module 'citeproc' {
  interface CiteprocSystem {
    retrieveLocale(language: string): string;
    retrieveItem(id: string): Record<string, unknown>;
  }

  interface CiteprocEngine {
    setOutputFormat(format: 'text'): void;
    updateItems(ids: string[]): void;
    makeBibliography(): [{ entry_ids: string[][] }, string[]] | false;
  }

  const CSL: { Engine: new (system: CiteprocSystem, style: string, language: string) => CiteprocEngine };
  export default CSL;
}
