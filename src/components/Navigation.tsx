import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, LayoutDashboard, MessageSquare, Menu, Droplets, Waves, DollarSign, Settings, User, LogOut, FileText } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useState, useEffect } from "react";

const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [accountName, setAccountName] = useState<string>("");

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        const userData = JSON.parse(user);
        setAccountName(userData.fullName || userData.email || "User");
      } catch {
        setAccountName("User");
      }
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("isLoggedIn");
    navigate("/login");
  };

  const navItems = [
    { to: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/crop-predictor", icon: Sprout, label: "Crop Predictor" },
    { to: "/smart-irrigation", icon: Droplets, label: "Smart Irrigation" },
    { to: "/groundwater-monitoring", icon: Waves, label: "Groundwater" },
    { to: "/price-tracking", icon: DollarSign, label: "Price Tracking" },
    { to: "/settings", icon: Settings, label: "Settings" },
  ];

  const NavLinks = () => (
    <>
      {navItems.map((item) => {
        const isActive = location.pathname === item.to;
        const Icon = item.icon;
        return (
          <Link key={item.to} to={item.to}>
            <Button
              variant={isActive ? "default" : "ghost"}
              className="w-full justify-start gap-2"
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Button>
          </Link>
        );
      })}
    </>
  );

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link to="/dashboard" className="flex items-center gap-2 font-bold text-xl">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            SmartFarm AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLinks />
        </nav>

        {/* Account Name and Mobile Menu */}
        <div className="flex items-center gap-4">
          {accountName && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 hidden sm:flex">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{accountName}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-sm">
                  <User className="h-4 w-4 mr-2" />
                  Profile
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/privacy-policy" className="flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Privacy Policy
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          
          {/* Mobile Navigation */}
          <Sheet>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-64">
            <div className="flex flex-col gap-2 mt-8">
              <NavLinks />
            </div>
          </SheetContent>
        </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Navigation;