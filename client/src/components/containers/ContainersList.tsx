import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  fetchContainers, 
  startContainer, 
  stopContainer, 
  restartContainer, 
  deleteContainer,
  formatContainerState,
  formatBytes
} from "@/lib/docker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import RunContainerModal from "./RunContainerModal";

type ContainersListProps = {
  onTabChange: (tab: string) => void;
};

const ContainersList = ({ onTabChange }: ContainersListProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isRunModalOpen, setIsRunModalOpen] = useState(false);

  const { 
    data: containers, 
    isLoading, 
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/containers"],
    queryFn: fetchContainers,
  });

  const handleStartContainer = async (id: string, name: string) => {
    try {
      await startContainer(id);
      toast({
        title: "Container started",
        description: `Container ${name} has been started successfully.`
      });
    } catch (error) {
      toast({
        title: "Failed to start container",
        description: `An error occurred while starting ${name}.`,
        variant: "destructive"
      });
    }
  };

  const handleStopContainer = async (id: string, name: string) => {
    try {
      await stopContainer(id);
      toast({
        title: "Container stopped",
        description: `Container ${name} has been stopped successfully.`
      });
    } catch (error) {
      toast({
        title: "Failed to stop container",
        description: `An error occurred while stopping ${name}.`,
        variant: "destructive"
      });
    }
  };

  const handleRestartContainer = async (id: string, name: string) => {
    try {
      await restartContainer(id);
      toast({
        title: "Container restarted",
        description: `Container ${name} has been restarted successfully.`
      });
    } catch (error) {
      toast({
        title: "Failed to restart container",
        description: `An error occurred while restarting ${name}.`,
        variant: "destructive"
      });
    }
  };

  const handleDeleteContainer = async (id: string, name: string) => {
    try {
      await deleteContainer(id);
      toast({
        title: "Container deleted",
        description: `Container ${name} has been deleted successfully.`
      });
    } catch (error) {
      toast({
        title: "Failed to delete container",
        description: `An error occurred while deleting ${name}.`,
        variant: "destructive"
      });
    }
  };

  const handleViewLogs = (id: string) => {
    localStorage.setItem("selectedContainerId", id);
    onTabChange("logs");
  };

  // Filter containers based on search query and status
  const filteredContainers = containers?.filter(container => {
    const matchesSearch = container.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        container.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || 
                        (statusFilter === "running" && container.state.toLowerCase() === "running") ||
                        (statusFilter === "stopped" && container.state.toLowerCase() !== "running");
    return matchesSearch && matchesStatus;
  });

  return (
    <>
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-medium text-gray-800">Container Management</h2>
            <Button 
              onClick={() => setIsRunModalOpen(true)}
              className="bg-primary-600 hover:bg-primary-700 text-white"
            >
              <i className="ri-add-line mr-1"></i> Run New Container
            </Button>
          </div>
          
          {/* Container search and filter controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="ri-search-line text-gray-400"></i>
              </div>
              <Input
                type="search"
                placeholder="Search containers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="running">Running</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                onClick={() => refetch()}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700"
              >
                <i className="ri-refresh-line mr-1"></i> Refresh
              </Button>
            </div>
          </div>
          
          {/* Containers list table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Storage</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-12" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-3 text-red-500 text-sm">Error loading containers</td>
                  </tr>
                ) : filteredContainers?.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-4 py-3 text-gray-500 text-sm text-center">No containers found</td>
                  </tr>
                ) : (
                  filteredContainers?.map(container => {
                    const isRunning = container.state.toLowerCase() === "running";
                    return (
                      <tr key={container.id} className={!isRunning ? "bg-gray-50" : ""}>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{container.id.slice(0, 5)}...</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{container.name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{container.image}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${formatContainerState(container.state).color}`}>
                            {formatContainerState(container.state).label}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {isRunning && container.stats?.cpu_percent ? `${container.stats.cpu_percent.toFixed(2)}%` : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {isRunning && container.stats?.memory_usage ? formatBytes(container.stats.memory_usage) : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                          {isRunning && container.stats?.storage_usage ? formatBytes(container.stats.storage_usage) : "-"}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            {isRunning ? (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Restart" 
                                  onClick={() => handleRestartContainer(container.id, container.name)}
                                  className="text-gray-500 hover:text-gray-700"
                                >
                                  <i className="ri-restart-line"></i>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Stop" 
                                  onClick={() => handleStopContainer(container.id, container.name)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <i className="ri-stop-circle-line"></i>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="View Logs" 
                                  onClick={() => handleViewLogs(container.id)}
                                  className="text-primary-500 hover:text-primary-700"
                                >
                                  <i className="ri-file-text-line"></i>
                                </Button>
                              </>
                            ) : (
                              <>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Start" 
                                  onClick={() => handleStartContainer(container.id, container.name)}
                                  className="text-green-500 hover:text-green-700"
                                >
                                  <i className="ri-play-circle-line"></i>
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  title="Delete" 
                                  onClick={() => handleDeleteContainer(container.id, container.name)}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <i className="ri-delete-bin-line"></i>
                                </Button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <RunContainerModal
        isOpen={isRunModalOpen}
        onClose={() => setIsRunModalOpen(false)}
      />
    </>
  );
};

export default ContainersList;
