export interface ContextEntry {
  id?: number;
  name: string;
  content: string;
  tags: string[];
  triggerPattern?: string;
  createdAt: number;
  updatedAt?: number;
  usageCount: number;
}
