import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchContainers, fetchContainerLogs } from "@/lib/docker";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const LogsViewer = () => {
  const [selectedContainer, setSelectedContainer] = useState<string>("");
  const [autoRefresh, setAutoRefresh] = useState<boolean>(false);
  const [logLines, setLogLines] = useState<string>("100");
  const logsContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check if there's a selected container ID from another view
    const containerId = localStorage.getItem("selectedContainerId");
    if (containerId) {
      setSelectedContainer(containerId);
      localStorage.removeItem("selectedContainerId");
    }
  }, []);

  const { 
    data: containers, 
    isLoading: containersLoading 
  } = useQuery({
    queryKey: ["/api/containers"],
    queryFn: fetchContainers,
  });

  const { 
    data: logs, 
    isLoading: logsLoading,
    error: logsError,
    refetch: refetchLogs
  } = useQuery({
    queryKey: ["/api/containers", selectedContainer, "logs", logLines],
    queryFn: () => fetchContainerLogs(selectedContainer, logLines === "all" ? undefined : parseInt(logLines)),
    enabled: !!selectedContainer && selectedContainer !== "placeholder",
    refetchInterval: autoRefresh ? 3000 : false, // Refresh every 3 seconds if auto-refresh is enabled
  });

  useEffect(() => {
    if (logsContainerRef.current && logs) {
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  const handleDownloadLogs = () => {
    if (!logs) return;
    
    const logText = logs.join('\n');
    const blob = new Blob([logText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedContainer}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getLogClass = (log: string): string => {
    if (log.includes('[error]') || log.includes('ERROR') || log.includes('Error'))
      return 'text-red-400';
    if (log.includes('[warn]') || log.includes('WARN') || log.includes('Warning'))
      return 'text-yellow-400';
    return 'text-white';
  };

  return (
    <Card className="mb-6">
      <CardContent className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium text-gray-800">Container Logs</h2>
          <Select value={selectedContainer} onValueChange={setSelectedContainer}>
            <SelectTrigger id="container-log-selector" className="w-[200px]">
              <SelectValue placeholder="Select container" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="placeholder">Select container</SelectItem>
              {containersLoading ? (
                <SelectItem value="loading" disabled>Loading containers...</SelectItem>
              ) : containers && containers.length > 0 ? (
                containers.map(container => (
                  <SelectItem key={container.id} value={container.id}>
                    {container.name}
                  </SelectItem>
                ))
              ) : (
                <SelectItem value="no-containers" disabled>No containers available</SelectItem>
              )}
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center gap-2 mb-4">
          <div className="flex items-center mr-4">
            <Switch
              id="auto-refresh"
              checked={autoRefresh}
              onCheckedChange={setAutoRefresh}
            />
            <Label htmlFor="auto-refresh" className="ml-2 text-sm font-medium text-gray-700">Auto-refresh</Label>
          </div>
          <Select value={logLines} onValueChange={setLogLines}>
            <SelectTrigger id="log-lines" className="w-[150px]">
              <SelectValue placeholder="Log lines" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="50">Last 50 lines</SelectItem>
              <SelectItem value="100">Last 100 lines</SelectItem>
              <SelectItem value="200">Last 200 lines</SelectItem>
              <SelectItem value="all">All logs</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            onClick={handleDownloadLogs}
            disabled={!logs || logs.length === 0}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700"
          >
            <i className="ri-download-line mr-1"></i> Download Logs
          </Button>
        </div>
        
        <div 
          ref={logsContainerRef}
          className="bg-gray-900 text-white rounded-lg p-4 h-96 overflow-y-auto font-mono text-sm logs-container"
          style={{ scrollBehavior: 'smooth' }}
        >
          {!selectedContainer || selectedContainer === "placeholder" ? (
            <div className="text-gray-400 h-full flex items-center justify-center">
              Select a container to view logs
            </div>
          ) : logsLoading ? (
            <div className="space-y-1">
              {[...Array(10)].map((_, i) => (
                <Skeleton key={i} className="h-4 w-full bg-gray-800" />
              ))}
            </div>
          ) : logsError ? (
            <div className="text-red-500">
              Error loading logs. Make sure the container is running.
            </div>
          ) : logs && logs.length > 0 ? (
            <div className="logs-content">
              {logs.map((log, index) => (
                <div key={index} className={`mb-1 ${getLogClass(log)}`}>{log}</div>
              ))}
            </div>
          ) : (
            <div className="text-gray-400 h-full flex items-center justify-center">
              No logs available for this container
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default LogsViewer;
