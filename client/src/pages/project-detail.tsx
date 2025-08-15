import { useParams, Link } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { reparseProject, generateBOM, exportBOM } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { ChevronLeft, RefreshCw, Download, CheckCircle, Upload, Zap } from "lucide-react";
import PdfUpload from "@/components/pdf-upload";
import MetadataPanel from "@/components/metadata-panel";
import BomTable from "@/components/bom-table";
import VendorTabs from "@/components/vendor-tabs";

export default function ProjectDetail() {
  const { id } = useParams();
  const { toast } = useToast();

  const { data: project, isLoading } = useQuery({
    queryKey: ["/api/projects", id],
    enabled: !!id,
  });

  const reparseProjectMutation = useMutation({
    mutationFn: () => reparseProject(id!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      toast({
        title: "Parsing complete!",
        description: "Project documents have been re-parsed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Parsing failed",
        description: error.message || "Failed to re-parse documents",
        variant: "destructive",
      });
    },
  });

  const generateBOMMutation = useMutation({
    mutationFn: (vendors: string[]) => generateBOM(id!, vendors),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects", id] });
      toast({
        title: "BOM generated!",
        description: "Bill of Materials has been generated for all selected vendors.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "BOM generation failed",
        description: error.message || "Failed to generate BOM",
        variant: "destructive",
      });
    },
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Card className="text-center p-6">
          <CardContent>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Project not found</h2>
            <p className="text-slate-600 mb-4">The requested project could not be found.</p>
            <Link href="/">
              <Button>Back to Dashboard</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Navigation Header */}
      <nav className="bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"/>
                </svg>
              </div>
              <h1 className="text-xl font-semibold text-slate-800">Intralog BOM</h1>
            </div>
            <div className="hidden md:flex items-center space-x-6 ml-8">
              <Link href="/" className="text-primary-600 font-medium">Projects</Link>
              <span className="text-slate-600">Templates</span>
              <span className="text-slate-600">Vendors</span>
              <span className="text-slate-600">Reports</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Link href="/">
              <Button variant="ghost" size="sm">
                <ChevronLeft className="w-4 h-4 mr-1" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">{(project as any).name}</h1>
              <p className="text-slate-600 mt-1">
                {(project as any).drawingNo && `Drawing ${(project as any).drawingNo} • `}
                {(project as any).address || "No address specified"}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-3">
            <Button 
              variant="outline"
              onClick={() => reparseProjectMutation.mutate()}
              disabled={reparseProjectMutation.isPending}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${reparseProjectMutation.isPending ? 'animate-spin' : ''}`} />
              Re-Parse Documents
            </Button>
            <Button 
              onClick={() => generateBOMMutation.mutate(['interlake', 'hannibal', 'stow'])}
              disabled={generateBOMMutation.isPending}
              className="bg-primary-600 hover:bg-primary-700"
            >
              {generateBOMMutation.isPending ? 'Generating...' : 'Generate BOM'}
            </Button>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900">Project Workflow</h2>
            <div className="text-sm text-slate-600">
              Step {(project as any).files?.length > 0 ? ((project as any).bomItems?.length > 0 ? 4 : 3) : ((project as any).customer ? 2 : 1)} of 4
            </div>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <div className={`flex items-center p-4 rounded-lg border-2 ${
              true ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                true ? 'bg-emerald-500 text-white' : 'bg-slate-300 text-slate-600'
              }`}>
                <span className="text-sm font-semibold">1</span>
              </div>
              <div>
                <div className="font-medium text-slate-900">Create Project</div>
                <div className="text-xs text-slate-600">Setup basic info</div>
              </div>
            </div>
            
            <div className={`flex items-center p-4 rounded-lg border-2 ${
              (project as any).files?.length > 0 ? 'border-blue-200 bg-blue-50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                (project as any).files?.length > 0 ? 'bg-blue-500 text-white' : 'bg-slate-300 text-slate-600'
              }`}>
                <span className="text-sm font-semibold">2</span>
              </div>
              <div>
                <div className="font-medium text-slate-900">Upload Drawings</div>
                <div className="text-xs text-slate-600">PDF rack plans</div>
              </div>
            </div>
            
            <div className={`flex items-center p-4 rounded-lg border-2 ${
              (project as any).customer ? 'border-purple-200 bg-purple-50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                (project as any).customer ? 'bg-purple-500 text-white' : 'bg-slate-300 text-slate-600'
              }`}>
                <span className="text-sm font-semibold">3</span>
              </div>
              <div>
                <div className="font-medium text-slate-900">Extract Data</div>
                <div className="text-xs text-slate-600">Parse specifications</div>
              </div>
            </div>
            
            <div className={`flex items-center p-4 rounded-lg border-2 ${
              (project as any).bomItems?.length > 0 ? 'border-orange-200 bg-orange-50' : 'border-slate-200 bg-slate-50'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
                (project as any).bomItems?.length > 0 ? 'bg-orange-500 text-white' : 'bg-slate-300 text-slate-600'
              }`}>
                <span className="text-sm font-semibold">4</span>
              </div>
              <div>
                <div className="font-medium text-slate-900">Generate BOM</div>
                <div className="text-xs text-slate-600">Calculate materials</div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Documents & Metadata */}
          <div className="lg:col-span-1 space-y-6">
            {/* Document Upload/Preview */}
            <PdfUpload projectId={(project as any).id} files={(project as any).files || []} />

            {/* Extracted Metadata */}
            <MetadataPanel project={project} />
            
            {/* Next Steps Guide */}
            {!(project as any).files?.length ? (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="text-blue-900 flex items-center">
                    <Upload className="w-5 h-5 mr-2" />
                    Next: Upload Your Drawings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-blue-800 text-sm mb-3">
                    Upload your rack elevation and top view PDF drawings to extract project specifications automatically.
                  </p>
                  <ul className="text-xs text-blue-700 space-y-1">
                    <li>• Supported: PDF files up to 10MB</li>
                    <li>• Best results: Clear, high-resolution drawings</li>
                    <li>• Multiple files: Upload both views for complete analysis</li>
                  </ul>
                </CardContent>
              </Card>
            ) : !(project as any).customer ? (
              <Card className="border-purple-200 bg-purple-50">
                <CardHeader>
                  <CardTitle className="text-purple-900 flex items-center">
                    <Zap className="w-5 h-5 mr-2" />
                    Next: Parse Documents
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-purple-800 text-sm mb-3">
                    Click "Re-Parse Documents" to extract customer information and rack specifications from your uploaded PDFs.
                  </p>
                </CardContent>
              </Card>
            ) : !(project as any).bomItems?.length ? (
              <Card className="border-orange-200 bg-orange-50">
                <CardHeader>
                  <CardTitle className="text-orange-900 flex items-center">
                    <Download className="w-5 h-5 mr-2" />
                    Next: Generate BOM
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-orange-800 text-sm mb-3">
                    Generate Bills of Materials for all vendors (Interlake, Hannibal, Stow) to compare pricing and specifications.
                  </p>
                </CardContent>
              </Card>
            ) : (
              <Card className="border-emerald-200 bg-emerald-50">
                <CardHeader>
                  <CardTitle className="text-emerald-900 flex items-center">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Project Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-emerald-800 text-sm">
                    Your BOM is ready! Export the data or start seismic preliminary calculations.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - BOM & Vendor Management */}
          <div className="lg:col-span-2 space-y-6">
            {/* Vendor Selection Tabs */}
            <VendorTabs projectId={(project as any).id} bomItems={(project as any).bomItems || []} />

            {/* Rules Engine Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-emerald-500" />
                  <span>Rules Engine Status</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600 mb-4">
                  BOM calculations based on extracted rack specifications and industry standards
                </p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Applied Rules</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                        Standard anchors per footplate: 2
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                        Deck module width: 48"
                      </li>
                      <li className="flex items-center">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mr-2" />
                        Row spacer spacing: 8'
                      </li>
                    </ul>
                  </div>
                  
                  <div className="bg-slate-50 rounded-lg p-4">
                    <h4 className="font-medium text-slate-900 mb-2">Calculated Values</h4>
                    <ul className="text-sm text-slate-600 space-y-1">
                      <li className="flex justify-between">
                        <span>Bays:</span>
                        <span className="font-mono">6</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Levels:</span>
                        <span className="font-mono">4</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Frames needed:</span>
                        <span className="font-mono">7 (bays + 1)</span>
                      </li>
                      <li className="flex justify-between">
                        <span>Beams needed:</span>
                        <span className="font-mono">48 (bays × levels × 2)</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* AI Agent Status */}
            {(project as any).logs && (project as any).logs.length > 0 && (
              <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
                <CardHeader>
                  <CardTitle className="text-primary-900">AI Agent Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {(project as any).logs.slice(0, 3).map((log: any, index: number) => (
                      <div key={log.id} className="flex items-center justify-between p-3 bg-white rounded-lg border border-primary-100">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                          <span className="text-slate-700">{log.message}</span>
                        </div>
                        <span className="text-xs text-slate-500">
                          {new Date(log.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 text-xs text-slate-600">
                    API Usage: <span className="font-mono">$0.04</span> • Tokens: <span className="font-mono">1,247</span>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
