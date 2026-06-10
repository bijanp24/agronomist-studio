export interface Position {
  0: number; // lng
  1: number; // lat
  [key: number]: number;
}

export interface PolygonGeometry {
  type: 'Polygon';
  coordinates: Position[][];
}

export interface PointGeometry {
  type: 'Point';
  coordinates: Position;
}
