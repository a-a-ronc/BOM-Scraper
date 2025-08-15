import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, AlertCircle } from "lucide-react";

interface MetadataPanelProps {
  project: any;
}

export default function MetadataPanel({ project }: MetadataPanelProps) {
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({
    customer: project.customer || "",
    drawingNo: project.drawingNo || "",
    address: project.address || "",
  });

  const metadata = project.metadata || {};
  const hasMetadata = metadata.palletSize || metadata.loadCapacity || metadata.clearHeight || 
                      metadata.totalBays || metadata.totalEndRowUprights || metadata.topOfLoadBeamElevations ||
                      metadata.depthOfLoadBeam || metadata.productLoad || metadata.productDimensions ||
                      metadata.topOfProductElevations;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Extracted Metadata</CardTitle>
          <div className="flex items-center text-emerald-600">
            <CheckCircle className="w-4 h-4 mr-1" />
            <span className="text-sm font-medium">
              {hasMetadata ? "Parsed Successfully" : "No Data"}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-3">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Customer</label>
            {editing ? (
              <Input
                value={formData.customer}
                onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
              />
            ) : (
              <Input value={project.customer || ""} readOnly className="bg-slate-50" />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Drawing Number</label>
            {editing ? (
              <Input
                value={formData.drawingNo}
                onChange={(e) => setFormData({ ...formData, drawingNo: e.target.value })}
              />
            ) : (
              <Input value={project.drawingNo || ""} readOnly className="bg-slate-50" />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Project Name</label>
            <Input value={project.projectName || ""} readOnly className="bg-slate-50" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">Site Address</label>
            {editing ? (
              <Textarea
                rows={2}
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            ) : (
              <Textarea 
                rows={2} 
                value={project.address || ""} 
                readOnly 
                className="bg-slate-50" 
              />
            )}
          </div>
        </div>

        {hasMetadata && (
          <div className="border-t border-slate-200 pt-4">
            <h4 className="text-sm font-medium text-slate-900 mb-3">Rack Specifications</h4>
            
            {/* Basic Specifications */}
            <div className="grid grid-cols-2 gap-3 text-sm mb-4">
              {metadata.totalBays && (
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Total Bays</label>
                  <div className="font-mono text-slate-800">{metadata.totalBays}</div>
                </div>
              )}
              {metadata.totalEndRowUprights && (
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Total End Row Uprights</label>
                  <div className="font-mono text-slate-800">{metadata.totalEndRowUprights}</div>
                </div>
              )}
              {metadata.clearHeight && (
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Clear Height</label>
                  <div className="font-mono text-slate-800">{metadata.clearHeight}</div>
                </div>
              )}
              {metadata.trussHeight && (
                <div>
                  <label className="block text-xs text-slate-600 mb-1">Truss Height</label>
                  <div className="font-mono text-slate-800">{metadata.trussHeight}</div>
                </div>
              )}
            </div>

            {/* Load Beam Configuration */}
            {(metadata.topOfLoadBeamElevations || metadata.depthOfLoadBeam) && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-slate-900 mb-2">Load Beam Configuration</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {metadata.depthOfLoadBeam && (
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Depth of Load Beam</label>
                      <div className="font-mono text-slate-800">{metadata.depthOfLoadBeam}</div>
                    </div>
                  )}
                  {metadata.topOfLoadBeamElevations && metadata.topOfLoadBeamElevations.length > 0 && (
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Top of Load Beam Elevations</label>
                      <div className="flex gap-1 flex-wrap">
                        {metadata.topOfLoadBeamElevations.map((elevation: string, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs font-mono">
                            {elevation}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Product Configuration */}
            {(metadata.productLoad || metadata.productDimensions || metadata.topOfProductElevations) && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-slate-900 mb-2">Product Configuration</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {metadata.productLoad && (
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Product Load</label>
                      <div className="font-mono text-slate-800">{metadata.productLoad}</div>
                    </div>
                  )}
                  {metadata.productDimensions && (
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Product Dimensions</label>
                      <div className="font-mono text-slate-800">{metadata.productDimensions}</div>
                    </div>
                  )}
                </div>
                {metadata.topOfProductElevations && metadata.topOfProductElevations.length > 0 && (
                  <div className="mt-3">
                    <label className="block text-xs text-slate-600 mb-1">Top of Product Elevations</label>
                    <div className="flex gap-1 flex-wrap">
                      {metadata.topOfProductElevations.map((elevation: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-xs font-mono">
                          {elevation}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Legacy Fields */}
            {(metadata.palletSize || metadata.loadCapacity) && (
              <div className="mb-4">
                <h5 className="text-sm font-medium text-slate-900 mb-2">Additional Specifications</h5>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  {metadata.palletSize && (
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Pallet Size</label>
                      <div className="font-mono text-slate-800">{metadata.palletSize}</div>
                    </div>
                  )}
                  {metadata.loadCapacity && (
                    <div>
                      <label className="block text-xs text-slate-600 mb-1">Load Capacity</label>
                      <div className="font-mono text-slate-800">{metadata.loadCapacity} lbs</div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Drawing Views */}
            {metadata.views && metadata.views.length > 0 && (
              <div>
                <label className="block text-xs text-slate-600 mb-2">Drawing Views</label>
                <div className="flex gap-2">
                  {metadata.views.map((view: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {view}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        <div className="pt-4 border-t border-slate-200">
          {editing ? (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1">
                Save Changes
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                className="flex-1"
                onClick={() => setEditing(false)}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Button 
              size="sm" 
              variant="outline" 
              className="w-full"
              onClick={() => setEditing(true)}
            >
              Update Metadata
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
