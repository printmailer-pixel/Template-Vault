export interface Template {
  id: string;
  title: string;
  subject: string;
  message: string;
  source: 'sheet' | 'local';
}

export type SearchTab = 'Title' | 'Subject' | 'Message';
