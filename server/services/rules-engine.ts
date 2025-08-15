import { type Project } from "@shared/schema";
import rulesConfig from "../config/rules.json";

export interface BOMCalculation {
  frames: number;
  beams: number;
  wireDecks: number;
  anchors: number;
  palletSupports: number;
  rowSpacers: number;
  bays: number;
  levels: number;
  metadata: any;
}

export async function calculateBOM(project: Project): Promise<BOMCalculation> {
  try {
    // Extract dimensions and specifications from project metadata
    const metadata = project.metadata || {};
    
    // Default calculations based on typical rack configurations
    // In a real system, these would be derived from the parsed drawing data
    const bays = 6; // Number of storage bays
    const levels = 4; // Number of storage levels
    
    // Apply rules from configuration
    const rules = rulesConfig;
    
    // Calculate frame requirements
    const frames = bays + 1; // One frame per bay plus end frame
    
    // Calculate beam requirements  
    const beams = bays * levels * 2; // Two beams per bay per level
    
    // Calculate wire deck requirements
    const deckModuleWidth = rules.defaults.deck_module_width_in;
    const beamLength = 96; // inches, derived from typical 8-foot beams
    const wireDecks = bays * levels * Math.ceil(beamLength / deckModuleWidth);
    
    // Calculate anchor requirements
    const anchorsPerFootplate = rules.defaults.anchors_per_footplate;
    const uprights = frames * 2; // Two uprights per frame
    const anchors = uprights * anchorsPerFootplate;
    
    // Calculate pallet support requirements
    const palletSupports = bays * levels * 2; // Two supports per pallet position
    
    // Calculate row spacer requirements
    const rowSpacerSpacing = rules.defaults.row_spacer_spacing_ft * 12; // Convert to inches
    const totalDepth = 48; // inches, typical rack depth
    const rowSpacers = Math.ceil(totalDepth / rowSpacerSpacing) * 2; // Front and back spacers
    
    return {
      frames,
      beams,
      wireDecks,
      anchors,
      palletSupports,
      rowSpacers,
      bays,
      levels,
      metadata: project.metadata,
    };
  } catch (error) {
    console.error('Error calculating BOM:', error);
    throw new Error('Failed to calculate BOM');
  }
}
