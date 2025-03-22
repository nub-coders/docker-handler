import { BellIcon, Menu } from "lucide-react";

interface HeaderProps {
  toggleMobileMenu: () => void;
}

export default function Header({ toggleMobileMenu }: HeaderProps) {
  return (
    <header className="bg-white border-b border-slate-200 h-16 flex items-center px-4 md:px-6">
      <button
        onClick={toggleMobileMenu}
        className="md:hidden text-slate-500 hover:text-slate-700 mr-4"
        aria-label="Open menu"
      >
        <Menu className="h-6 w-6" />
      </button>
      
      <div className="flex-1 flex items-center justify-between md:justify-end">
        <div className="md:hidden flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-primary mr-2">
            <path d="M2 22h20" />
            <path d="M20 18V8.5a1.5 1.5 0 0 0-1.5-1.5h-3l-1-4H9l-1 4H5.5A1.5 1.5 0 0 0 4 8.5V18" />
            <path d="M12 5v7" />
            <path d="M10 9h4" />
          </svg>
          <h1 className="text-lg font-semibold text-slate-800">Docker Manager</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <button className="text-slate-500 hover:text-slate-700 relative" aria-label="Notifications">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
          </button>
          
          <div className="md:hidden">
            <button className="flex items-center text-sm font-medium text-slate-700">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <span className="text-sm font-medium">NC</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
