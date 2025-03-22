import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const Header = () => {
  const { logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-4">
          <i className="ri-docker-fill text-primary-600 text-2xl"></i>
          <h1 className="text-xl font-semibold text-gray-800">Docker Management</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-gray-500">
            <i className="ri-checkbox-circle-fill text-green-500"></i> Server connected
          </span>
          <Button
            variant="ghost" 
            size="sm" 
            onClick={handleLogout}
            className="text-sm text-gray-600 hover:text-gray-800 flex items-center"
          >
            <i className="ri-logout-box-r-line mr-1"></i> Logout
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
