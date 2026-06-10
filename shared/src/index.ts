export * from './models/geojson';
export * from './models/ranch-field';
export * from './models/scouting';
export * from './models/water';
export * from './models/pest-pca';
export * from './models/nutrients';
export * from './models/crop-planning';
export * from './fixtures';

export interface VersionInfo {
  version: string;
  app: string;
}

export const getVersion = (): VersionInfo => {
  return {
    version: "1.0.0",
    app: "Agronomist Studio"
  };
};
