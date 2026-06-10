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
