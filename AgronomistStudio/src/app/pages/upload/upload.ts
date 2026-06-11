import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TransferStore } from '../../core/store/transfer.store';
import { RanchStore } from '../../core/store/ranch.store';
import { FieldStore } from '../../core/store/field.store';
import { ToastService } from '../../shared/services/toast/toast.service';
import { BadgeComponent, DataTableComponent } from '../../shared';
import { ColumnMapping, ImportSession, ValidationError } from 'shared';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    BadgeComponent,
    DataTableComponent
  ],
  templateUrl: './upload.html'
})
export default class UploadPage {
  protected readonly transferStore = inject(TransferStore);
  protected readonly ranchStore = inject(RanchStore);
  protected readonly fieldStore = inject(FieldStore);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);

  // Form states
  protected readonly uploadForm: FormGroup;
  protected readonly fileContent = signal<string>('');
  protected readonly fileName = signal<string>('');
  protected readonly fileType = signal<'csv' | 'geojson' | null>(null);
  protected readonly dragOver = signal<boolean>(false);

  // Mappings mapping states
  protected readonly mappingForm: FormGroup;
  protected readonly isEditingMappings = signal<boolean>(false);
  protected readonly parsedHeaders = signal<string[]>([]);

  // List of standard target systems
  protected readonly sourceSystems = [
    { id: 'JohnDeere', name: 'John Deere Operations Center' },
    { id: 'ClimateFieldView', name: 'Climate FieldView' },
    { id: 'Trimble', name: 'Trimble Ag Software' },
    { id: 'Raven', name: 'Raven Slingshot' },
    { id: 'GISBoundaries', name: 'GIS GeoJSON Boundary Shapefile' },
    { id: 'CompetitorExport', name: 'Standard CSV Competitor Export' },
    { id: 'Custom', name: 'Custom Proprietary Data Portal' },
  ];

  // Canonical fields that can be mapped to
  protected readonly canonicalOptions = [
    { id: 'name', name: 'Field / Block Name' },
    { id: 'areaValue', name: 'Area Size (Acre/Hectare)' },
    { id: 'areaUnit', name: 'Area Unit' },
    { id: 'cropName', name: 'Crop / Commodity Type' },
    { id: 'variety', name: 'Seed / Crop Variety' },
    { id: 'cropYear', name: 'Crop Season / Year' },
    { id: 'operationType', name: 'Operation Activity Type' },
    { id: 'date', name: 'Activity Date' },
    { id: 'notes', name: 'Operational Notes' },
    { id: 'ignore', name: '[ Ignore Column ]' }
  ];

  constructor() {
    this.uploadForm = this.fb.group({
      sourceSystem: ['JohnDeere', Validators.required],
      defaultRanchId: ['', Validators.required],
    });

    this.mappingForm = this.fb.group({});

    // Set default ranch if ranches exist
    const ranches = this.ranchStore.ranches();
    if (ranches.length > 0) {
      this.uploadForm.patchValue({ defaultRanchId: ranches[0].id });
    }
  }

  // Handle Drag & Drop
  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(true);
  }

  protected onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.dragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFileSelected(files[0]);
    }
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const files = input.files;
    if (files && files.length > 0) {
      this.handleFileSelected(files[0]);
    }
  }

  private handleFileSelected(file: File): void {
    this.fileName.set(file.name);
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      this.fileType.set('csv');
    } else if (extension === 'json' || extension === 'geojson') {
      this.fileType.set('geojson');
    } else {
      this.toastService.showError('Invalid file type', 'Please upload a CSV or GeoJSON file.');
      this.resetFile();
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      this.fileContent.set(text);
      this.toastService.showSuccess('File loaded', `${file.name} is ready for processing.`);
      
      if (this.fileType() === 'csv') {
        this.extractCsvHeaders(text);
      }
    };
    reader.onerror = () => {
      this.toastService.showError('Read error', 'Could not read the uploaded file.');
    };
    reader.readAsText(file);
  }

  private extractCsvHeaders(csvText: string): void {
    const firstLine = csvText.split('\n')[0] || '';
    const headers = firstLine.split(',').map(h => h.trim().replace(/"/g, '')).filter(Boolean);
    this.parsedHeaders.set(headers);

    // Initialize mappings mappingForm controls
    const group: Record<string, any> = {};
    
    // Auto-alias matching
    headers.forEach(h => {
      const lower = h.toLowerCase().trim();
      let canonical = 'ignore';
      if (lower.includes('name') || lower === 'field' || lower === 'block') canonical = 'name';
      else if (lower.includes('acres') || lower === 'area' || lower === 'size') canonical = 'areaValue';
      else if (lower.includes('unit')) canonical = 'areaUnit';
      else if (lower.includes('crop') || lower === 'commodity') canonical = 'cropName';
      else if (lower === 'variety' || lower === 'hybrid' || lower === 'cultivar') canonical = 'variety';
      else if (lower === 'year' || lower.includes('season')) canonical = 'cropYear';
      else if (lower.includes('activity') || lower.includes('type') || lower.includes('operation')) canonical = 'operationType';
      else if (lower.includes('date')) canonical = 'date';
      else if (lower.includes('note') || lower.includes('desc')) canonical = 'notes';

      group[h] = [canonical];
    });

    // Re-create the form group
    const controls = this.mappingForm.controls;
    Object.keys(controls).forEach(key => this.mappingForm.removeControl(key));
    
    Object.keys(group).forEach(key => {
      this.mappingForm.addControl(key, this.fb.control(group[key][0]));
    });
  }

  protected resetFile(): void {
    this.fileName.set('');
    this.fileContent.set('');
    this.fileType.set(null);
    this.parsedHeaders.set([]);
    this.isEditingMappings.set(false);
    this.transferStore.resetStore();
  }

  // Handle parsing / validation
  protected processFile(): void {
    if (!this.fileContent()) return;

    const sourceSystemId = this.uploadForm.value.sourceSystem;
    const sourceSystemLabel = this.sourceSystems.find(s => s.id === sourceSystemId)?.name || 'Imported';
    const defaultRanchId = this.uploadForm.value.defaultRanchId;

    // Create session first
    this.transferStore.createSession({ sourceSystem: sourceSystemLabel });

    // After session is created, trigger process
    setTimeout(() => {
      const session = this.transferStore.session();
      if (!session) {
        this.toastService.showError('Session error', 'Could not establish import session on server.');
        return;
      }

      if (this.fileType() === 'csv') {
        // Collect mapping array
        const mappings: ColumnMapping[] = [];
        Object.keys(this.mappingForm.controls).forEach(sourceColumn => {
          const canonicalField = this.mappingForm.get(sourceColumn)?.value;
          if (canonicalField && canonicalField !== 'ignore') {
            mappings.push({ sourceColumn, canonicalField });
          }
        });

        this.transferStore.importCsv({
          importId: session.importId,
          csvText: this.fileContent(),
          defaultFarmId: defaultRanchId,
          mappings
        });
      } else {
        // GeoJSON
        try {
          const geojson = JSON.parse(this.fileContent());
          this.transferStore.importGeoJson({
            importId: session.importId,
            geojson,
            defaultFarmId: defaultRanchId
          });
        } catch (e) {
          this.toastService.showError('JSON Error', 'Invalid GeoJSON syntax in uploaded file.');
        }
      }
    }, 600);
  }

  // Confirm commit
  protected commitImport(): void {
    const session = this.transferStore.session();
    if (!session) return;

    const defaultRanchId = this.uploadForm.value.defaultRanchId;

    this.transferStore.commitSession({
      importId: session.importId,
      defaultRanchId
    });

    // Notify user
    setTimeout(() => {
      const report = this.transferStore.commitReport();
      if (report?.success) {
        this.toastService.showSuccess(
          'Import Committed',
          `Successfully processed ${report.created} fields and ${report.operationsAdded} operational logs.`
        );
        // Sync central state
        this.fieldStore.loadFieldsByRanch(defaultRanchId);
      } else {
        this.toastService.showError('Commit Failed', 'Could not append imported records.');
      }
    }, 1000);
  }

  protected getValidationErrorCount(): number {
    return this.transferStore.session()?.errors?.length ?? 0;
  }

  protected getFieldsCount(): number {
    return this.transferStore.session()?.fields?.length ?? 0;
  }

  protected getOperationsCount(): number {
    return this.transferStore.session()?.operations?.length ?? 0;
  }

  protected navigateToFields(): void {
    const defaultRanchId = this.uploadForm.value.defaultRanchId;
    if (defaultRanchId) {
      this.ranchStore.setSelectedRanch(defaultRanchId);
    }
    this.router.navigate(['/fields']);
  }
}
