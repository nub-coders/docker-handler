import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Container } from "@shared/schema";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Play,
  Square,
  FileText,
  Trash2,
  RefreshCw,
  Box,
  MoreHorizontal,
  AlertCircle,
  RotateCw
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LogViewer from "./log-viewer";

interface ContainerListProps {
  containers: Container[];
  selectedFilter: string;
  setSelectedFilter: (filter: string) => void;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refreshData: () => void;
}

export default function ContainerList({
  containers,
  selectedFilter,
  setSelectedFilter,
  searchTerm,
  setSearchTerm,
  refreshData,
}: ContainerListProps) {
  const { toast } = useToast();
  const [selectedContainer, setSelectedContainer] = useState<Container | null>(null);
  const [isLogViewerOpen, setIsLogViewerOpen] = useState(false);
  const [containerToDelete, setContainerToDelete] = useState<Container | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedContainers, setSelectedContainers] = useState<string[]>([]);
  const [isBulkActionDialogOpen, setIsBulkActionDialogOpen] = useState(false);
  const [bulkAction, setBulkAction] = useState<'start' | 'stop' | 'delete' | null>(null);

  // Start container mutation
  const startContainerMutation = useMutation({
    mutationFn: async (containerId: string) => {
      const res = await apiRequest("POST", `/api/containers/${containerId}/start`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Container started successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start container",
        variant: "destructive",
      });
    },
  });

  // Stop container mutation
  const stopContainerMutation = useMutation({
    mutationFn: async (containerId: string) => {
      const res = await apiRequest("POST", `/api/containers/${containerId}/stop`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Container stopped successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop container",
        variant: "destructive",
      });
    },
  });

  // Delete container mutation
  const deleteContainerMutation = useMutation({
    mutationFn: async (containerId: string) => {
      const res = await apiRequest("DELETE", `/api/containers/${containerId}`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Container deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/stats"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete container",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });
  
  // Restart container mutation - stops then starts the container
  const restartContainerMutation = useMutation({
    mutationFn: async (containerId: string) => {
      // First stop the container
      const stopRes = await apiRequest("POST", `/api/containers/${containerId}/stop`);
      await stopRes.json();
      
      // Then start it again
      const startRes = await apiRequest("POST", `/api/containers/${containerId}/start`);
      return startRes.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Container restarted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/stats"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to restart container",
        variant: "destructive",
      });
    },
  });
  
  // Bulk action mutations
  const bulkStartContainersMutation = useMutation({
    mutationFn: async (containerIds: string[]) => {
      const res = await apiRequest("POST", "/api/containers/batch/start", { ids: containerIds });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Selected containers started successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/stats"] });
      setSelectedContainers([]);
      setIsBulkActionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start selected containers",
        variant: "destructive",
      });
      setIsBulkActionDialogOpen(false);
    },
  });
  
  const bulkStopContainersMutation = useMutation({
    mutationFn: async (containerIds: string[]) => {
      const res = await apiRequest("POST", "/api/containers/batch/stop", { ids: containerIds });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Selected containers stopped successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/stats"] });
      setSelectedContainers([]);
      setIsBulkActionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to stop selected containers",
        variant: "destructive",
      });
      setIsBulkActionDialogOpen(false);
    },
  });
  
  const bulkDeleteContainersMutation = useMutation({
    mutationFn: async (containerIds: string[]) => {
      const res = await apiRequest("DELETE", "/api/containers/batch", { ids: containerIds });
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Selected containers deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/containers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/containers/stats"] });
      setSelectedContainers([]);
      setIsBulkActionDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete selected containers",
        variant: "destructive",
      });
      setIsBulkActionDialogOpen(false);
    },
  });

  const handleStartContainer = (container: Container) => {
    startContainerMutation.mutate(container.id);
  };

  const handleStopContainer = (container: Container) => {
    stopContainerMutation.mutate(container.id);
  };

  const handleShowLogs = (container: Container) => {
    setSelectedContainer(container);
    setIsLogViewerOpen(true);
  };

  const handleDeleteContainer = (container: Container) => {
    setContainerToDelete(container);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteContainer = () => {
    if (containerToDelete) {
      deleteContainerMutation.mutate(containerToDelete.id);
    }
  };
  
  const handleRestartContainer = (container: Container) => {
    toast({
      title: "Restarting container",
      description: `Restarting container ${container.name}...`,
    });
    restartContainerMutation.mutate(container.id);
  };
  
  // Bulk action handlers
  const handleSelectContainer = (containerId: string, checked: boolean) => {
    if (checked) {
      setSelectedContainers(prev => [...prev, containerId]);
    } else {
      setSelectedContainers(prev => prev.filter(id => id !== containerId));
    }
  };
  
  const handleSelectAllContainers = (checked: boolean) => {
    if (checked) {
      const allIds = containers.map(container => container.id);
      setSelectedContainers(allIds);
    } else {
      setSelectedContainers([]);
    }
  };
  
  const confirmBulkAction = () => {
    if (selectedContainers.length === 0) {
      toast({
        title: "No containers selected",
        description: "Please select at least one container",
        variant: "destructive",
      });
      return;
    }
    
    if (bulkAction === 'start') {
      bulkStartContainersMutation.mutate(selectedContainers);
    } else if (bulkAction === 'stop') {
      bulkStopContainersMutation.mutate(selectedContainers);
    } else if (bulkAction === 'delete') {
      bulkDeleteContainersMutation.mutate(selectedContainers);
    }
  };
  
  const openBulkActionDialog = (action: 'start' | 'stop' | 'delete') => {
    if (selectedContainers.length === 0) {
      toast({
        title: "No containers selected",
        description: "Please select at least one container",
        variant: "destructive",
      });
      return;
    }
    
    setBulkAction(action);
    setIsBulkActionDialogOpen(true);
  };

  const formatCreatedTime = (created: string) => {
    try {
      // Try to parse as date directly
      const date = new Date(created);
      if (!isNaN(date.getTime())) {
        // Check if it's within the last day
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
          return `${Math.floor(diffInHours * 60)} minutes ago`;
        } else if (diffInHours < 24) {
          return `${Math.floor(diffInHours)} hours ago`;
        } else if (diffInHours < 48) {
          return "1 day ago";
        } else {
          return `${Math.floor(diffInHours / 24)} days ago`;
        }
      }
      
      // If the date is not a valid date object, return the original string
      return created;
    } catch (error) {
      // If parsing fails, return the original string
      return created;
    }
  };

  const formatPorts = (ports: string[] | undefined) => {
    if (!ports || ports.length === 0) return "None";
    return ports.join(", ");
  };

  return (
    <>
      <Card className="mb-6">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="font-medium text-slate-800">Containers</h3>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search containers..."
                className="pl-8 pr-3 py-1.5 w-full md:w-64 h-9"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-slate-400 absolute left-2.5 top-1/2 transform -translate-y-1/2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <div className="relative">
              <Select value={selectedFilter} onValueChange={setSelectedFilter}>
                <SelectTrigger className="w-32 h-9">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={refreshData}
              size="sm"
              className="flex items-center h-9"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead className="w-[50px]">
                  <Checkbox 
                    checked={containers.length > 0 && selectedContainers.length === containers.length}
                    onCheckedChange={handleSelectAllContainers}
                    aria-label="Select all containers"
                  />
                </TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Image</TableHead>
                <TableHead>Ports</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {containers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No containers found
                  </TableCell>
                </TableRow>
              ) : (
                containers.map((container) => (
                  <TableRow key={container.id} className="hover:bg-slate-50">
                    <TableCell className="w-[50px]">
                      <Checkbox 
                        checked={selectedContainers.includes(container.id)}
                        onCheckedChange={(checked) => handleSelectContainer(container.id, checked === true)}
                        aria-label={`Select container ${container.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        <Box className="text-lg text-slate-500 mr-2 h-5 w-5" />
                        <div className="text-sm font-medium text-slate-900">
                          {container.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={`${
                          container.state === "running"
                            ? "bg-green-100 text-green-800 hover:bg-green-100"
                            : "bg-red-100 text-red-800 hover:bg-red-100"
                        }`}
                      >
                        {container.state === "running" ? "Running" : "Stopped"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {container.image}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatPorts(container.ports)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatCreatedTime(container.created)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {container.state === "running" ? (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-red-500 hover:text-red-700 hover:bg-transparent"
                            onClick={() => handleStopContainer(container)}
                            disabled={stopContainerMutation.isPending}
                          >
                            <Square className="h-5 w-5" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-green-500 hover:text-green-700 hover:bg-transparent"
                            onClick={() => handleStartContainer(container)}
                            disabled={startContainerMutation.isPending}
                          >
                            <Play className="h-5 w-5" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:text-slate-700 hover:bg-transparent"
                          onClick={() => handleShowLogs(container)}
                        >
                          <FileText className="h-5 w-5" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-slate-500 hover:text-slate-700 hover:bg-transparent"
                            >
                              <MoreHorizontal className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {container.state === "running" ? (
                              <DropdownMenuItem 
                                onClick={() => handleStopContainer(container)}
                                disabled={stopContainerMutation.isPending}
                                className="cursor-pointer"
                              >
                                <Square className="h-4 w-4 mr-2 text-red-500" />
                                Stop Container
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem 
                                onClick={() => handleStartContainer(container)}
                                disabled={startContainerMutation.isPending}
                                className="cursor-pointer"
                              >
                                <Play className="h-4 w-4 mr-2 text-green-500" />
                                Start Container
                              </DropdownMenuItem>
                            )}
                            
                            {container.state === "running" && (
                              <DropdownMenuItem 
                                onClick={() => handleRestartContainer(container)}
                                disabled={restartContainerMutation.isPending}
                                className="cursor-pointer"
                              >
                                <RotateCw className="h-4 w-4 mr-2 text-blue-500" />
                                Restart Container
                              </DropdownMenuItem>
                            )}
                            
                            <DropdownMenuItem 
                              onClick={() => handleShowLogs(container)}
                              className="cursor-pointer"
                            >
                              <FileText className="h-4 w-4 mr-2 text-slate-500" />
                              View Logs
                            </DropdownMenuItem>
                            
                            <DropdownMenuSeparator />
                            
                            <DropdownMenuItem 
                              onClick={() => handleDeleteContainer(container)}
                              disabled={deleteContainerMutation.isPending}
                              className="text-red-500 cursor-pointer"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Container
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="text-sm text-slate-500">
            <span className="font-medium">{selectedContainers.length}</span> containers selected
          </div>
          
          {selectedContainers.length > 0 && (
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                className="text-green-600 border-green-600 hover:bg-green-50"
                onClick={() => openBulkActionDialog('start')}
                disabled={bulkStartContainersMutation.isPending}
              >
                <Play className="h-3.5 w-3.5 mr-1" />
                Start Selected
              </Button>
              <Button
                variant="outline"
                size="sm" 
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => openBulkActionDialog('stop')}
                disabled={bulkStopContainersMutation.isPending}
              >
                <Square className="h-3.5 w-3.5 mr-1" />
                Stop Selected
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="text-red-600 border-red-600 hover:bg-red-50"
                onClick={() => openBulkActionDialog('delete')}
                disabled={bulkDeleteContainersMutation.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />
                Delete Selected
              </Button>
            </div>
          )}
        </div>
      </Card>

      {selectedContainer && (
        <LogViewer
          container={selectedContainer}
          isOpen={isLogViewerOpen}
          onClose={() => setIsLogViewerOpen(false)}
        />
      )}

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Delete Container
            </AlertDialogTitle>
            <AlertDialogDescription>
              {containerToDelete && containerToDelete.state === "running" ? (
                <div>
                  <p className="mb-2">
                    This container is currently running. It will be stopped before deletion.
                  </p>
                  <p>
                    Are you sure you want to delete <span className="font-medium">{containerToDelete?.name}</span>?
                    This action cannot be undone.
                  </p>
                </div>
              ) : (
                <p>
                  Are you sure you want to delete <span className="font-medium">{containerToDelete?.name}</span>?
                  This action cannot be undone.
                </p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteContainerMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteContainer}
              disabled={deleteContainerMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteContainerMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Dialog */}
      <AlertDialog open={isBulkActionDialogOpen} onOpenChange={setIsBulkActionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              {bulkAction === 'start' && "Start Selected Containers"}
              {bulkAction === 'stop' && "Stop Selected Containers"}
              {bulkAction === 'delete' && "Delete Selected Containers"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === 'start' && (
                <p>
                  Are you sure you want to start the {selectedContainers.length} selected containers?
                </p>
              )}
              {bulkAction === 'stop' && (
                <p>
                  Are you sure you want to stop the {selectedContainers.length} selected containers?
                  Any processes running inside will be terminated.
                </p>
              )}
              {bulkAction === 'delete' && (
                <div>
                  <p className="mb-2">
                    Running containers will be stopped before deletion.
                  </p>
                  <p>
                    Are you sure you want to delete the {selectedContainers.length} selected containers?
                    This action cannot be undone.
                  </p>
                </div>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={
              bulkStartContainersMutation.isPending || 
              bulkStopContainersMutation.isPending || 
              bulkDeleteContainersMutation.isPending
            }>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmBulkAction}
              disabled={
                bulkStartContainersMutation.isPending || 
                bulkStopContainersMutation.isPending || 
                bulkDeleteContainersMutation.isPending
              }
              className={bulkAction === 'delete' ? "bg-red-500 hover:bg-red-600" : ""}
            >
              {bulkAction === 'start' && (bulkStartContainersMutation.isPending ? "Starting..." : "Start")}
              {bulkAction === 'stop' && (bulkStopContainersMutation.isPending ? "Stopping..." : "Stop")}
              {bulkAction === 'delete' && (bulkDeleteContainersMutation.isPending ? "Deleting..." : "Delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
