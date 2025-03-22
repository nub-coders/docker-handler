import { useState } from "react";
import { useAuth } from "@/lib/auth";
import AuthModal from "@/components/auth/AuthModal";
import Header from "@/components/layout/Header";
import SideNav from "@/components/layout/SideNav";
import Dashboard from "@/components/dashboard/Dashboard";
import ContainersList from "@/components/containers/ContainersList";
import ImagesList from "@/components/images/ImagesList";
import LogsViewer from "@/components/logs/LogsViewer";

const HomePage = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard onTabChange={setActiveTab} />;
      case "containers":
        return <ContainersList onTabChange={setActiveTab} />;
      case "images":
        return <ImagesList />;
      case "logs":
        return <LogsViewer />;
      default:
        return <Dashboard onTabChange={setActiveTab} />;
    }
  };

  return (
    <>
      <AuthModal />
      
      {isAuthenticated && (
        <div id="app-container">
          <Header />
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <SideNav activeTab={activeTab} onTabChange={setActiveTab} />
              <div className="flex-1">
                {renderContent()}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default HomePage;
