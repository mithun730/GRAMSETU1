/**
 * CSV Helper & Validator for Gram Panchayat Data Import
 * Supports parsing, validation, and template generation for all Panchayat entities
 */

export interface CsvValidationResult<T> {
  isValid: boolean;
  data: T[];
  errors: string[];
  warnings: string[];
  totalRows: number;
  validRows: number;
}

// 1. Basic RFC 4180 CSV parser
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  // Normalize line endings
  const cleanText = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const nextChar = cleanText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // Skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if (char === '\n' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      // Only push non-empty rows
      if (currentRow.some(c => c.length > 0)) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  // Flush remaining cell/row
  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c.length > 0)) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Helper to convert objects to CSV string
export function objectsToCSV(headers: string[], rows: Record<string, any>[]): string {
  const headerLine = headers.map(h => `"${h.replace(/"/g, '""')}"`).join(',');
  const dataLines = rows.map(row => {
    return headers.map(h => {
      const val = row[h] !== undefined && row[h] !== null ? String(row[h]) : '';
      return `"${val.replace(/"/g, '""')}"`;
    }).join(',');
  });

  return [headerLine, ...dataLines].join('\n');
}

// Trigger browser download of CSV file
export function downloadCSV(filename: string, csvContent: string) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// -------------------------------------------------------------
// Entity-Specific Validators
// -------------------------------------------------------------

export interface FundImportRow {
  scheme_name: string;
  funding_source: string;
  financial_year: string;
  sanctioned_amount: number;
  received_amount: number;
  reference_number: string;
  purpose: string;
  status: 'sanctioned' | 'received' | 'partially_utilized' | 'fully_utilized';
  date_sanctioned?: string;
  date_received?: string;
}

export function validateFundsCSV(rows: string[][]): CsvValidationResult<FundImportRow> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validData: FundImportRow[] = [];

  if (rows.length < 2) {
    return {
      isValid: false,
      data: [],
      errors: ['File is empty or contains only a header line.'],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    };
  }

  const rawHeaders = rows[0].map(h => h.toLowerCase().trim().replace(/[\s_-]+/g, '_'));
  const requiredHeaders = ['scheme_name', 'funding_source', 'financial_year', 'sanctioned_amount', 'received_amount', 'reference_number'];

  for (const req of requiredHeaders) {
    if (!rawHeaders.includes(req)) {
      errors.push(`Missing required column header: "${req}". Please check your CSV format.`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, data: [], errors, warnings, totalRows: rows.length - 1, validRows: 0 };
  }

  const getIdx = (col: string) => rawHeaders.indexOf(col);

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;

    const scheme_name = row[getIdx('scheme_name')] || '';
    const funding_source = row[getIdx('funding_source')] || '';
    const financial_year = row[getIdx('financial_year')] || '2025-2026';
    const rawSanctioned = row[getIdx('sanctioned_amount')] || '';
    const rawReceived = row[getIdx('received_amount')] || '';
    const reference_number = row[getIdx('reference_number')] || `REF-${Date.now()}-${r}`;
    const purpose = (getIdx('purpose') !== -1 ? row[getIdx('purpose')] : '') || scheme_name;
    const rawStatus = (getIdx('status') !== -1 ? row[getIdx('status')] : 'received').toLowerCase();

    if (!scheme_name) {
      errors.push(`Row ${rowNum}: "scheme_name" cannot be empty.`);
    }

    if (!funding_source) {
      errors.push(`Row ${rowNum}: "funding_source" cannot be empty.`);
    }

    // Clean numeric values (remove currency symbols, commas)
    const cleanSanctioned = rawSanctioned.replace(/[₹$,\s]/g, '');
    const cleanReceived = rawReceived.replace(/[₹$,\s]/g, '');

    const sanctioned_amount = parseFloat(cleanSanctioned);
    const received_amount = parseFloat(cleanReceived);

    if (isNaN(sanctioned_amount) || sanctioned_amount < 0) {
      errors.push(`Row ${rowNum}: "sanctioned_amount" must be a valid positive number (got "${rawSanctioned}").`);
    }

    if (isNaN(received_amount) || received_amount < 0) {
      errors.push(`Row ${rowNum}: "received_amount" must be a valid positive number (got "${rawReceived}").`);
    }

    let status: FundImportRow['status'] = 'received';
    if (['sanctioned', 'received', 'partially_utilized', 'fully_utilized'].includes(rawStatus)) {
      status = rawStatus as any;
    }

    if (errors.length === 0 || !errors.some(e => e.startsWith(`Row ${rowNum}:`))) {
      validData.push({
        scheme_name,
        funding_source,
        financial_year,
        sanctioned_amount: isNaN(sanctioned_amount) ? 0 : sanctioned_amount,
        received_amount: isNaN(received_amount) ? 0 : received_amount,
        reference_number,
        purpose,
        status,
        date_sanctioned: getIdx('date_sanctioned') !== -1 ? row[getIdx('date_sanctioned')] : undefined,
        date_received: getIdx('date_received') !== -1 ? row[getIdx('date_received')] : undefined,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    data: validData,
    errors,
    warnings,
    totalRows: rows.length - 1,
    validRows: validData.length,
  };
}

export interface ProjectImportRow {
  name: string;
  name_te?: string;
  category: string;
  location: string;
  ward_number?: number;
  estimated_cost: number;
  approved_amount: number;
  amount_spent: number;
  progress_percentage: number;
  status: 'proposed' | 'approved' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';
  contractor_name?: string;
  description?: string;
  start_date?: string;
  expected_completion_date?: string;
}

export function validateProjectsCSV(rows: string[][]): CsvValidationResult<ProjectImportRow> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validData: ProjectImportRow[] = [];

  if (rows.length < 2) {
    return {
      isValid: false,
      data: [],
      errors: ['File is empty or contains only a header line.'],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    };
  }

  const rawHeaders = rows[0].map(h => h.toLowerCase().trim().replace(/[\s_-]+/g, '_'));
  const requiredHeaders = ['name', 'category', 'location', 'estimated_cost', 'approved_amount'];

  for (const req of requiredHeaders) {
    if (!rawHeaders.includes(req)) {
      errors.push(`Missing required column header: "${req}". Please check your CSV format.`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, data: [], errors, warnings, totalRows: rows.length - 1, validRows: 0 };
  }

  const getIdx = (col: string) => rawHeaders.indexOf(col);

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;

    const name = row[getIdx('name')] || '';
    const name_te = getIdx('name_te') !== -1 ? row[getIdx('name_te')] : undefined;
    const category = row[getIdx('category')] || 'Infrastructure';
    const location = row[getIdx('location')] || '';
    const description = getIdx('description') !== -1 ? row[getIdx('description')] : undefined;
    const contractor_name = getIdx('contractor_name') !== -1 ? row[getIdx('contractor_name')] : undefined;

    const rawEst = row[getIdx('estimated_cost')] || '0';
    const rawAppr = row[getIdx('approved_amount')] || '0';
    const rawSpent = getIdx('amount_spent') !== -1 ? (row[getIdx('amount_spent')] || '0') : '0';
    const rawProgress = getIdx('progress_percentage') !== -1 ? (row[getIdx('progress_percentage')] || '0') : '0';
    const rawWard = getIdx('ward_number') !== -1 ? row[getIdx('ward_number')] : '';
    const rawStatus = (getIdx('status') !== -1 ? row[getIdx('status')] : 'in_progress').toLowerCase();

    if (!name) {
      errors.push(`Row ${rowNum}: Project "name" is required.`);
    }

    if (!location) {
      errors.push(`Row ${rowNum}: Project "location" is required.`);
    }

    const estimated_cost = parseFloat(rawEst.replace(/[₹$,\s]/g, ''));
    const approved_amount = parseFloat(rawAppr.replace(/[₹$,\s]/g, ''));
    const amount_spent = parseFloat(rawSpent.replace(/[₹$,\s]/g, ''));
    const progress_percentage = parseFloat(rawProgress.replace(/[%\s]/g, ''));

    if (isNaN(estimated_cost) || estimated_cost < 0) {
      errors.push(`Row ${rowNum}: "estimated_cost" must be a valid positive number (got "${rawEst}").`);
    }

    if (isNaN(approved_amount) || approved_amount < 0) {
      errors.push(`Row ${rowNum}: "approved_amount" must be a valid positive number (got "${rawAppr}").`);
    }

    if (isNaN(progress_percentage) || progress_percentage < 0 || progress_percentage > 100) {
      errors.push(`Row ${rowNum}: "progress_percentage" must be a number between 0 and 100 (got "${rawProgress}").`);
    }

    let status: ProjectImportRow['status'] = 'in_progress';
    if (['proposed', 'approved', 'in_progress', 'completed', 'on_hold', 'cancelled'].includes(rawStatus)) {
      status = rawStatus as any;
    }

    if (!errors.some(e => e.startsWith(`Row ${rowNum}:`))) {
      validData.push({
        name,
        name_te,
        category,
        location,
        ward_number: rawWard ? parseInt(rawWard) : undefined,
        estimated_cost: isNaN(estimated_cost) ? 0 : estimated_cost,
        approved_amount: isNaN(approved_amount) ? 0 : approved_amount,
        amount_spent: isNaN(amount_spent) ? 0 : amount_spent,
        progress_percentage: isNaN(progress_percentage) ? 0 : progress_percentage,
        status,
        contractor_name,
        description,
        start_date: getIdx('start_date') !== -1 ? row[getIdx('start_date')] : undefined,
        expected_completion_date: getIdx('expected_completion_date') !== -1 ? row[getIdx('expected_completion_date')] : undefined,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    data: validData,
    errors,
    warnings,
    totalRows: rows.length - 1,
    validRows: validData.length,
  };
}

export interface ExpenditureImportRow {
  description: string;
  category: string;
  amount: number;
  expense_date: string;
  vendor_name?: string;
  bill_number?: string;
  payment_mode?: string;
  approval_status: 'pending_approval' | 'approved' | 'rejected';
}

export function validateExpendituresCSV(rows: string[][]): CsvValidationResult<ExpenditureImportRow> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validData: ExpenditureImportRow[] = [];

  if (rows.length < 2) {
    return {
      isValid: false,
      data: [],
      errors: ['File is empty or contains only a header line.'],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    };
  }

  const rawHeaders = rows[0].map(h => h.toLowerCase().trim().replace(/[\s_-]+/g, '_'));
  const requiredHeaders = ['description', 'category', 'amount', 'expense_date'];

  for (const req of requiredHeaders) {
    if (!rawHeaders.includes(req)) {
      errors.push(`Missing required column header: "${req}". Please check your CSV format.`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, data: [], errors, warnings, totalRows: rows.length - 1, validRows: 0 };
  }

  const getIdx = (col: string) => rawHeaders.indexOf(col);

  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1;

    const description = row[getIdx('description')] || '';
    const category = row[getIdx('category')] || 'General Public Works';
    const rawAmount = row[getIdx('amount')] || '';
    const expense_date = row[getIdx('expense_date')] || new Date().toISOString().split('T')[0];
    const vendor_name = getIdx('vendor_name') !== -1 ? row[getIdx('vendor_name')] : undefined;
    const bill_number = getIdx('bill_number') !== -1 ? row[getIdx('bill_number')] : undefined;
    const payment_mode = getIdx('payment_mode') !== -1 ? row[getIdx('payment_mode')] : 'Direct Bank Transfer / PFMS';
    const rawStatus = (getIdx('approval_status') !== -1 ? row[getIdx('approval_status')] : 'approved').toLowerCase();

    if (!description) {
      errors.push(`Row ${rowNum}: "description" cannot be empty.`);
    }

    const amount = parseFloat(rawAmount.replace(/[₹$,\s]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      errors.push(`Row ${rowNum}: "amount" must be a valid positive number (got "${rawAmount}").`);
    }

    let approval_status: ExpenditureImportRow['approval_status'] = 'approved';
    if (['pending_approval', 'approved', 'rejected'].includes(rawStatus)) {
      approval_status = rawStatus as any;
    }

    if (!errors.some(e => e.startsWith(`Row ${rowNum}:`))) {
      validData.push({
        description,
        category,
        amount: isNaN(amount) ? 0 : amount,
        expense_date,
        vendor_name,
        bill_number,
        payment_mode,
        approval_status,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    data: validData,
    errors,
    warnings,
    totalRows: rows.length - 1,
    validRows: validData.length,
  };
}

export interface DemographicsImportRow {
  name: string;
  name_te?: string;
  mandal: string;
  district: string;
  state: string;
  population: number;
  total_wards: number;
  lgd_code?: string;
  sarpanch_name?: string;
  sarpanch_phone?: string;
  secretary_name?: string;
  secretary_phone?: string;
  office_address?: string;
  contact_email?: string;
  pin_code?: string;
}

export function validateDemographicsCSV(rows: string[][]): CsvValidationResult<DemographicsImportRow> {
  const errors: string[] = [];
  const warnings: string[] = [];
  const validData: DemographicsImportRow[] = [];

  if (rows.length < 2) {
    return {
      isValid: false,
      data: [],
      errors: ['File is empty or contains only a header line.'],
      warnings: [],
      totalRows: 0,
      validRows: 0,
    };
  }

  const rawHeaders = rows[0].map(h => h.toLowerCase().trim().replace(/[\s_-]+/g, '_'));
  const requiredHeaders = ['name', 'mandal', 'district', 'state', 'population', 'total_wards'];

  for (const req of requiredHeaders) {
    if (!rawHeaders.includes(req)) {
      errors.push(`Missing required column header: "${req}".`);
    }
  }

  if (errors.length > 0) {
    return { isValid: false, data: [], errors, warnings, totalRows: rows.length - 1, validRows: 0 };
  }

  const getIdx = (col: string) => rawHeaders.indexOf(col);
  const row = rows[1]; // First data row

  const name = row[getIdx('name')] || '';
  const name_te = getIdx('name_te') !== -1 ? row[getIdx('name_te')] : undefined;
  const mandal = row[getIdx('mandal')] || '';
  const district = row[getIdx('district')] || '';
  const state = row[getIdx('state')] || 'Telangana';
  const rawPop = row[getIdx('population')] || '0';
  const rawWards = row[getIdx('total_wards')] || '0';

  if (!name) errors.push('Panchayat "name" is required.');
  if (!mandal) errors.push('Panchayat "mandal" is required.');
  if (!district) errors.push('Panchayat "district" is required.');

  const population = parseInt(rawPop.replace(/[\s,]/g, ''));
  const total_wards = parseInt(rawWards.replace(/[\s,]/g, ''));

  if (isNaN(population) || population < 0) {
    errors.push(`"population" must be a valid positive integer (got "${rawPop}").`);
  }

  if (isNaN(total_wards) || total_wards < 0) {
    errors.push(`"total_wards" must be a valid positive integer (got "${rawWards}").`);
  }

  if (errors.length === 0) {
    validData.push({
      name,
      name_te,
      mandal,
      district,
      state,
      population: isNaN(population) ? 0 : population,
      total_wards: isNaN(total_wards) ? 0 : total_wards,
      lgd_code: getIdx('lgd_code') !== -1 ? row[getIdx('lgd_code')] : undefined,
      sarpanch_name: getIdx('sarpanch_name') !== -1 ? row[getIdx('sarpanch_name')] : undefined,
      sarpanch_phone: getIdx('sarpanch_phone') !== -1 ? row[getIdx('sarpanch_phone')] : undefined,
      secretary_name: getIdx('secretary_name') !== -1 ? row[getIdx('secretary_name')] : undefined,
      secretary_phone: getIdx('secretary_phone') !== -1 ? row[getIdx('secretary_phone')] : undefined,
      office_address: getIdx('office_address') !== -1 ? row[getIdx('office_address')] : undefined,
      contact_email: getIdx('contact_email') !== -1 ? row[getIdx('contact_email')] : undefined,
      pin_code: getIdx('pin_code') !== -1 ? row[getIdx('pin_code')] : undefined,
    });
  }

  return {
    isValid: errors.length === 0,
    data: validData,
    errors,
    warnings,
    totalRows: 1,
    validRows: validData.length,
  };
}

// -------------------------------------------------------------
// Sample Template Downloads
// -------------------------------------------------------------

export function getSampleFundsTemplate(): string {
  const headers = [
    'scheme_name',
    'funding_source',
    'financial_year',
    'sanctioned_amount',
    'received_amount',
    'reference_number',
    'purpose',
    'status',
    'date_sanctioned',
    'date_received'
  ];

  const sampleRows = [
    {
      scheme_name: '15th Finance Commission Untied Grant',
      funding_source: 'Central Government',
      financial_year: '2025-2026',
      sanctioned_amount: 2500000,
      received_amount: 2500000,
      reference_number: 'GO-CFC-2025-01',
      purpose: 'Drinking water pipeline maintenance, CC drainage sanitation, and village street lighting',
      status: 'received',
      date_sanctioned: '2025-04-10',
      date_received: '2025-04-20',
    },
    {
      scheme_name: 'State Finance Commission (SFC) Basic Grant',
      funding_source: 'State Government (Telangana)',
      financial_year: '2025-2026',
      sanctioned_amount: 1500000,
      received_amount: 1500000,
      reference_number: 'GO-SFC-2025-08',
      purpose: 'Internal cement concrete road connectivity and sanitation vehicle fuel allowance',
      status: 'received',
      date_sanctioned: '2025-05-15',
      date_received: '2025-05-25',
    },
  ];

  return objectsToCSV(headers, sampleRows);
}

export function getSampleProjectsTemplate(): string {
  const headers = [
    'name',
    'name_te',
    'category',
    'location',
    'ward_number',
    'estimated_cost',
    'approved_amount',
    'amount_spent',
    'progress_percentage',
    'status',
    'contractor_name',
    'description',
    'start_date',
    'expected_completion_date'
  ];

  const sampleRows = [
    {
      name: 'Main Bazaar CC Road & Storm Drainage Construction',
      name_te: 'ప్రధాన బజార్ సీసీ రోడ్డు మరియు డ్రైనేజీ నిర్మాణం',
      category: 'Roads & Drainage',
      location: 'Ward No 4 & 5, Main Road',
      ward_number: 4,
      estimated_cost: 1200000,
      approved_amount: 1200000,
      amount_spent: 850000,
      progress_percentage: 75,
      status: 'in_progress',
      contractor_name: 'Sri Sai Constructions, Jagityal',
      description: 'Laying 450 meters M25 concrete pavement with heavy duty side drains',
      start_date: '2025-06-01',
      expected_completion_date: '2025-10-31',
    },
    {
      name: '50KL Overhead Drinking Water Tank with Filter Bed',
      name_te: '50కెఎల్ సామర్థ్యం గల ఓవర్‌హెడ్ మంచినీటి ట్యాంక్',
      category: 'Drinking Water',
      location: 'Near Old Gram Panchayat Office, Ward 2',
      ward_number: 2,
      estimated_cost: 1800000,
      approved_amount: 1800000,
      amount_spent: 1800000,
      progress_percentage: 100,
      status: 'completed',
      contractor_name: 'Rural Water Supply Engineering Wing',
      description: 'Providing round-the-clock safe drinking water connection to 450 households',
      start_date: '2025-01-15',
      expected_completion_date: '2025-06-30',
    },
  ];

  return objectsToCSV(headers, sampleRows);
}

export function getSampleExpendituresTemplate(): string {
  const headers = [
    'description',
    'category',
    'amount',
    'expense_date',
    'vendor_name',
    'bill_number',
    'payment_mode',
    'approval_status'
  ];

  const sampleRows = [
    {
      description: 'Purchase of 300 Bags UltraTech Cement for Ward 4 CC Road',
      category: 'Civil Materials',
      amount: 114000,
      expense_date: '2025-07-12',
      vendor_name: 'Sri Laxmi Building Materials & Hardware',
      bill_number: 'GST-SL-8492',
      payment_mode: 'PFMS Public Portal / Bank Transfer',
      approval_status: 'approved',
    },
    {
      description: 'Monthly Maintenance & Chlorination of Drinking Water Filter Tanks',
      category: 'Drinking Water & Sanitation',
      amount: 28500,
      expense_date: '2025-07-20',
      vendor_name: 'Telangana Aqua Clean Services',
      bill_number: 'INV-TACS-2025-110',
      payment_mode: 'Gram Panchayat Account Cheque',
      approval_status: 'approved',
    },
  ];

  return objectsToCSV(headers, sampleRows);
}

export function getSampleDemographicsTemplate(): string {
  const headers = [
    'name',
    'name_te',
    'mandal',
    'district',
    'state',
    'population',
    'total_wards',
    'lgd_code',
    'sarpanch_name',
    'sarpanch_phone',
    'secretary_name',
    'secretary_phone',
    'office_address',
    'contact_email',
    'pin_code'
  ];

  const sampleRows = [
    {
      name: 'Sriramnagar Gram Panchayat',
      name_te: 'శ్రీరాంనగర్ గ్రామ పంచాయతీ',
      mandal: 'Mallial Mandal',
      district: 'Jagityal',
      state: 'Telangana',
      population: 4250,
      total_wards: 12,
      lgd_code: '208492',
      sarpanch_name: 'K. Anjaiah (సర్పంచ్)',
      sarpanch_phone: '+91 94401 23456',
      secretary_name: 'M. Srinivas (పంచాయతీ కార్యదర్శి)',
      secretary_phone: '+91 98480 76543',
      office_address: 'Gram Panchayat Office, Main Road, Sriramnagar Village, Jagityal Dist, Telangana',
      contact_email: 'sriramnagar.gp.jagityal@telangana.gov.in',
      pin_code: '505531',
    }
  ];

  return objectsToCSV(headers, sampleRows);
}
