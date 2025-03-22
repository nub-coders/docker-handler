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
import { Play, Square, FileText, MoreHorizontal, RefreshCw, Box } from "lucide-react";
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
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-slate-500 hover:text-slate-700 hover:bg-transparent"
                        >
                          <MoreHorizontal className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium">1</span> to{" "}
            <span className="font-medium">{containers.length}</span> of{" "}
            <span className="font-medium">{containers.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={true}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={true}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      {selectedContainer && (
        <LogViewer
          container={selectedContainer}
          isOpen={isLogViewerOpen}
          onClose={() => setIsLogViewerOpen(false)}
        />
      )}
    </>
  );
}
