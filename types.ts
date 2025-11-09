
export type Theme = 'light' | 'dark';

export interface Query {
  id: string;
  prompt: string;
  image?: string;
  response: string;
  timestamp: Date;
}
