import { useQuery } from "@tanstack/react-query";
import { 
  Cpu, 
  MemoryStick, 
  HardDrive, 
  Server
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { SystemSpecs } from "@shared/schema";
import { Skeleton } from "@/components/ui/skeleton";

export default function SystemSpecsCard() {
  const { 
    data: specs,
    isLoading,
    error 
  } = useQuery<SystemSpecs>({
    queryKey: ["/api/system/specs"],
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Server className="h-5 w-5" />
            <Skeleton className="h-4 w-24" />
          </CardTitle>
          <CardDescription>
            <Skeleton className="h-3 w-48" />
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
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

  if (error || !specs) {
    return (
      <Card className="border-red-200 bg-red-50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg text-red-700">System Specifications</CardTitle>
          <CardDescription className="text-red-600">
            Error loading system data
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Server className="h-5 w-5" />
          System Specifications
        </CardTitle>
        <CardDescription>
          {specs.operatingSystem} ({specs.architecture})
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <Cpu className="h-4 w-4" />
                CPU
              </div>
              <span className="text-xs text-muted-foreground">{specs.cpuCores} cores</span>
            </div>
            <p className="text-xs text-muted-foreground mb-2">{specs.cpuModel}</p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <MemoryStick className="h-4 w-4" />
                Memory
              </div>
              <span className="text-xs text-muted-foreground">
                {specs.availableMemory} MB free of {specs.totalMemory} MB
              </span>
            </div>
            <Progress value={specs.memoryUsage} className="h-2 w-full" />
            <p className="text-xs text-muted-foreground mt-1">
              {specs.memoryUsage}% used
            </p>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1 text-sm font-medium">
                <HardDrive className="h-4 w-4" />
                Disk
              </div>
              <span className="text-xs text-muted-foreground">
                {specs.diskFree} GB free of {specs.diskTotal} GB
              </span>
            </div>
            {specs.diskTotal > 0 && (
              <>
                <Progress 
                  value={(specs.diskUsed / specs.diskTotal) * 100} 
                  className="h-2 w-full" 
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {Math.round((specs.diskUsed / specs.diskTotal) * 100)}% used
                </p>
              </>
            )}
          </div>

          <div className="text-xs text-muted-foreground">
            <p>Kernel: {specs.kernelVersion}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}