import { type BOMCalculation } from "./rules-engine";
import { type InsertBomItem } from "@shared/schema";
import vendorConfig from "../config/vendors.json";

export async function mapToVendor(calculation: BOMCalculation, vendor: string): Promise<Omit<InsertBomItem, 'id' | 'projectId'>[]> {
  try {
    const vendorData = vendorConfig.vendors[vendor as keyof typeof vendorConfig.vendors];
    if (!vendorData) {
      throw new Error(`Unknown vendor: ${vendor}`);
    }

    const bomItems: Omit<InsertBomItem, 'id' | 'projectId'>[] = [];

    // Map frames
    if (calculation.frames > 0) {
      bomItems.push({
        family: 'Frame',
        partCode: vendorData.frame.sku.replace('{height}', '108').replace('{depth}', '48'),
        description: vendorData.frame.desc.replace('{height}', '108').replace('{depth}', '48'),
        quantity: calculation.frames,
        uom: 'EA',
        vendor,
        unitPrice: vendorData.frame.unitPrice.toString(),
        totalPrice: (calculation.frames * vendorData.frame.unitPrice).toFixed(2),
        calcInputs: { component: 'frame', calculation: 'bays + 1' },
      });
    }

    // Map beams
    if (calculation.beams > 0) {
      bomItems.push({
        family: 'Beam',
        partCode: vendorData.beam.sku.replace('{len}', '96').replace('{profile}', 'STD'),
        description: vendorData.beam.desc.replace('{len}', '96').replace('{profile}', 'Standard'),
        quantity: calculation.beams,
        uom: 'EA',
        vendor,
        unitPrice: vendorData.beam.unitPrice.toString(),
        totalPrice: (calculation.beams * vendorData.beam.unitPrice).toFixed(2),
        calcInputs: { component: 'beam', calculation: 'bays × levels × 2' },
      });
    }

    // Map wire decks
    if (calculation.wireDecks > 0) {
      bomItems.push({
        family: 'Wire Deck',
        partCode: vendorData.wireDeck.sku.replace('{width}', '48').replace('{depth}', '42'),
        description: vendorData.wireDeck.desc.replace('{width}', '48').replace('{depth}', '42'),
        quantity: calculation.wireDecks,
        uom: 'EA',
        vendor,
        unitPrice: vendorData.wireDeck.unitPrice.toString(),
        totalPrice: (calculation.wireDecks * vendorData.wireDeck.unitPrice).toFixed(2),
        calcInputs: { component: 'wireDeck', calculation: 'bays × levels × ceil(beam_length / deck_width)' },
      });
    }

    // Map anchors
    if (calculation.anchors > 0) {
      bomItems.push({
        family: 'Anchor',
        partCode: vendorData.anchor.sku.replace('{size}', '5/8').replace('{length}', '8'),
        description: vendorData.anchor.desc.replace('{size}', '5/8').replace('{length}', '8'),
        quantity: calculation.anchors,
        uom: 'EA',
        vendor,
        unitPrice: vendorData.anchor.unitPrice.toString(),
        totalPrice: (calculation.anchors * vendorData.anchor.unitPrice).toFixed(2),
        calcInputs: { component: 'anchor', calculation: 'uprights × anchors_per_footplate' },
      });
    }

    // Map pallet supports
    if (calculation.palletSupports > 0) {
      bomItems.push({
        family: 'Pallet Support',
        partCode: vendorData.palletSupport.sku.replace('{length}', '48'),
        description: vendorData.palletSupport.desc.replace('{length}', '48'),
        quantity: calculation.palletSupports,
        uom: 'EA',
        vendor,
        unitPrice: vendorData.palletSupport.unitPrice.toString(),
        totalPrice: (calculation.palletSupports * vendorData.palletSupport.unitPrice).toFixed(2),
        calcInputs: { component: 'palletSupport', calculation: 'bays × levels × 2' },
      });
    }

    // Map row spacers
    if (calculation.rowSpacers > 0) {
      bomItems.push({
        family: 'Row Spacer',
        partCode: vendorData.rowSpacer.sku.replace('{length}', '48'),
        description: vendorData.rowSpacer.desc.replace('{length}', '48'),
        quantity: calculation.rowSpacers,
        uom: 'EA',
        vendor,
        unitPrice: vendorData.rowSpacer.unitPrice.toString(),
        totalPrice: (calculation.rowSpacers * vendorData.rowSpacer.unitPrice).toFixed(2),
        calcInputs: { component: 'rowSpacer', calculation: 'depth / spacer_spacing × 2' },
      });
    }

    return bomItems;
  } catch (error) {
    console.error('Error mapping to vendor:', error);
    throw new Error('Failed to map BOM to vendor');
  }
}
