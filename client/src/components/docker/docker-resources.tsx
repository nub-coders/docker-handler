import { useQuery } from "@tanstack/react-query";
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Network, 
  Container 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { DockerResources } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function DockerResourcesCard() {
  const { 
    data: resources,
    isLoading,
    error 
  } = useQuery<DockerResources>({
    queryKey: ["/api/docker/resources"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Container className="h-5 w-5" />
            <Skeleton className="h-4 w-36" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-3 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <div className="flex items-center justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-12" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !resources) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-red-700">Docker Resource Usage</CardTitle>
          <CardDescription className="text-red-600">
            Error loading Docker resource data
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Container className="h-5 w-5" />
          Docker Resource Usage
        </CardTitle>
        <CardDescription>
          Resource consumption by Docker containers
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Cpu className="h-4 w-4" />
                CPU Usage
              </div>
              <span className="text-xs text-muted-foreground">{resources.cpuUsage}%</span>
            </div>
            <Progress value={resources.cpuUsage} className="h-2 w-full" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <MemoryStick className="h-4 w-4" />
                Memory Usage
              </div>
              <span className="text-xs text-muted-foreground">
                {resources.memoryUsage} MB ({resources.memoryPercentage}%)
              </span>
            </div>
            <Progress value={resources.memoryPercentage} className="h-2 w-full" />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <HardDrive className="h-4 w-4" />
                Disk Usage
              </div>
              <span className="text-xs text-muted-foreground">
                {resources.diskUsage.toFixed(2)} GB
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Network className="h-4 w-4" />
                Network I/O
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="text-xs">
                <span className="text-green-600 font-medium">↓</span> {(resources.networkRx / 1024).toFixed(2)} MB
              </div>
              <div className="text-xs text-right">
                <span className="text-blue-600 font-medium">↑</span> {(resources.networkTx / 1024).toFixed(2)} MB
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}