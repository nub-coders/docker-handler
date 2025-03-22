import { useQuery } from "@tanstack/react-query";
import { fetchContainers, fetchImages, restartContainer, stopContainer } from "@/lib/docker";
import { formatContainerState, formatBytes } from "@/lib/docker";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

type DashboardProps = {
  onTabChange: (tab: string) => void;
};

const Dashboard = ({ onTabChange }: DashboardProps) => {
  const { toast } = useToast();

  const { 
    data: containers, 
    isLoading: containersLoading, 
    error: containersError 
  } = useQuery({
    queryKey: ["/api/containers"],
    queryFn: fetchContainers,
  });

  const { 
    data: images, 
    isLoading: imagesLoading, 
    error: imagesError 
  } = useQuery({
    queryKey: ["/api/images"],
    queryFn: fetchImages,
  });

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

  const handleViewLogs = (id: string) => {
    // Set the container ID to view logs and navigate to logs tab
    localStorage.setItem("selectedContainerId", id);
    onTabChange("logs");
  };

  // Count running and stopped containers
  const runningContainers = containers?.filter(c => c.state.toLowerCase() === "running").length || 0;
  const stoppedContainers = containers?.filter(c => c.state.toLowerCase() !== "running").length || 0;
  const totalImages = images?.length || 0;
  const volumes = 6; // Mock for now as it's shown in the design

  return (
    <div>
      <Card className="mb-6">
        <CardContent className="p-6">
          <h2 className="text-lg font-medium text-gray-800 mb-4">Docker Overview</h2>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {/* Stats cards */}
            <div className="bg-primary-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-primary-100 p-3 mr-4">
                  <i className="ri-inbox-line text-xl text-primary-600"></i>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Running Containers</p>
                  {containersLoading ? (
                    <Skeleton className="h-8 w-8 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-800">{runningContainers}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-green-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-green-100 p-3 mr-4">
                  <i className="ri-pause-circle-line text-xl text-green-600"></i>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Stopped Containers</p>
                  {containersLoading ? (
                    <Skeleton className="h-8 w-8 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-800">{stoppedContainers}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-blue-100 p-3 mr-4">
                  <i className="ri-file-list-3-line text-xl text-blue-600"></i>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Docker Images</p>
                  {imagesLoading ? (
                    <Skeleton className="h-8 w-8 mt-1" />
                  ) : (
                    <p className="text-2xl font-semibold text-gray-800">{totalImages}</p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="bg-yellow-50 rounded-lg p-4">
              <div className="flex items-center">
                <div className="rounded-full bg-yellow-100 p-3 mr-4">
                  <i className="ri-hard-drive-2-line text-xl text-yellow-600"></i>
                </div>
                <div>
                  <p className="text-gray-500 text-sm">Volumes</p>
                  <p className="text-2xl font-semibold text-gray-800">{volumes}</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Recent activity */}
          <h3 className="text-md font-medium text-gray-800 mb-3">Recent Activity</h3>
          <div className="bg-gray-50 rounded-lg p-4 overflow-hidden">
            {containersLoading || imagesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-start">
                    <Skeleton className="h-4 w-4 mt-1 mr-2" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-full mb-1" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))}
              </div>
            ) : containersError || imagesError ? (
              <div className="text-red-500 text-sm">Error loading activity data</div>
            ) : (
              <ul className="space-y-3 max-h-60 overflow-y-auto">
                {containers?.slice(0, 5).map((container, index) => (
                  <li key={container.id} className="text-sm text-gray-600 flex items-start">
                    <i className="ri-time-line mt-1 mr-2 text-gray-400"></i>
                    <div>
                      <p><span className="text-gray-900 font-medium">{container.name}</span> container {container.state.toLowerCase()}</p>
                      <p className="text-xs text-gray-500">{index * 10 + 2} minutes ago</p>
                    </div>
                  </li>
                ))}
                {images?.slice(0, 3).map((image, index) => (
                  <li key={image.id} className="text-sm text-gray-600 flex items-start">
                    <i className="ri-time-line mt-1 mr-2 text-gray-400"></i>
                    <div>
                      <p><span className="text-gray-900 font-medium">{image.repository}:{image.tag}</span> image pulled</p>
                      <p className="text-xs text-gray-500">{index * 20 + 15} minutes ago</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Quick access: Running Containers */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-gray-800">Running Containers</h2>
            <Button
              variant="link"
              className="text-sm text-primary-600 hover:text-primary-800 flex items-center"
              onClick={() => onTabChange("containers")}
            >
              View all <i className="ri-arrow-right-line ml-1"></i>
            </Button>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPU</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Memory</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {containersLoading ? (
                  [...Array(2)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-24" />
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
                        <div className="flex space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : containersError ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-red-500 text-sm">Error loading containers</td>
                  </tr>
                ) : containers?.filter(c => c.state.toLowerCase() === "running").length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-3 text-gray-500 text-sm text-center">No running containers</td>
                  </tr>
                ) : (
                  containers?.filter(c => c.state.toLowerCase() === "running").map(container => (
                    <tr key={container.id}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="text-sm font-medium text-gray-900">{container.name}</div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${formatContainerState(container.state).color}`}>
                          {formatContainerState(container.state).label}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {container.stats?.cpu_percent ? `${container.stats.cpu_percent.toFixed(2)}%` : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {container.stats?.memory_usage ? formatBytes(container.stats.memory_usage) : "-"}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
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
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
