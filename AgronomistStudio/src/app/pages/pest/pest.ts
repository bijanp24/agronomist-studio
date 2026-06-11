import { Component, inject, signal, computed, effect, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { PestStore } from '../../core/store/pest.store';
import { PestPcaApi } from '../../core/services/api/pest-pca.api';
import { ToastService } from '../../shared/services/toast/toast.service';
import { PestObservation, SprayRecommendation, PesticideUseReport, SprayRecommendationMaterial, Field } from 'shared';

// Import UI Kit
import { StatCardComponent, BadgeComponent, SkeletonComponent, DataTableComponent, ModalComponent } from '../../shared';

export interface FormattedSprayRecommendation extends SprayRecommendation {
  fieldName: string;
  crop: string;
  materialNames: string;
}

export interface FormattedPesticideUseReport extends PesticideUseReport {
  fieldName: string;
  crop: string;
}

@Component({
  selector: 'app-pest',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    StatCardComponent,
    BadgeComponent,
    SkeletonComponent,
    DataTableComponent,
    ModalComponent
  ],
  templateUrl: './pest.html'
})
export default class PestPage implements OnInit {
  protected readonly pestStore = inject(PestStore);
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);
  private readonly pestPcaApi = inject(PestPcaApi);
  private readonly toastService = inject(ToastService);
  private readonly fb = inject(FormBuilder);

  // Core API dataset cache signals
  protected readonly pestObservations = this.pestStore.pestObservations;
  protected readonly sprayRecommendations = this.pestStore.sprayRecommendations;
  protected readonly pesticideUseReports = this.pestStore.pesticideUseReports;
  protected readonly loading = this.pestStore.isLoading;

  // Detail Modal inspection states
  protected readonly selectedRecommendation = signal<FormattedSprayRecommendation | null>(null);
  protected readonly isDetailModalOpen = signal<boolean>(false);

  // New Draft modal form states
  protected recForm!: FormGroup;
  protected readonly isAddModalOpen = signal<boolean>(false);
  protected readonly prescribedMaterials = signal<SprayRecommendationMaterial[]>([]);
  protected readonly activeEpaNumber = signal<string>('279-9611'); // Default to Altacor EPA

  // static EPA Product database reference
  private readonly epaProductDB: Record<string, { epa: string; active: string; rei: number; phi: number; rate: string }> = {
    Altacor: { epa: '279-9611', active: 'Chlorantraniliprole', rei: 4, phi: 14, rate: '4.0 oz/ac' },
    'Intrepid 2F': { epa: '62719-442', active: 'Methoxyfenozide', rei: 4, phi: 14, rate: '12.0 oz/ac' },
    'Sivanto Prime': { epa: '264-1141', active: 'Flupyradifurone', rei: 12, phi: 7, rate: '10.0 oz/ac' },
    Vanguard: { epa: '100-828', active: 'Cyprodinil', rei: 12, phi: 2, rate: '5.0 oz/ac' }
  };

  // Data table columns
  protected readonly recColumns = [
    { key: 'fieldName', label: 'Field boundary', sortable: true },
    { key: 'pestTarget', label: 'Target Pest Program', sortable: true },
    { key: 'pcaName', label: 'Advisor Order', sortable: true },
    { key: 'status', label: 'Approval Status', sortable: true },
    { key: 'createdAt', label: 'Drafted Timestamp', sortable: true }
  ];

  constructor() {
    this.initRecForm();

    // Re-evaluate collections when global selected ranch changes
    effect(() => {
      const ranchId = this.ranchStore.selectedRanchId();
      this.loadPestDiagnostics(ranchId);
    });
  }

  ngOnInit() {
    const ranchId = this.ranchStore.selectedRanchId();
    this.loadPestDiagnostics(ranchId);
  }

  private loadPestDiagnostics(ranchId: string | null) {
    this.pestStore.loadPestDiagnostics(ranchId);
  }

  // --- Dynamic Search & Filter computations ---

  private readonly activeFieldIds = computed(() => {
    return new Set(this.fieldStore.fields().map(f => f.id));
  });

  // Mapped Observation listings
  protected readonly formattedObservations = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.pestObservations()
      .filter(o => activeIds.has(o.fieldId))
      .map(o => {
        const field = fields.find(f => f.id === o.fieldId);
        return {
          ...o,
          fieldName: field ? field.name : 'Unknown Field',
          crop: field ? field.crop : 'Unknown Crop'
        };
      });
  });

  // Mapped Written Recommendations listings
  protected readonly formattedRecommendations = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.sprayRecommendations()
      .filter(r => activeIds.has(r.fieldId))
      .map(r => {
        const field = fields.find(f => f.id === r.fieldId);
        return {
          ...r,
          fieldName: field ? field.name : 'Unknown Field',
          crop: field ? field.crop : 'Unknown Crop',
          materialNames: r.materials.map(m => m.tradeName).join(', ')
        } as FormattedSprayRecommendation;
      });
  });

  // Mapped DPR PUR Compliance listings
  protected readonly formattedPurs = computed(() => {
    const fields = this.fieldStore.fields();
    const activeIds = this.activeFieldIds();

    return this.pesticideUseReports()
      .filter(p => activeIds.has(p.fieldId))
      .map(p => {
        const field = fields.find(f => f.id === p.fieldId);
        return {
          ...p,
          fieldName: field ? field.name : 'Unknown Field',
          crop: field ? field.crop : 'Unknown Crop'
        } as FormattedPesticideUseReport;
      })
      .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate));
  });

  // --- Dynamic metrics bar computations ---

  protected readonly pendingRecsCount = computed(() => {
    return this.formattedRecommendations().filter(r => r.status === 'draft').length;
  });

  protected readonly pendingRecsValue = computed(() => {
    const count = this.pendingRecsCount();
    return `${count} Written Order${count === 1 ? '' : 's'}`;
  });

  protected readonly pendingPursCount = computed(() => {
    return this.formattedPurs().filter(p => p.status === 'pending-submission').length;
  });

  protected readonly pendingPursValue = computed(() => {
    const count = this.pendingPursCount();
    return `${count} PUR Pending`;
  });

  protected readonly submittedPursTrend = computed(() => {
    const count = this.formattedPurs().filter(p => p.status === 'submitted').length;
    return `${count} filed reports submitted`;
  });

  protected readonly highPestsCount = computed(() => {
    return this.formattedObservations().filter(o => o.status === 'above-threshold').length;
  });

  protected readonly highPestsValue = computed(() => {
    const count = this.highPestsCount();
    return `${count} Severe Alert${count === 1 ? '' : 's'}`;
  });

  protected readonly treatedAcresValue = computed(() => {
    const total = this.formattedRecommendations()
      .filter(r => r.status === 'applied')
      .reduce((acc, r) => acc + r.totalTreatedAcres, 0);
    return `${total.toLocaleString()} season ac`;
  });

  // --- Observation inspect actions ---

  protected openRecommendationDetail(rec: FormattedSprayRecommendation) {
    this.selectedRecommendation.set(rec);
    this.isDetailModalOpen.set(true);
  }

  protected closeRecommendationDetail() {
    this.isDetailModalOpen.set(false);
    setTimeout(() => this.selectedRecommendation.set(null), 300);
  }

  // Signs a draft recommendation, approving the spray material list
  protected approveRecommendation(rec: FormattedSprayRecommendation) {
    this.pestPcaApi.updateSprayRecommendation(rec.id, { status: 'approved' }).subscribe({
      next: (updatedRec) => {
        this.toastService.success(`PCA Material Recommendation signed & approved! Submission logged.`);
        this.closeRecommendationDetail();
        this.pestStore.updateSprayRecommendation(updatedRec);
      },
      error: () => {
        this.toastService.danger('Failed to sign material order. Please retry.');
      }
    });
  }

  // Executes treatment, creating a pending PUR compliance record legally required in California
  protected logApplicationAndCreatePur(rec: FormattedSprayRecommendation) {
    this.pestPcaApi.updateSprayRecommendation(rec.id, { status: 'applied', appliedAt: new Date().toISOString() }).subscribe({
      next: (updatedRec) => {
        // Automatically draft corresponding Pesticide Use Report (PUR) matching California DPR
        const permitMapping: Record<string, string> = {
          Fresno: 'FRESNO-10-8812',
          Kern: 'KERN-34-99812',
          Yolo: 'YOLO-57-6112'
        };

        const countyCodeMapping: Record<string, string> = {
          Fresno: '10',
          Kern: '15',
          Yolo: '57'
        };

        const field = this.fieldStore.fields().find(f => f.id === rec.fieldId);
        const county = field ? field.county : 'Fresno';

        // Add 1 PUR report per material prescribed in recommendation
        const purPayloads = rec.materials.map(m => {
          // Calculate amount applied = Rate * treated acres (rate.g. "4 oz/ac" -> 4 * 80)
          const rateVal = parseFloat(m.ratePerAcre) || 4;
          const amt = rateVal * rec.totalTreatedAcres;

          return {
            fieldId: rec.fieldId,
            recommendationId: rec.id,
            operatorName: 'AgSpray Operators LLC',
            permitNumber: permitMapping[county] || 'CA-DPR-REG-991',
            countyCode: countyCodeMapping[county] || '10',
            applicationDate: new Date().toISOString().substring(0, 10),
            materialName: m.tradeName,
            epaRegNumber: m.epaRegNumber,
            totalAmountApplied: amt,
            unit: m.tradeName.includes('WG') || m.tradeName.includes('Altacor') ? 'oz' as const : 'gals' as const,
            treatedAcres: rec.totalTreatedAcres
          };
        });

        // Submit PURs in sequence
        const purSubmissions$ = purPayloads.map(pur => this.pestPcaApi.createPesticideUseReport(pur));
        
        forkJoin(purSubmissions$).subscribe({
          next: (newPurs) => {
            this.toastService.success(`Treatment logged! Pesticide Use Reports successfully drafted for DPR submission.`);
            this.closeRecommendationDetail();
            this.pestStore.updateSprayRecommendation(updatedRec);
            newPurs.forEach(newPur => this.pestStore.addPesticideUseReport(newPur));
          },
          error: (err) => {
            console.error('Failed to automatically draft California PUR reports', err);
            this.toastService.warning(`Treatment logged, but legal PUR compilation failed. Draft manually.`);
          }
        });

      },
      error: () => {
        this.toastService.danger('Failed to execute spray application program.');
      }
    });
  }

  // Submits drafted California Pesticide Use Reports (PUR) legally to county commissioners
  protected submitPurToDpr(pur: PesticideUseReport) {
    this.toastService.info('Submitting compliance document to County Commissioner...');
    
    // Simulate API update to 'submitted'
    const updatedPur = {
      ...pur,
      status: 'submitted' as const,
      submittedAt: new Date().toISOString()
    };

    setTimeout(() => {
      this.pestStore.updatePesticideUseReport(updatedPur);
      this.toastService.success(`DPR Report submitted! Legal record registered under county commissioner system.`);
    }, 800);
  }

  // --- Dynamic Order Drafting form ---

  private initRecForm() {
    this.recForm = this.fb.group({
      fieldId: ['', [Validators.required]],
      pcaName: ['Sara Agronomy', [Validators.required, Validators.minLength(3)]],
      pcaLicense: ['PCA-88741', [Validators.required, Validators.minLength(5)]],
      pestTarget: ['', [Validators.required, Validators.minLength(3)]],
      totalTreatedAcres: [80, [Validators.required, Validators.min(1)]],
      waterVolumeGallonsPerAcre: [100, [Validators.required, Validators.min(5), Validators.max(500)]],
      applicationMethod: ['ground', [Validators.required]]
    });
  }

  protected openAddRecommendationModal() {
    this.isAddModalOpen.set(true);
    // Suggest target pest based on field inventory status
    const criticalField = this.fieldStore.fields().find(f => f.status === 'critical');
    if (criticalField) {
      this.recForm.patchValue({
        fieldId: criticalField.id,
        totalTreatedAcres: criticalField.areaAcres
      });
      // Suggest pest target matching critical
      if (criticalField.crop === 'Pistachios') {
        this.recForm.patchValue({ pestTarget: 'Navel Orangeworm' });
        this.onMaterialProductSelect('Altacor');
      } else if (criticalField.crop === 'Wine Grapes') {
        this.recForm.patchValue({ pestTarget: 'Spider Mites' });
        this.onMaterialProductSelect('Intrepid 2F');
      }
    }
  }

  protected closeAddRecommendationModal() {
    this.isAddModalOpen.set(false);
    this.recForm.reset({
      pcaName: 'Sara Agronomy',
      pcaLicense: 'PCA-88741',
      totalTreatedAcres: 80,
      waterVolumeGallonsPerAcre: 100,
      applicationMethod: 'ground'
    });
    this.prescribedMaterials.set([]);
  }

  protected onFieldChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const fieldId = select.value;
    const field = this.fieldStore.fields().find(f => f.id === fieldId);
    if (field) {
      this.recForm.patchValue({ totalTreatedAcres: field.areaAcres });
    }
  }

  protected onMaterialProductSelect(tradeName: string) {
    const dbRef = this.epaProductDB[tradeName];
    if (dbRef) {
      this.activeEpaNumber.set(dbRef.epa);
    }
  }

  protected addPrescribedMaterial(tradeName: string, rate: string) {
    if (!tradeName || !rate) return;

    const current = this.prescribedMaterials();
    if (current.some(m => m.tradeName === tradeName)) {
      this.toastService.warning(`${tradeName} is already prescribed in this chemical program.`);
      return;
    }

    const dbRef = this.epaProductDB[tradeName];
    if (dbRef) {
      const newMat: SprayRecommendationMaterial = {
        tradeName,
        epaRegNumber: dbRef.epa,
        ratePerAcre: rate,
        activeIngredient: dbRef.active,
        reiHours: dbRef.rei,
        phiDays: dbRef.phi
      };
      this.prescribedMaterials.update(m => [...m, newMat]);
    }
  }

  protected removePrescribedMaterial(index: number) {
    this.prescribedMaterials.update(list => list.filter((_, idx) => idx !== index));
  }

  protected submitRecommendationForm() {
    if (this.recForm.invalid || this.prescribedMaterials().length === 0) return;

    const formVal = this.recForm.value;

    const payload: Omit<SprayRecommendation, 'id' | 'createdAt' | 'status'> = {
      fieldId: formVal.fieldId,
      pcaName: formVal.pcaName,
      pcaLicense: formVal.pcaLicense,
      pestTarget: formVal.pestTarget,
      materials: this.prescribedMaterials(),
      waterVolumeGallonsPerAcre: formVal.waterVolumeGallonsPerAcre,
      totalTreatedAcres: formVal.totalTreatedAcres,
      applicationMethod: formVal.applicationMethod
    };

    this.pestPcaApi.createSprayRecommendation(payload).subscribe({
      next: (newRec) => {
        this.toastService.success(`PCA Treatment Recommendation written successfully! Queued as draft.`);
        this.closeAddRecommendationModal();
        this.pestStore.addSprayRecommendation(newRec);
      },
      error: (err) => {
        console.error('Failed to create PCA written recommendation', err);
        this.toastService.danger('Failed to log PCA order. Check parameters.');
      }
    });
  }

  // --- Styling Badge Helpers ---

  protected getPestBadgeType(status: 'below-threshold' | 'approaching-threshold' | 'above-threshold'): any {
    switch (status) {
      case 'below-threshold': return 'success';
      case 'approaching-threshold': return 'warning';
      case 'above-threshold': return 'danger';
      default: return 'zinc';
    }
  }
}
