import * as fs from 'fs';

// Simple type interface for PDF parse result
interface PDFData {
  numpages: number;
  text: string;
}

interface BOMItem {
  family: string;
  partCode: string;
  description: string;
  quantity: number;
  uom: string; // unit of measure
  notes?: string;
}

export interface ParsedDocument {
  customer?: string;
  drawingNo?: string;
  projectName?: string;
  address?: string;
  pageCount?: number;
  configurations?: { [key: string]: ConfigurationBOM };
  metadata?: {
    // Basic specs
    palletSize?: string;
    loadCapacity?: number;
    clearHeight?: string;
    trussHeight?: string;
    views?: string[];
    
    // Rack configuration details
    totalBays?: number;
    totalEndRowUprights?: number;
    topOfLoadBeamElevations?: string[];
    depthOfLoadBeam?: string;
    productLoad?: string;
    productDimensions?: string;
    topOfProductElevations?: string[];
  };
}

interface ConfigurationBOM {
  configId: string;
  bays: number;
  levels: number;
  items: BOMItem[];
  totalLoadBeams: number;
  totalWireDecks: number;
  totalAnchors: number;
  totalUprights: number;
}

export async function parseDocument(filePath: string): Promise<ParsedDocument> {
  try {
    // Read the PDF file
    if (!fs.existsSync(filePath)) {
      throw new Error('File not found');
    }

    // Read the PDF file as buffer
    const pdfBuffer = fs.readFileSync(filePath);
    
    // Parse PDF content with proper error handling
    let pdfData: PDFData;
    try {
      // Import pdf-parse dynamically but handle it properly
      const pdfParseModule = await import('pdf-parse');
      const pdfParse = pdfParseModule.default;
      pdfData = await pdfParse(pdfBuffer);
      console.log('PDF parsing successful, text length:', pdfData.text.length);
    } catch (parseError: any) {
      console.error('PDF parsing error:', parseError.message);
      // Fallback: return basic structure with empty text if parsing fails
      pdfData = {
        numpages: 1,
        text: ''
      };
    }
    const textContent = pdfData.text;
    
    console.log('Extracted PDF text:', textContent.substring(0, 500) + '...');
    
    const result: ParsedDocument = {};
    result.pageCount = pdfData.numpages;

    console.log('Full PDF text for debugging:', textContent); // Debug log

    // Extract customer name - enhanced patterns for engineering drawings
    let customerMatch;
    // Try company names at beginning of lines
    customerMatch = textContent.match(/^([A-Z][a-zA-Z\s&.,-]+(?:LLC|Inc|Corp|Company|Co\.|Limited|Fulfillment|Solutions|Engineering|Industries)?)[\s]*$/m);
    if (!customerMatch) {
      // Try "Client:" or "Customer:" labels
      customerMatch = textContent.match(/(?:Client|Customer|Company)\s*:?\s*([A-Z][a-zA-Z\s&.,-]+)/i);
    }
    if (!customerMatch) {
      // Try patterns with specific known customers
      customerMatch = textContent.match(/(Falcon\s+Fulfillment|[A-Z][a-zA-Z]+\s+(?:Fulfillment|Logistics|Distribution|Warehouse))/i);
    }
    if (customerMatch) {
      result.customer = (customerMatch[1] || customerMatch[0]).trim();
    }

    // Extract drawing number - comprehensive patterns
    let drawingMatch;
    // Pattern 1: Standard drawing numbers D-XXXXXX-X-XXX
    drawingMatch = textContent.match(/D-\d{4,6}-[A-Z]-\d{2,3}/i);
    if (!drawingMatch) {
      // Pattern 2: Drawing numbers with prefixes
      drawingMatch = textContent.match(/(?:DWG|DRAWING|D)[-\s#]*([A-Z]?\d+[-A-Z\d]*)/i);
    }
    if (!drawingMatch) {
      // Pattern 3: Project numbers or drawing IDs
      drawingMatch = textContent.match(/(?:Project|Job)\s*#?\s*:?\s*([A-Z]?\d+[-A-Z\d]*)/i);
    }
    if (drawingMatch) {
      result.drawingNo = (drawingMatch[1] || drawingMatch[0]).trim();
    }

    // Extract project name
    let projectMatch;
    projectMatch = textContent.match(/(?:Project|Job)\s*(?:Name|Title)?\s*:?\s*([A-Z][a-zA-Z\s&.,-]+(?:System|Facility|Warehouse|Distribution))/i);
    if (!projectMatch) {
      projectMatch = textContent.match(/([A-Z][a-zA-Z\s]+(?:Rack|Storage|Warehouse|Distribution|Fulfillment)\s*System)/i);
    }
    if (projectMatch) {
      result.projectName = projectMatch[1].trim();
    }

    // Extract address - comprehensive patterns
    let addressMatch;
    // Full address pattern
    addressMatch = textContent.match(/(\d+[^\n]*(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Pkwy|Parkway|Way|Court|Ct|Circle|Cir|Boulevard|Blvd)[^\n]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i);
    if (!addressMatch) {
      // Try address with label
      addressMatch = textContent.match(/(?:Address|Location)\s*:?\s*([^\n]+)/i);
    }
    if (!addressMatch) {
      // Try multi-line address
      const lines = textContent.split('\n');
      for (let i = 0; i < lines.length - 1; i++) {
        if (/\d+.*(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Pkwy|Parkway)/i.test(lines[i])) {
          const cityState = lines[i + 1]?.match(/([A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5})/i);
          if (cityState) {
            addressMatch = [null, lines[i].trim() + ', ' + cityState[1]];
            break;
          }
        }
      }
    }
    if (addressMatch && addressMatch[1]) {
      result.address = addressMatch[1].trim();
    } else if (addressMatch && addressMatch[0]) {
      result.address = addressMatch[0].trim();
    }

    // Extract total number of bays
    let totalBays;
    const bayMatch = textContent.match(/(?:Total\s*)?(?:Number\s*of\s*)?Bays?\s*:?\s*(\d+)/i) ||
                     textContent.match(/(\d+)\s*(?:Bay|Bays)/i) ||
                     textContent.match(/Bay\s*Count\s*:?\s*(\d+)/i);
    if (bayMatch) {
      totalBays = parseInt(bayMatch[1]);
    }

    // Extract total number of end row uprights
    let totalEndRowUprights;
    const uprightMatch = textContent.match(/(?:End\s*Row\s*)?Uprights?\s*:?\s*(\d+)/i) ||
                        textContent.match(/(\d+)\s*End\s*Row\s*Uprights?/i) ||
                        textContent.match(/End\s*Uprights?\s*:?\s*(\d+)/i);
    if (uprightMatch) {
      totalEndRowUprights = parseInt(uprightMatch[1]);
    }

    // Extract top of load beam elevations
    const topOfLoadBeamElevations: string[] = [];
    const loadBeamPattern = /(?:Load\s*Beam|Beam)\s*(?:Elevation|Level|Height)\s*:?\s*([\d'"\s,-]+)/gi;
    let loadBeamMatch;
    while ((loadBeamMatch = loadBeamPattern.exec(textContent)) !== null) {
      const elevations = loadBeamMatch[1].match(/\d+'-\d+"/g);
      if (elevations) {
        topOfLoadBeamElevations.push(...elevations);
      }
    }

    // Extract depth of load beam
    let depthOfLoadBeam;
    const depthMatch = textContent.match(/(?:Beam\s*)?Depth\s*:?\s*([\d'"\s-]+)/i) ||
                      textContent.match(/([\d'"\s-]+)\s*(?:Deep|Depth)/i);
    if (depthMatch) {
      depthOfLoadBeam = depthMatch[1].trim();
    }

    // Extract product load
    let productLoad;
    const productLoadMatch = textContent.match(/(?:Product\s*)?Load\s*:?\s*([\d,]+)\s*(?:lbs?|pounds?)/i) ||
                            textContent.match(/([\d,]+)\s*(?:lbs?|pounds?)\s*(?:per|load)/i);
    if (productLoadMatch) {
      productLoad = productLoadMatch[1] + ' lbs';
    }

    // Extract product dimensions
    let productDimensions;
    const productDimMatch = textContent.match(/(?:Product\s*)?(?:Dimensions?|Size)\s*:?\s*([\d"'\sx]+)/i) ||
                           textContent.match(/([\d]+"\s*x\s*[\d]+"\s*x\s*[\d]+")/i);
    if (productDimMatch) {
      productDimensions = productDimMatch[1].trim();
    }

    // Extract top of product elevations
    const topOfProductElevations: string[] = [];
    const productElevPattern = /(?:Product\s*)?(?:Top|Height)\s*(?:Elevation|Level)\s*:?\s*([\d'"\s,-]+)/gi;
    let productElevMatch;
    while ((productElevMatch = productElevPattern.exec(textContent)) !== null) {
      const elevations = productElevMatch[1].match(/\d+'-\d+"/g);
      if (elevations) {
        topOfProductElevations.push(...elevations);
      }
    }

    // Extract clear height - enhanced patterns
    let clearHeight;
    let clearHeightMatch = textContent.match(/(\d+'-\d+")\s*(?:Clear|CL\.?|CLR\.?|Clearance)/i);
    if (!clearHeightMatch) {
      clearHeightMatch = textContent.match(/(?:Clear|Clearance)\s*(?:Height)?\s*:?\s*(\d+'-\d+")/i);
    }
    if (!clearHeightMatch) {
      clearHeightMatch = textContent.match(/(\d+)\s*(?:ft|feet|')\s*(?:-|\s)*(\d+)\s*(?:in|inches|")\s*(?:Clear|CL\.?|CLR\.?)/i);
      if (clearHeightMatch) {
        clearHeight = `${clearHeightMatch[1]}'-${clearHeightMatch[2]}"`;
      }
    } else {
      clearHeight = clearHeightMatch[1];
    }

    // Extract BOM information
    const configurations = extractBOMConfigurations(textContent);
    result.configurations = configurations;

    // Extract views
    const views = [];
    if (/(?:TOP|PLAN)\s*VIEW/i.test(textContent)) views.push('TOP VIEW');
    if (/ELEVATION\s*VIEW/i.test(textContent)) views.push('ELEVATION VIEW');
    if (/SIDE\s*VIEW/i.test(textContent)) views.push('SIDE VIEW');
    if (/SECTION\s*VIEW/i.test(textContent)) views.push('SECTION VIEW');

    // Extract pallet dimensions
    const palletMatch = textContent.match(/(\d+")[\sx]+(\d+")[\sx]+(\d+")/i) ||
                       textContent.match(/(?:Pallet|Skid)\s*(?:Size|Dimensions?)\s*:?\s*([\d"'\sx]+)/i);
    const palletSize = palletMatch ? (palletMatch[1] || palletMatch[0]) : undefined;

    // Extract load capacity
    const loadMatch = textContent.match(/(\d{1,3}(?:,\d{3})*)\s*(?:lbs?|pounds?)\s*(?:per|load|capacity)?/i);
    const loadCapacity = loadMatch ? parseInt(loadMatch[1].replace(/,/g, '')) : undefined;

    // Extract truss height
    const trussMatch = textContent.match(/(\d+'-\d+")\s*(?:To|to)\s*(?:Lowest|lowest)?\s*(?:Hanging|hanging)?\s*(?:Truss|truss)/i);
    const trussHeight = trussMatch ? trussMatch[1] : undefined;

    result.metadata = {
      // Basic specifications
      palletSize,
      loadCapacity,
      clearHeight,
      trussHeight,
      views: views.length > 0 ? views : undefined,
      
      // Advanced rack configuration
      totalBays,
      totalEndRowUprights,
      topOfLoadBeamElevations: topOfLoadBeamElevations.length > 0 ? topOfLoadBeamElevations : undefined,
      depthOfLoadBeam,
      productLoad,
      productDimensions,
      topOfProductElevations: topOfProductElevations.length > 0 ? topOfProductElevations : undefined,
    };

    result.pageCount = 1;

    return result;
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error('Failed to parse document');
  }
}

function extractBOMConfigurations(textContent: string): { [key: string]: ConfigurationBOM } {
  const configurations: { [key: string]: ConfigurationBOM } = {};
  
  // Extract rack configurations (R1, R2, T1, T2, etc.)
  const configMatches = textContent.match(/\b[RT]\d+\b/g) || [];
  const uniqueConfigs = Array.from(new Set(configMatches));
  
  for (const configId of uniqueConfigs) {
    console.log(`Processing configuration: ${configId}`);
    
    // Extract configuration-specific data
    const config: ConfigurationBOM = {
      configId,
      bays: extractBaysForConfig(textContent, configId),
      levels: extractLevelsForConfig(textContent, configId),
      items: [],
      totalLoadBeams: 0,
      totalWireDecks: 0,
      totalAnchors: 0,
      totalUprights: 0
    };
    
    // Calculate BOM items based on extracted data
    calculateBOMItems(config);
    
    configurations[configId] = config;
  }
  
  // If no configurations found, create a default "MAIN" configuration
  if (Object.keys(configurations).length === 0) {
    const mainConfig = createDefaultConfiguration(textContent);
    configurations['MAIN'] = mainConfig;
  }
  
  return configurations;
}

function extractBaysForConfig(textContent: string, configId: string): number {
  // Look for bay count near the configuration ID
  const configPattern = new RegExp(`${configId}.*?(\\d+)\\s*(?:bay|bays)`, 'gi');
  const match = configPattern.exec(textContent);
  if (match) {
    return parseInt(match[1]);
  }
  
  // Look for general bay count
  const bayMatch = textContent.match(/(\d+)\s*(?:bay|bays)/gi);
  if (bayMatch) {
    return parseInt(bayMatch[0].match(/\d+/)?.[0] || '1');
  }
  
  return 1; // Default fallback
}

function extractLevelsForConfig(textContent: string, configId: string): number {
  // Count beam elevations to determine levels
  const elevationMatches = textContent.match(/\d+'-\d+".*(?:beam|level)/gi) || [];
  const elevationHeights = elevationMatches.map(m => m.match(/\d+'-\d+"/)?.[0]);
  const uniqueElevations = Array.from(new Set(elevationHeights)).filter(Boolean);
  
  return Math.max(uniqueElevations.length, 1); // At least 1 level
}

function createDefaultConfiguration(textContent: string): ConfigurationBOM {
  const config: ConfigurationBOM = {
    configId: 'MAIN',
    bays: extractBaysForConfig(textContent, 'MAIN'),
    levels: extractLevelsForConfig(textContent, 'MAIN'),
    items: [],
    totalLoadBeams: 0,
    totalWireDecks: 0,
    totalAnchors: 0,
    totalUprights: 0
  };
  
  calculateBOMItems(config);
  return config;
}

function calculateBOMItems(config: ConfigurationBOM): void {
  const { bays, levels } = config;
  
  // Calculate quantities based on standard rack formulas
  config.totalUprights = bays + 1; // uprights = bays + 1
  config.totalLoadBeams = bays * levels * 2; // 2 beams per level per bay
  config.totalWireDecks = bays * levels; // 1 deck per level per bay
  config.totalAnchors = config.totalUprights * 4; // 4 anchors per upright (2 per footplate)
  
  // Create BOM items
  config.items = [
    {
      family: 'Uprights',
      partCode: 'UPRIGHT-STD',
      description: 'Standard Upright',
      quantity: config.totalUprights,
      uom: 'EA',
      notes: 'Calculated: bays + 1'
    },
    {
      family: 'Load Beams',
      partCode: 'BEAM-STD',
      description: 'Standard Load Beam',
      quantity: config.totalLoadBeams,
      uom: 'EA',
      notes: 'Calculated: bays × levels × 2'
    },
    {
      family: 'Wire Decks',
      partCode: 'DECK-WIRE',
      description: 'Wire Deck Panel',
      quantity: config.totalWireDecks,
      uom: 'EA',
      notes: 'Calculated: bays × levels'
    },
    {
      family: 'Anchors',
      partCode: 'ANCHOR-BOLT',
      description: 'Anchor Bolt',
      quantity: config.totalAnchors,
      uom: 'EA',
      notes: 'Calculated: uprights × 4'
    }
  ];
  
  console.log(`Configuration ${config.configId}: ${bays} bays, ${levels} levels, ${config.totalLoadBeams} beams, ${config.totalWireDecks} decks, ${config.totalAnchors} anchors`);
}
