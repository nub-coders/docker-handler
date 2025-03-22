import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import SystemUsage from "./SystemUsage";

type NavItem = {
  label: string;
  icon: string;
  tab: string;
};

const navItems: NavItem[] = [
  { label: "Dashboard", icon: "ri-dashboard-line", tab: "dashboard" },
  { label: "Containers", icon: "ri-inbox-line", tab: "containers" },
  { label: "Images", icon: "ri-file-list-3-line", tab: "images" },
  { label: "Logs", icon: "ri-file-text-line", tab: "logs" },
];

type SideNavProps = {
  activeTab: string;
  onTabChange: (tab: string) => void;
};

const SideNav = ({ activeTab, onTabChange }: SideNavProps) => {
  return (
    <div className="lg:w-64 flex-shrink-0">
      <div className="sticky top-20">
        <nav className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <ul className="space-y-2">
            {navItems.map((item) => (
              <li key={item.tab}>
                <a
                  href="#"
                  className={cn(
                    "flex items-center px-3 py-2 text-sm font-medium rounded-md",
                    activeTab === item.tab
                      ? "bg-primary-50 text-primary-700"
                      : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    onTabChange(item.tab);
                  }}
                >
                  <i className={cn(item.icon, "mr-2")}></i>
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        
        <SystemUsage />
      </div>
    </div>
  );
};

export default SideNav;
