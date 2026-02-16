export interface BaseEntity {
  _id: string;
  createdAt: Date;
  updatedAt: Date;
  isDeleted?: boolean;
}

export interface BaseMetrics {
  total: number;
  active: number;
  timeline: TimelineData[];
}

export interface TimelineData {
  date: string;
  count: number;
  type?: string;
}
