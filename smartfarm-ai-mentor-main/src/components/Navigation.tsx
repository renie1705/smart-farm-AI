import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sprout, LayoutDashboard, Leaf, MessageSquare, Menu } from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

const Navigation = () => {
  const location = useLocation();

  const navItems = [
    { to: "/", icon: LayoutDashboard, label: "Dashboard" },
    { to: "/crop-predictor", icon: Sprout, label: "Crop Predictor" },
    { to: "/disease-analyzer", icon: Leaf, label: "Disease Analyzer" },
    { to: "/chatbot", icon: MessageSquare, label: "AI Assistant" },
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
        <Link to="/" className="flex items-center gap-2 font-bold text-xl">
          <Sprout className="h-6 w-6 text-primary" />
          <span className="bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
            SmartFarm AI
          </span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-2">
          <NavLinks />
        </nav>

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
    </header>
  );
};

export default Navigation;