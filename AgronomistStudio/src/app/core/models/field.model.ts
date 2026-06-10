export interface Field {
  id: string;
  name: string;
  crop: string;
  areaAcres: number;
  status: 'healthy' | 'needs-attention' | 'critical';
  lastScouted: string;
}
