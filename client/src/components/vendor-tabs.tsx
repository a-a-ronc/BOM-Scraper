import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { exportBOM } from "@/lib/api";
import { Download } from "lucide-react";
import BomTable from "./bom-table";

interface VendorTabsProps {
  projectId: string;
  bomItems: any[];
}

const vendors = [
  { id: 'interlake', name: 'Interlake Mecalux' },
  { id: 'hannibal', name: 'Hannibal' },
  { id: 'stow', name: 'Stow' },
];

export default function VendorTabs({ projectId, bomItems }: VendorTabsProps) {
  const [activeVendor, setActiveVendor] = useState('interlake');
  const [exporting, setExporting] = useState(false);
  const { toast } = useToast();

  const getVendorItems = (vendorId: string) => {
    return bomItems.filter(item => item.vendor === vendorId);
  };

  const handleExport = async (format: string) => {
    setExporting(true);
    try {
      const blob = await exportBOM(projectId, format, activeVendor);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `BOM_${activeVendor}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast({
        title: "Export successful!",
        description: `BOM has been exported as ${format.toUpperCase()} file.`,
      });
    } catch (error: any) {
      toast({
        title: "Export failed",
        description: error.message || "Failed to export BOM",
        variant: "destructive",
      });
    } finally {
      setExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Bill of Materials Generation</h3>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('csv')}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-1" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleExport('xlsx')}
              disabled={exporting}
            >
              <Download className="w-4 h-4 mr-1" />
              XLSX
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <Tabs value={activeVendor} onValueChange={setActiveVendor}>
          <div className="px-6 pb-4 border-b border-slate-200">
            <TabsList className="grid w-full grid-cols-3">
              {vendors.map((vendor) => (
                <TabsTrigger key={vendor.id} value={vendor.id}>
                  {vendor.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          
          {vendors.map((vendor) => (
            <TabsContent key={vendor.id} value={vendor.id} className="m-0">
              <BomTable 
                items={getVendorItems(vendor.id)} 
                loading={false}
              />
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}
