/** Shared support types. Each product supplies its own SupportConfig. */
export interface KbEntry {
  id: string;
  title: string;
  
  keywords: string[];
  
  body: string;
  
  source: string;
  
  tags: string[];
}

export interface SupportConfig {
  
  productSlug: string;
  
  productName: string;
  
  feedbackEmail: string;
  
  kb: KbEntry[];
  
  chatHost: string;
  
  complianceDisclaimer?: string;
  
  brandColor?: string;
}
