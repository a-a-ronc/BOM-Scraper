import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { logout, createProject } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Plus, FileText, Calendar, User, LogOut, Upload, Zap, Download } from "lucide-react";

const createProjectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  customer: z.string().optional(),
  address: z.string().optional(),
});

type CreateProjectForm = z.infer<typeof createProjectSchema>;

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const { toast } = useToast();

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ["/api/projects"],
  });

  const form = useForm<CreateProjectForm>({
    resolver: zodResolver(createProjectSchema),
    defaultValues: {
      name: "",
      customer: "",
      address: "",
    },
  });

  const createProjectMutation = useMutation({
    mutationFn: (data: CreateProjectForm) => createProject(data),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      setShowCreateDialog(false);
      form.reset();
      toast({
        title: "Project created!",
        description: "Your new project has been created successfully.",
      });
      setLocation(`/projects/${project.id}`);
    },
    onError: (error: any) => {
      toast({
        title: "Error creating project",
        description: error.message || "Failed to create project",
        variant: "destructive",
      });
    },
  });

  const handleLogout = async () => {
    try {
      await logout();
      setLocation("/login");
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  const onSubmit = (data: CreateProjectForm) => {
    createProjectMutation.mutate(data);
  };

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
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-slate-600 hover:text-slate-800"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Page Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Projects Dashboard</h1>
            <p className="text-slate-600 mt-1">Manage your rack engineering projects and BOMs</p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="bg-primary-600 hover:bg-primary-700">
                <Plus className="w-4 h-4 mr-2" />
                New Project
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Project</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Rack System Project" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="customer"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Customer (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Company Name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Site Address (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Project site address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex space-x-2">
                    <Button 
                      type="submit" 
                      disabled={createProjectMutation.isPending}
                      className="flex-1"
                    >
                      {createProjectMutation.isPending ? "Creating..." : "Create Project"}
                    </Button>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setShowCreateDialog(false)}
                      className="flex-1"
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Projects Grid */}
        {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-slate-200 rounded w-3/4"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-3 bg-slate-200 rounded w-full mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (projects as any[]).length === 0 ? (
          <div className="space-y-8">
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
              <CardContent className="py-8">
                <div className="text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-primary-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-primary-900 mb-2">Welcome to Intralog BOM</h2>
                  <p className="text-primary-700 mb-6 max-w-2xl mx-auto">
                    Transform your rack engineering drawings into comprehensive Bills of Materials with automated vendor mapping and seismic calculations
                  </p>
                  <Button 
                    onClick={() => setShowCreateDialog(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-lg px-8 py-3"
                    size="lg"
                  >
                    <Plus className="w-5 h-5 mr-2" />
                    Start Your First Project
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Process Flow */}
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">How It Works</CardTitle>
                <p className="text-slate-600">Follow these simple steps to generate your rack BOM</p>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-emerald-600 font-bold">1</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">Upload Drawings</h4>
                    <p className="text-sm text-slate-600">Upload your rack elevation and top view PDF drawings</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-blue-600 font-bold">2</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">Extract Data</h4>
                    <p className="text-sm text-slate-600">AI scans for customer info, dimensions, and rack specifications</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-purple-600 font-bold">3</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">Generate BOM</h4>
                    <p className="text-sm text-slate-600">Calculate quantities and map to vendor catalogs</p>
                  </div>
                  <div className="text-center">
                    <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-orange-600 font-bold">4</span>
                    </div>
                    <h4 className="font-semibold text-slate-900 mb-2">Export & Quote</h4>
                    <p className="text-sm text-slate-600">Download BOMs and prepare seismic calculations</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Sample Project */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Try with Sample Project</CardTitle>
                    <p className="text-slate-600 mt-1">Explore the full workflow with pre-loaded Falcon Fulfillment data</p>
                  </div>
                  <Badge variant="secondary">Demo</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="bg-slate-50 rounded-lg p-4 mb-4">
                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-slate-900">Customer:</span>
                      <div className="text-slate-600">Falcon Fulfillment</div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">Drawing:</span>
                      <div className="font-mono text-slate-600">D-241254-R-180</div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-900">Load:</span>
                      <div className="text-slate-600">1,000 lbs | 40"×48"×52"</div>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    // Create sample project with pre-filled data
                    createProjectMutation.mutate({
                      name: "Falcon Fulfillment Rack System",
                      customer: "Falcon Fulfillment", 
                      address: "1065 Conestoga Pkwy, Shepherdsville, KY 40165"
                    });
                  }}
                  disabled={createProjectMutation.isPending}
                >
                  {createProjectMutation.isPending ? "Creating..." : "Create Sample Project"}
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {(projects as any[]).map((project: any) => (
              <Link key={project.id} href={`/projects/${project.id}`}>
                <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    {project.customer && (
                      <div className="flex items-center text-sm text-slate-600">
                        <User className="w-4 h-4 mr-1" />
                        {project.customer}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {project.drawingNo && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-slate-600">Drawing:</span>
                          <Badge variant="outline" className="font-mono text-xs">
                            {project.drawingNo}
                          </Badge>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-600">Created:</span>
                        <div className="flex items-center text-sm text-slate-500">
                          <Calendar className="w-3 h-3 mr-1" />
                          {new Date(project.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      {project.address && (
                        <p className="text-xs text-slate-500 mt-2 line-clamp-2">
                          {project.address}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
