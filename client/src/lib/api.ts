import { useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "./queryClient";

export interface User {
  id: string;
  email: string;
}

// Authentication
export async function login(email: string, password: string): Promise<{ user: User }> {
  const response = await apiRequest("POST", "/api/auth/login", { email, password });
  const result = await response.json();
  // Invalidate auth query to refresh user state
  queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  return result;
}

export async function register(email: string, password: string): Promise<{ user: User }> {
  const response = await apiRequest("POST", "/api/auth/register", { email, password });
  const result = await response.json();
  // Invalidate auth query to refresh user state
  queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
  return result;
}

export async function logout(): Promise<void> {
  await apiRequest("POST", "/api/auth/logout");
  // Invalidate auth query to clear user state
  queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
}

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/auth/me"],
    retry: false,
  });

  return {
    user: (data as any)?.user,
    isLoading,
    error,
  };
}

// Projects
export async function createProject(projectData: any): Promise<any> {
  const response = await apiRequest("POST", "/api/projects", projectData);
  return response.json();
}

export async function uploadFile(projectId: string, file: File): Promise<any> {
  const formData = new FormData();
  formData.append('pdf', file);

  const response = await fetch(`/api/projects/${projectId}/files`, {
    method: 'POST',
    body: formData,
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response.json();
}

export async function deleteFile(projectId: string, fileId: string): Promise<any> {
  const response = await apiRequest("DELETE", `/api/projects/${projectId}/files/${fileId}`);
  return response.json();
}

export async function reparseProject(projectId: string): Promise<any> {
  const response = await apiRequest("POST", `/api/projects/${projectId}/parse`);
  return response.json();
}

export async function generateBOM(projectId: string, vendors: string[]): Promise<any> {
  const response = await apiRequest("POST", `/api/projects/${projectId}/bom`, { vendors });
  return response.json();
}

export async function exportBOM(projectId: string, format: string, vendor?: string): Promise<Blob> {
  const params = new URLSearchParams({ format });
  if (vendor) params.append('vendor', vendor);

  const response = await fetch(`/api/projects/${projectId}/bom/export?${params}`, {
    credentials: 'include',
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`${response.status}: ${text}`);
  }

  return response.blob();
}
