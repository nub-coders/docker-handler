import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/layout/header";
import Sidebar from "@/components/layout/sidebar";
import StatsCard from "@/components/docker/stats-card";
import ContainerList from "@/components/docker/container-list";
import { Container, ContainerStats } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  // Fetch containers
  const {
    data: containers = [],
    isLoading: containersLoading,
    error: containersError,
    refetch: refetchContainers,
  } = useQuery<Container[]>({
    queryKey: ["/api/containers"],
  });

  // Fetch stats
  const {
    data: stats = { total: 0, running: 0, stopped: 0 },
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<ContainerStats>({
    queryKey: ["/api/containers/stats"],
  });

  // Apply filters and search
  const filteredContainers = containers.filter((container) => {
    const matchesFilter =
      selectedFilter === "all" || 
      (selectedFilter === "running" && container.state === "running") || 
      (selectedFilter === "stopped" && container.state !== "running");
    
    const matchesSearch = 
      !searchTerm || 
      container.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      container.image.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesFilter && matchesSearch;
  });

  const refreshData = () => {
    refetchContainers();
    refetchStats();
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      <Sidebar isMobileMenuOpen={isMobileMenuOpen} toggleMobileMenu={toggleMobileMenu} />
      
      <div className="flex-1 flex flex-col">
        <Header toggleMobileMenu={toggleMobileMenu} />
        
        <main className="flex-1 overflow-y-auto bg-slate-100 p-4 md:p-6 pb-16 md:pb-6">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Container Dashboard</h2>
            <p className="text-slate-500">Manage your Docker containers</p>
          </div>
          
          {(containersLoading || statsLoading) ? (
            <div className="flex justify-center items-center h-64">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : containersError ? (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded relative mb-6">
              <strong className="font-bold">Error! </strong>
              <span className="block sm:inline">Failed to fetch containers. Please try again.</span>
            </div>
          ) : (
            <>
              <div className="mb-6 flex flex-wrap gap-4">
                <StatsCard 
                  title="Total Containers" 
                  value={stats.total} 
                  icon="cube" 
                  iconColor="blue" 
                />
                <StatsCard 
                  title="Running" 
                  value={stats.running} 
                  icon="play" 
                  iconColor="green" 
                />
                <StatsCard 
                  title="Stopped" 
                  value={stats.stopped} 
                  icon="square" 
                  iconColor="red" 
                />
              </div>
              
              <ContainerList 
                containers={filteredContainers}
                selectedFilter={selectedFilter}
                setSelectedFilter={setSelectedFilter}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                refreshData={refreshData}
              />
            </>
          )}
        </main>
        
        {/* Mobile bottom navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-2 z-30">
          <div className="flex items-center justify-around">
            <a href="#" className="flex flex-col items-center justify-center text-primary p-2">
              <div className="flex items-center justify-center w-6 h-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <rect x="3" y="3" width="7" height="9"></rect>
                  <rect x="14" y="3" width="7" height="5"></rect>
                  <rect x="14" y="12" width="7" height="9"></rect>
                  <rect x="3" y="16" width="7" height="5"></rect>
                </svg>
              </div>
              <span className="text-xs mt-1">Dashboard</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center text-slate-500 p-2">
              <div className="flex items-center justify-center w-6 h-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M20.5 7.278 12 12l-8.5-4.722V19h17z"></path>
                  <path d="M12 12v9"></path>
                  <path d="M3.5 7.278 12 2l8.5 5.278"></path>
                </svg>
              </div>
              <span className="text-xs mt-1">Images</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center text-slate-500 p-2">
              <div className="flex items-center justify-center w-6 h-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <circle cx="11" cy="11" r="8"></circle>
                  <path d="m21 21-4.3-4.3"></path>
                </svg>
              </div>
              <span className="text-xs mt-1">Search</span>
            </a>
            <a href="#" className="flex flex-col items-center justify-center text-slate-500 p-2">
              <div className="flex items-center justify-center w-6 h-6">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                  <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"></path>
                  <circle cx="12" cy="12" r="3"></circle>
                </svg>
              </div>
              <span className="text-xs mt-1">Settings</span>
            </a>
          </div>
        </nav>
      </div>
    </div>
  );
}
