import {
  mockRanches,
  mockFields,
  mockScoutingReports,
  mockWeatherSnapshots,
  mockIrrigationEvents,
  mockSoilMoistureReadings,
  mockPestObservations,
  mockSprayRecommendations,
  mockPesticideUseReports,
  mockSoilSamples,
  mockTissueSamples,
  mockNitrogenPlans,
  mockPlantingPlans,
  mockHarvestRecords,
  mockYieldRecords,
  Ranch,
  Field,
  ScoutingReport,
  IrrigationEvent,
  SprayRecommendation,
  PesticideUseReport
} from 'shared';

export class StoreService {
  private static instance: StoreService;

  public ranches: Ranch[] = JSON.parse(JSON.stringify(mockRanches));
  public fields: Field[] = JSON.parse(JSON.stringify(mockFields));
  public scoutingReports: ScoutingReport[] = JSON.parse(JSON.stringify(mockScoutingReports));
  public weatherSnapshots = JSON.parse(JSON.stringify(mockWeatherSnapshots));
  public irrigationEvents: IrrigationEvent[] = JSON.parse(JSON.stringify(mockIrrigationEvents));
  public soilMoistureReadings = JSON.parse(JSON.stringify(mockSoilMoistureReadings));
  public pestObservations = JSON.parse(JSON.stringify(mockPestObservations));
  public sprayRecommendations: SprayRecommendation[] = JSON.parse(JSON.stringify(mockSprayRecommendations));
  public pesticideUseReports: PesticideUseReport[] = JSON.parse(JSON.stringify(mockPesticideUseReports));
  public soilSamples = JSON.parse(JSON.stringify(mockSoilSamples));
  public tissueSamples = JSON.parse(JSON.stringify(mockTissueSamples));
  public nitrogenPlans = JSON.parse(JSON.stringify(mockNitrogenPlans));
  public plantingPlans = JSON.parse(JSON.stringify(mockPlantingPlans));
  public harvestRecords = JSON.parse(JSON.stringify(mockHarvestRecords));
  public yieldRecords = JSON.parse(JSON.stringify(mockYieldRecords));

  private constructor() {}

  public static getInstance(): StoreService {
    if (!StoreService.instance) {
      StoreService.instance = new StoreService();
    }
    return StoreService.instance;
  }
}

export const dbStore = StoreService.getInstance();
