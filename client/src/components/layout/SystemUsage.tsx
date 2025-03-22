import { useQuery } from "@tanstack/react-query";
import { fetchSystemStats, formatBytes } from "@/lib/docker";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

const SystemUsage = () => {
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ["/api/stats"],
    queryFn: fetchSystemStats,
    refetchInterval: 10000, // Refetch every 10 seconds
  });

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-medium text-gray-800 mb-3">System Usage</h2>
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i}>
              <div className="flex justify-between text-sm mb-1">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
              <Skeleton className="h-2.5 w-full" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-medium text-gray-800 mb-3">System Usage</h2>
        <div className="text-red-500 text-sm">Error loading system stats</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <h2 className="text-lg font-medium text-gray-800 mb-3">System Usage</h2>
      <div className="space-y-4">
        {/* CPU Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">CPU Usage</span>
            <span className="font-medium text-gray-700">{stats.cpu.usage}%</span>
          </div>
          <Progress value={stats.cpu.usage} className="h-2.5 bg-gray-200" indicatorClassName="bg-primary-600" />
        </div>
        
        {/* RAM Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">RAM Usage</span>
            <span className="font-medium text-gray-700">
              {formatBytes(stats.memory.used)} / {formatBytes(stats.memory.total)}
            </span>
          </div>
          <Progress value={stats.memory.percent} className="h-2.5 bg-gray-200" indicatorClassName="bg-secondary-400" />
        </div>
        
        {/* Storage Usage */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Storage</span>
            <span className="font-medium text-gray-700">
              {formatBytes(stats.storage.used)} / {formatBytes(stats.storage.total)}
            </span>
          </div>
          <Progress value={stats.storage.percent} className="h-2.5 bg-gray-200" indicatorClassName="bg-yellow-500" />
        </div>
        
        {/* Docker Space */}
        <div>
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-500">Docker Space</span>
            <span className="font-medium text-gray-700">
              {formatBytes(stats.docker.used)} / {formatBytes(stats.docker.total)}
            </span>
          </div>
          <Progress value={stats.docker.percent} className="h-2.5 bg-gray-200" indicatorClassName="bg-green-500" />
        </div>
      </div>
    </div>
  );
};

export default SystemUsage;
