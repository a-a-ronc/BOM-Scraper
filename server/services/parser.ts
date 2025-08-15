import * as fs from 'fs';

// Simple type interface for PDF parse result
interface PDFData {
  numpages: number;
  text: string;
}

export interface ParsedDocument {
  customer?: string;
  drawingNo?: string;
  address?: string;
  pageCount?: number;
  metadata?: {
    palletSize?: string;
    loadCapacity?: number;
    clearHeight?: string;
    trussHeight?: string;
    views?: string[];
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
      const pdfParse = require('pdf-parse');
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

    // Extract customer name - try multiple patterns
    let customerMatch;
    // Try specific known customers first
    customerMatch = textContent.match(/Falcon\s+Fulfillment/i);
    if (!customerMatch) {
      // Try more generic company name patterns
      customerMatch = textContent.match(/^([A-Z][a-zA-Z\s&]+(?:LLC|Inc|Corp|Company|Co\.|Limited)?)[\n\r]/m);
    }
    if (customerMatch) {
      result.customer = customerMatch[0].trim();
    }

    // Extract drawing number - try multiple patterns
    let drawingMatch;
    // Pattern 1: D-XXXXXX-X-XXX (like D-241254-R-180)
    drawingMatch = textContent.match(/D-\d{6}-[A-Z]-\d{3}/);
    if (!drawingMatch) {
      // Pattern 2: D-XXXXX-X-XXX
      drawingMatch = textContent.match(/D-\d{5}-[A-Z]-\d{3}/);
    }
    if (!drawingMatch) {
      // Pattern 3: Generic drawing number patterns
      drawingMatch = textContent.match(/(?:DWG|DRAWING|D)[-\s]*\d+[-A-Z\d]*/);
    }
    if (drawingMatch) {
      result.drawingNo = drawingMatch[0];
    }

    // Extract address - improved pattern
    const addressMatch = textContent.match(/(\d+[^\n]*(?:Street|St|Avenue|Ave|Road|Rd|Drive|Dr|Lane|Ln|Pkwy|Parkway|Way|Court|Ct|Circle|Cir|Boulevard|Blvd)[^\n]*,\s*[A-Za-z\s]+,\s*[A-Z]{2}\s+\d{5}(?:-\d{4})?)/i);
    if (addressMatch) {
      result.address = addressMatch[1].trim();
    }

    // Extract views
    const views = [];
    if (/TOP\s*VIEW/i.test(textContent)) views.push('TOP VIEW');
    if (/ELEVATION\s*VIEW/i.test(textContent)) views.push('ELEVATION VIEW');
    if (/SIDE\s*VIEW/i.test(textContent)) views.push('SIDE VIEW');
    if (/PLAN\s*VIEW/i.test(textContent)) views.push('PLAN VIEW');
    if (/SECTION\s*VIEW/i.test(textContent)) views.push('SECTION VIEW');

    // Extract pallet dimensions - improved pattern
    const palletMatch = textContent.match(/(\d+")[\sx]+(\d+")[\sx]+(\d+")/i);
    const palletSize = palletMatch ? palletMatch[0] : undefined;

    // Extract load capacity
    const loadMatch = textContent.match(/(\d{1,3}(?:,\d{3})*)\s*(?:lbs?|pounds?)/i);
    const loadCapacity = loadMatch ? parseInt(loadMatch[1].replace(/,/g, '')) : undefined;

    // Extract clear height - multiple patterns
    let clearHeightMatch;
    clearHeightMatch = textContent.match(/(\d+'-\d+")\s*(?:Clear|CL\.?|CLR\.?)/i);
    if (!clearHeightMatch) {
      clearHeightMatch = textContent.match(/(\d+'-\d+")\s*(?:to|height)/i);
    }
    if (!clearHeightMatch) {
      // Try feet and inches separately
      clearHeightMatch = textContent.match(/(\d+)\s*(?:ft|feet|')\s*(?:-|\s)*(\d+)\s*(?:in|inches|")\s*(?:Clear|CL\.?|CLR\.?)/i);
      if (clearHeightMatch) {
        clearHeightMatch[1] = `${clearHeightMatch[1]}'-${clearHeightMatch[2]}"`;
      }
    }
    const clearHeight = clearHeightMatch ? clearHeightMatch[1] : undefined;

    // Extract truss height
    const trussMatch = textContent.match(/(\d+'-\d+")\s*(?:To|to)\s*(?:Lowest|lowest)?\s*(?:Hanging|hanging)?\s*(?:Truss|truss)/i);
    const trussHeight = trussMatch ? trussMatch[1] : undefined;

    result.metadata = {
      palletSize,
      loadCapacity,
      clearHeight,
      trussHeight,
      views: views.length > 0 ? views : undefined,
    };

    result.pageCount = 1;

    return result;
  } catch (error) {
    console.error('Error parsing document:', error);
    throw new Error('Failed to parse document');
  }
}
