export class ContextCompressor {
  private compressionCount = 0;

  shouldCompact(messageCount: number, threshold: number): boolean {
    return messageCount >= threshold;
  }

  compact(messages: string[]): string[] {
    this.compressionCount++;
    const kept = messages.slice(0, 1);
    const toSummarize = messages.slice(1, -5);
    const recent = messages.slice(-5);

    const summary = this.summarize(toSummarize);

    return [...kept, summary, ...recent];
  }

  private summarize(turns: string[]): string {
    return `[Earlier context compressed: ${turns.length} turns summarized. Use /expand to view full history.]`;
  }

  getCompressionCount(): number {
    return this.compressionCount;
  }
}
