import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface BomTableProps {
  items: any[];
  loading?: boolean;
}

const componentColors = {
  'Frame': 'bg-blue-500',
  'Beam': 'bg-green-500',
  'Wire Deck': 'bg-purple-500',
  'Anchor': 'bg-orange-500',
  'Pallet Support': 'bg-red-500',
  'Row Spacer': 'bg-yellow-500',
};

export default function BomTable({ items, loading }: BomTableProps) {
  if (loading) {
    return (
      <div className="space-y-2">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-12 border border-slate-200 rounded-lg">
        <div className="text-slate-500 mb-2">No BOM items available</div>
        <div className="text-sm text-slate-400">Generate BOM to see items for this vendor</div>
      </div>
    );
  }

  const totalPrice = items.reduce((sum, item) => sum + parseFloat(item.totalPrice || 0), 0);
  const totalQuantity = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-left font-semibold text-slate-900">Component Family</TableHead>
              <TableHead className="text-left font-semibold text-slate-900">Part Code</TableHead>
              <TableHead className="text-left font-semibold text-slate-900">Description</TableHead>
              <TableHead className="text-right font-semibold text-slate-900">Qty</TableHead>
              <TableHead className="text-left font-semibold text-slate-900">UOM</TableHead>
              <TableHead className="text-right font-semibold text-slate-900">Unit Price</TableHead>
              <TableHead className="text-right font-semibold text-slate-900">Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item.id} className="hover:bg-slate-50">
                <TableCell>
                  <div className="flex items-center">
                    <div 
                      className={`w-2 h-2 rounded-full mr-3 ${
                        componentColors[item.family as keyof typeof componentColors] || 'bg-gray-500'
                      }`}
                    ></div>
                    <span className="font-medium text-slate-900">{item.family}</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-slate-800">{item.partCode}</TableCell>
                <TableCell className="text-slate-700">{item.description}</TableCell>
                <TableCell className="text-right font-mono">{item.quantity}</TableCell>
                <TableCell className="text-slate-600">{item.uom}</TableCell>
                <TableCell className="text-right font-mono">
                  {item.unitPrice ? `$${parseFloat(item.unitPrice).toFixed(2)}` : '-'}
                </TableCell>
                <TableCell className="text-right font-mono font-semibold">
                  {item.totalPrice ? `$${parseFloat(item.totalPrice).toFixed(2)}` : '-'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* BOM Summary */}
      <div className="border-t border-slate-200 bg-slate-50 px-6 py-4 rounded-b-lg">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-6">
            <div className="text-sm">
              <span className="text-slate-600">Total Items:</span>
              <span className="font-semibold text-slate-900 ml-1">{totalQuantity} EA</span>
            </div>
            <div className="text-sm">
              <span className="text-slate-600">Component Families:</span>
              <span className="font-semibold text-slate-900 ml-1">
                {new Set(items.map(item => item.family)).size}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-slate-600">Estimated Total</div>
            <div className="text-xl font-bold text-slate-900">
              ${totalPrice.toFixed(2)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
