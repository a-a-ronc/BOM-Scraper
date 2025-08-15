import * as fs from 'fs';

// Simple type interface for PDF parse result
interface PDFData {
  numpages: number;
  text: string;
}

export interface ParsedDocument {
  customer?: string;
  drawingNo?: string;
  projectName?: string;
  address?: string;
  pageCount?: number;
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
      const pdfParse = (await import('pdf-parse')).default;
      pdfData = await pdfParse(pdfBuffer);
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
    if (addressMatch) {
      result.address = (addressMatch[1] || addressMatch[0]).trim();
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
    const loadBeamMatches = textContent.matchAll(/(?:Load\s*Beam|Beam)\s*(?:Elevation|Level|Height)\s*:?\s*([\d'"\s,-]+)/gi);
    for (const match of loadBeamMatches) {
      const elevations = match[1].match(/\d+'-\d+"/g);
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
    const productElevMatches = textContent.matchAll(/(?:Product\s*)?(?:Top|Height)\s*(?:Elevation|Level)\s*:?\s*([\d'"\s,-]+)/gi);
    for (const match of productElevMatches) {
      const elevations = match[1].match(/\d+'-\d+"/g);
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
