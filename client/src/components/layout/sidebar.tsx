import { X, Ship, LayoutDashboard, Package, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";

interface SidebarProps {
  isMobileMenuOpen: boolean;
  toggleMobileMenu: () => void;
}

export default function Sidebar({ isMobileMenuOpen, toggleMobileMenu }: SidebarProps) {
  const { user, logout } = useAuth();

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex md:w-64 bg-white border-r border-slate-200 flex-shrink-0 flex-col">
        <div className="p-4 border-b border-slate-200">
          <div className="flex items-center">
            <Ship className="h-6 w-6 text-primary mr-2" />
            <h1 className="text-xl font-semibold text-slate-800">Docker Manager</h1>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <a href="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-primary">
            <LayoutDashboard className="h-5 w-5 mr-3" />
            <span>Dashboard</span>
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100">
            <Package className="h-5 w-5 mr-3" />
            <span>Images</span>
          </a>
          <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100">
            <Settings className="h-5 w-5 mr-3" />
            <span>Settings</span>
          </a>
        </nav>
        
        <div className="p-4 border-t border-slate-200">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
              <span className="text-sm font-medium">
                {user?.username?.substring(0, 2).toUpperCase() || "NC"}
              </span>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-slate-700">{user?.username || "nub-coders"}</p>
              <p className="text-xs text-slate-500">Administrator</p>
            </div>
          </div>
          <button
            onClick={() => logout()}
            className="mt-3 text-sm text-red-500 hover:text-red-700 font-medium flex items-center"
          >
            <LogOut className="h-4 w-4 mr-1" />
            Logout
          </button>
        </div>
      </aside>

      {/* Mobile Sidebar */}
      <div className={`md:hidden fixed inset-0 bg-slate-900 bg-opacity-50 z-40 ${isMobileMenuOpen ? "block" : "hidden"}`}>
        <div className="bg-white w-64 h-full overflow-y-auto">
          <div className="p-4 border-b border-slate-200 flex justify-between items-center">
            <div className="flex items-center">
              <Ship className="h-6 w-6 text-primary mr-2" />
              <h1 className="text-xl font-semibold text-slate-800">Docker Manager</h1>
            </div>
            <button
              onClick={toggleMobileMenu}
              className="text-slate-500 hover:text-slate-700"
              aria-label="Close menu"
            >
              <X className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="p-4 space-y-1">
            <a href="/" className="flex items-center px-3 py-2 text-sm font-medium rounded-md bg-blue-50 text-primary">
              <LayoutDashboard className="h-5 w-5 mr-3" />
              <span>Dashboard</span>
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100">
              <Package className="h-5 w-5 mr-3" />
              <span>Images</span>
            </a>
            <a href="#" className="flex items-center px-3 py-2 text-sm font-medium rounded-md text-slate-700 hover:bg-slate-100">
              <Settings className="h-5 w-5 mr-3" />
              <span>Settings</span>
            </a>
          </nav>
          
          <div className="p-4 border-t border-slate-200">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="text-sm font-medium">
                  {user?.username?.substring(0, 2).toUpperCase() || "NC"}
                </span>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-slate-700">{user?.username || "nub-coders"}</p>
                <p className="text-xs text-slate-500">Administrator</p>
              </div>
            </div>
            <button
              onClick={() => logout()}
              className="mt-3 text-sm text-red-500 hover:text-red-700 font-medium flex items-center"
            >
              <LogOut className="h-4 w-4 mr-1" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
