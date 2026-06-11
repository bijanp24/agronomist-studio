import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { environment } from '../environments/environment';

import { routes } from './app.routes';

// Import abstract tokens
import { RanchesFieldsApi } from './core/services/api/ranches-fields.api';
import { ScoutingApi } from './core/services/api/scouting.api';
import { WaterApi } from './core/services/api/water.api';
import { PestPcaApi } from './core/services/api/pest-pca.api';
import { NutrientsApi } from './core/services/api/nutrients.api';
import { CropPlanningApi } from './core/services/api/crop-planning.api';
import { AgronomyApi } from './core/services/api/agronomy.api';
import { SpatialApi } from './core/services/api/spatial.api';
import { MlApi } from './core/services/api/ml.api';

// Import implementations
import { InMemoryRanchesFieldsService } from './core/services/api/in-memory/in-memory-ranches-fields.service';
import { HttpRanchesFieldsService } from './core/services/api/http/http-ranches-fields.service';

import { InMemoryScoutingService } from './core/services/api/in-memory/in-memory-scouting.service';
import { HttpScoutingService } from './core/services/api/http/http-scouting.service';

import { InMemoryWaterService } from './core/services/api/in-memory/in-memory-water.service';
import { HttpWaterService } from './core/services/api/http/http-water.service';

import { InMemoryPestPcaService } from './core/services/api/in-memory/in-memory-pest-pca.service';
import { HttpPestPcaService } from './core/services/api/http/http-pest-pca.service';

import { InMemoryNutrientsService } from './core/services/api/in-memory/in-memory-nutrients.service';
import { HttpNutrientsService } from './core/services/api/http/http-nutrients.service';

import { InMemoryCropPlanningService } from './core/services/api/in-memory/in-memory-crop-planning.service';
import { HttpCropPlanningService } from './core/services/api/http/http-crop-planning.service';

import { InMemoryAgronomyService } from './core/services/api/in-memory/in-memory-agronomy.service';
import { HttpAgronomyService } from './core/services/api/http/http-agronomy.service';

import { InMemorySpatialService } from './core/services/api/in-memory/in-memory-spatial.service';
import { HttpSpatialService } from './core/services/api/http/http-spatial.service';

import { InMemoryMlService } from './core/services/api/in-memory/in-memory-ml.service';
import { HttpMlService } from './core/services/api/http/http-ml.service';

import { TransferApi } from './core/services/api/transfer.api';
import { InMemoryTransferService } from './core/services/api/in-memory/in-memory-transfer.service';
import { HttpTransferService } from './core/services/api/http/http-transfer.service';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),

    // Swappable API Providers
    {
      provide: RanchesFieldsApi,
      useClass: environment.dataSource === 'http' ? HttpRanchesFieldsService : InMemoryRanchesFieldsService
    },
    {
      provide: ScoutingApi,
      useClass: environment.dataSource === 'http' ? HttpScoutingService : InMemoryScoutingService
    },
    {
      provide: WaterApi,
      useClass: environment.dataSource === 'http' ? HttpWaterService : InMemoryWaterService
    },
    {
      provide: PestPcaApi,
      useClass: environment.dataSource === 'http' ? HttpPestPcaService : InMemoryPestPcaService
    },
    {
      provide: NutrientsApi,
      useClass: environment.dataSource === 'http' ? HttpNutrientsService : InMemoryNutrientsService
    },
    {
      provide: CropPlanningApi,
      useClass: environment.dataSource === 'http' ? HttpCropPlanningService : InMemoryCropPlanningService
    },
    {
      provide: AgronomyApi,
      useClass: environment.dataSource === 'http' ? HttpAgronomyService : InMemoryAgronomyService
    },
    {
      provide: SpatialApi,
      useClass: environment.dataSource === 'http' ? HttpSpatialService : InMemorySpatialService
    },
    {
      provide: MlApi,
      useClass: environment.dataSource === 'http' ? HttpMlService : InMemoryMlService
    },
    {
      provide: TransferApi,
      useClass: environment.dataSource === 'http' ? HttpTransferService : InMemoryTransferService
    }
  ]
};
