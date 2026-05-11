export interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  budget?: string;
  location?: string;
  propertyType?: string;
  intent?: 'rent' | 'purchase';
  timeline?: 'immediate' | '1month' | '3months' | '6months' | '1year';
  status: 'new' | 'warm' | 'hot' | 'cold' | 'contacted' | 'converted';
  source: 'chat' | 'voice' | 'form';
  chatSummary?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  metadata?: Record<string, any>;
  createdAt: Date;
}

export interface Chat {
  id: string;
  leadId?: string;
  messages: ChatMessage[];
  title?: string;
  summary?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceCall {
  id: string;
  leadId?: string;
  duration: number;
  transcript?: string;
  summary?: string;
  audioUrl?: string;
  status: 'initiated' | 'in_progress' | 'completed' | 'failed';
  createdAt: Date;
}

export interface KnowledgeBase {
  id: string;
  title: string;
  content: string;
  fileUrl?: string;
  fileType?: 'pdf' | 'docx' | 'text';
  fileSize?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface LucknowArea {
  id: string;
  areaName: string;
  description?: string;
  facilities?: {
    schools?: string[];
    hospitals?: string[];
    malls?: string[];
    metro?: string[];
    railway?: string[];
    airport?: string[];
    businessHubs?: string[];
  };
  priceRange?: string;
  propertyTypes?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface User {
  id: string;
  email: string;
  name?: string;
  role: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
}

export interface RAGResult {
  chunk: string;
  score: number;
  source: string;
}
