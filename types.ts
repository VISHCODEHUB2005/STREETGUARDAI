
export type ThreatLevel = 'Low' | 'Medium' | 'High';

export interface Alert {
  id: string;
  lat: number;
  lng: number;
  animal: string;
  behavior: string;
  threat: ThreatLevel;
  timestamp: string;
  residents_notified: number;
  confidence: number;
}

export interface Stats {
  totalAlerts: number;
  bitesPrevented: number;
  activeCameras: number;
  avgResponseTime: string;
}

export interface DetectionBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
  confidence: number;
}
