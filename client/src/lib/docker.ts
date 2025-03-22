import { apiRequest } from "./queryClient";
import { queryClient } from "./queryClient";
import { Container, Image, SystemStats } from "@shared/schema";

// Containers
export const fetchContainers = async (): Promise<Container[]> => {
  const response = await apiRequest("GET", "/api/containers", undefined);
  return response.json();
};

export const startContainer = async (id: string): Promise<void> => {
  await apiRequest("POST", `/api/containers/${id}/start`, undefined);
  await queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
};

export const stopContainer = async (id: string): Promise<void> => {
  await apiRequest("POST", `/api/containers/${id}/stop`, undefined);
  await queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
};

export const restartContainer = async (id: string): Promise<void> => {
  await apiRequest("POST", `/api/containers/${id}/restart`, undefined);
  await queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
};

export const deleteContainer = async (id: string): Promise<void> => {
  await apiRequest("DELETE", `/api/containers/${id}`, undefined);
  await queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
};

export const runContainer = async (containerData: {
  image: string;
  name?: string;
  ports?: string;
  volumes?: string;
  env?: string;
  restart?: boolean;
}): Promise<{ containerId: string }> => {
  const response = await apiRequest("POST", "/api/containers", containerData);
  await queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
  return response.json();
};

export const fetchContainerLogs = async (id: string, lines?: number): Promise<string[]> => {
  const queryParam = lines ? `?lines=${lines}` : "";
  const response = await apiRequest("GET", `/api/containers/${id}/logs${queryParam}`, undefined);
  const data = await response.json();
  return data.logs;
};

// Images
export const fetchImages = async (): Promise<Image[]> => {
  const response = await apiRequest("GET", "/api/images", undefined);
  return response.json();
};

export const deleteImage = async (id: string): Promise<void> => {
  await apiRequest("DELETE", `/api/images/${id}`, undefined);
  await queryClient.invalidateQueries({ queryKey: ["/api/images"] });
};

export const pullImage = async (name: string): Promise<void> => {
  await apiRequest("POST", "/api/images/pull", { name });
  await queryClient.invalidateQueries({ queryKey: ["/api/images"] });
};

export const buildImage = async (imageData: {
  name: string;
  tag: string;
  dockerfilePath: string;
  buildContext: string;
  buildArgs?: string;
  dockerfileContent?: string;
}): Promise<void> => {
  await apiRequest("POST", "/api/images/build", imageData);
  await queryClient.invalidateQueries({ queryKey: ["/api/images"] });
};

// System Stats
export const fetchSystemStats = async (): Promise<SystemStats> => {
  const response = await apiRequest("GET", "/api/stats", undefined);
  return response.json();
};

// Helper functions for formatting
export const formatBytes = (bytes: number, decimals = 2): string => {
  if (bytes === 0) return "0 Bytes";
  
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];
  
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
};

export const formatContainerState = (state: string): { label: string, color: string } => {
  switch(state.toLowerCase()) {
    case "running":
      return { label: "Running", color: "bg-green-100 text-green-800" };
    case "paused":
      return { label: "Paused", color: "bg-yellow-100 text-yellow-800" };
    case "exited":
    case "stopped":
      return { label: "Stopped", color: "bg-gray-100 text-gray-800" };
    case "created":
      return { label: "Created", color: "bg-blue-100 text-blue-800" };
    default:
      return { label: state, color: "bg-gray-100 text-gray-800" };
  }
};
