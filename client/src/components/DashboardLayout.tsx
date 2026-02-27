import { useAuth } from "@/_core/hooks/useAuth";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { getLoginUrl } from "@/const";
import { useIsMobile } from "@/hooks/useMobile";
import { LayoutDashboard, LogOut, Package, Users, ShieldCheck } from "lucide-react";
import { CSSProperties, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { DashboardLayoutSkeleton } from './DashboardLayoutSkeleton';
import { Button } from "./ui/button";
import { motion } from "framer-motion";

const menuItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/admin" },
  { icon: Package, label: "Products", path: "/admin/products" },
  { icon: Users, label: "Reviews", path: "/admin/reviews" },
  { icon: ShieldCheck, label: "Orders", path: "/admin/orders" },
];

const SIDEBAR_WIDTH_KEY = "sidebar-width";
const DEFAULT_WIDTH = 260;
const MIN_WIDTH = 200;
const MAX_WIDTH = 400;

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    const saved = localStorage.getItem(SIDEBAR_WIDTH_KEY);
    return saved ? parseInt(saved, 10) : DEFAULT_WIDTH;
  });
  const { loading, user } = useAuth();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_WIDTH_KEY, sidebarWidth.toString());
  }, [sidebarWidth]);

  if (loading) {
    return <DashboardLayoutSkeleton />
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#030711]">
        <div className="flex flex-col items-center gap-8 p-12 glass-card rounded-[3rem] max-w-md w-full border-white/[0.05]">
          <div className="flex flex-col items-center gap-6">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center">
              <ShieldCheck className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-center text-white">
              Access Restricted
            </h1>
            <p className="text-sm text-slate-400 text-center max-w-sm leading-relaxed">
              This area is reserved for authorized personnel. Please authenticate to access the command center.
            </p>
          </div>
          <Button
            onClick={() => {
              window.location.href = getLoginUrl();
            }}
            size="lg"
            className="w-full h-14 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl transition-all"
          >
            Authenticate Now
          </Button>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": `${sidebarWidth}px`,
        } as CSSProperties
      }
    >
      <DashboardLayoutContent setSidebarWidth={setSidebarWidth}>
        {children}
      </DashboardLayoutContent>
    </SidebarProvider>
  );
}

type DashboardLayoutContentProps = {
  children: React.ReactNode;
  setSidebarWidth: (width: number) => void;
};

function DashboardLayoutContent({
  children,
  setSidebarWidth,
}: DashboardLayoutContentProps) {
  const { user, logout } = useAuth();
  const [location, setLocation] = useLocation();
  const { state } = useSidebar();
  const isCollapsed = state === "collapsed";
  const [isResizing, setIsResizing] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (isCollapsed) {
      setIsResizing(false);
    }
  }, [isCollapsed]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const sidebarLeft = sidebarRef.current?.getBoundingClientRect().left ?? 0;
      const newWidth = e.clientX - sidebarLeft;
      if (newWidth >= MIN_WIDTH && newWidth <= MAX_WIDTH) {
        setSidebarWidth(newWidth);
      }
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
    }
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
  }, [isResizing, setSidebarWidth]);

  return (
    <div className="flex min-h-screen bg-[#030711] text-slate-200">
      <div className="relative" ref={sidebarRef}>
        <Sidebar
          collapsible="icon"
          className="border-r border-white/[0.05] bg-[#030711]"
          disableTransition={isResizing}
        >
          <SidebarHeader className="h-20 justify-center border-b border-white/[0.05]">
            <div className="flex items-center gap-3 px-4 transition-all w-full">
              {!isCollapsed ? (
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-[10px] font-black text-white shadow-lg shadow-primary/20">AX</div>
                  <span className="font-black tracking-tighter truncate text-lg text-white">
                    AXASHOP <span className="text-primary">ADMIN</span>
                  </span>
                </div>
              ) : (
                <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-xs font-black text-white mx-auto shadow-lg shadow-primary/20">AX</div>
              )}
            </div>
          </SidebarHeader>

          <SidebarContent className="gap-2 py-6">
            <SidebarMenu className="px-3">
              {menuItems.map(item => {
                const isActive = location === item.path;
                return (
                  <SidebarMenuItem key={item.path}>
                    <SidebarMenuButton
                      isActive={isActive}
                      onClick={() => setLocation(item.path)}
                      tooltip={item.label}
                      className={`h-12 transition-all font-bold text-sm rounded-xl px-4 ${
                        isActive 
                          ? "bg-primary/10 text-primary border border-primary/20" 
                          : "text-slate-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon
                        className={`h-5 w-5 ${isActive ? "text-primary" : ""}`}
                      />
                      <span className="ml-3">{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-white/[0.05]">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-2xl p-2 hover:bg-white/5 transition-all w-full text-left group-data-[collapsible=icon]:justify-center focus:outline-none">
                  <Avatar className="h-10 w-10 border border-white/10 shrink-0 rounded-xl">
                    <AvatarFallback className="bg-primary/10 text-primary font-black text-xs">
                      {user?.name?.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 group-data-[collapsible=icon]:hidden">
                    <p className="text-sm font-bold truncate text-white">
                      {user?.name || "Admin"}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-black uppercase tracking-tighter">
                      System Administrator
                    </p>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0E1117] border-white/10 rounded-2xl p-2">
                <DropdownMenuItem
                  onClick={logout}
                  className="cursor-pointer text-red-400 focus:text-red-400 focus:bg-red-400/10 rounded-xl h-11 font-bold"
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>
      </div>

      <SidebarInset className="bg-[#030711]">
        <header className="h-20 border-b border-white/[0.05] flex items-center px-8 sticky top-0 z-30 bg-[#030711]/80 backdrop-blur-xl">
          <div className="flex items-center gap-4">
            <SidebarTrigger className="h-10 w-10 rounded-xl hover:bg-white/5 text-slate-400" />
            <div className="h-4 w-[1px] bg-white/10 mx-2" />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              {menuItems.find(i => i.path === location)?.label || "Dashboard"}
            </span>
          </div>
        </header>
        <main className="flex-1 p-8 lg:p-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            {children}
          </motion.div>
        </main>
      </SidebarInset>
    </div>
  );
}
