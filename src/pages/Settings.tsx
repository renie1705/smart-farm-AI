import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Navigation from "@/components/Navigation";
import { Settings as SettingsIcon, Bell, Palette, Lock, Database, LogOut, ArrowLeft, Moon, Sun, Smartphone, AlertCircle, CheckCircle, Download, Trash2, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";

interface UserSettings {
  theme: "light" | "dark" | "system";
  notifications: boolean;
  emailAlerts: boolean;
  weatherAlerts: boolean;
  priceAlerts: boolean;
  soilHealthAlerts: boolean;
  dataRefreshInterval: string;
  temperatureUnit: "celsius" | "fahrenheit";
  currencyUnit: "INR" | "USD";
  language: string;
  twoFactorAuth: boolean;
  dataCollection: boolean;
  username?: string;
  email?: string;
}

const Settings = () => {
  // Initialize with theme from localStorage or default to "system"
  const getInitialTheme = (): "light" | "dark" | "system" => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === "light" || savedTheme === "dark" || savedTheme === "system") {
      return savedTheme;
    }
    return "system";
  };

  const [settings, setSettings] = useState<UserSettings>({
    theme: getInitialTheme(),
    notifications: true,
    emailAlerts: false,
    weatherAlerts: true,
    priceAlerts: true,
    soilHealthAlerts: true,
    dataRefreshInterval: "5",
    temperatureUnit: "celsius",
    currencyUnit: "INR",
    language: "English",
    twoFactorAuth: false,
    dataCollection: true,
    username: "Farmer User",
    email: "farmer@smartfarm.ai",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [cacheSize, setCacheSize] = useState("2.4 MB");

  // Load settings from localStorage on mount
  useEffect(() => {
    const initialTheme = getInitialTheme();
    
    const savedSettings = localStorage.getItem("userSettings");
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings(parsedSettings);
        applyTheme(parsedSettings.theme);
      } catch (error) {
        console.error("Error loading settings:", error);
        applyTheme(initialTheme);
      }
    } else {
      // Apply initial theme immediately
      setSettings(prev => ({ ...prev, theme: initialTheme }));
      applyTheme(initialTheme);
    }
  }, []);

  // Listen for system theme changes
  useEffect(() => {
    if (settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => {
        applyTheme("system");
      };
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [settings.theme]);

  const applyTheme = (theme: "light" | "dark" | "system") => {
    const root = document.documentElement;
    
    if (theme === "light") {
      root.classList.remove("dark");
      localStorage.setItem("theme", "light");
    } else if (theme === "dark") {
      root.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      // system theme
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (prefersDark) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
      localStorage.setItem("theme", "system");
    }
  };

  const handleSettingChange = (key: keyof UserSettings, value: any) => {
    const updatedSettings = { ...settings, [key]: value };
    setSettings(updatedSettings);

    // Apply theme change immediately and save to localStorage
    if (key === "theme") {
      applyTheme(value);
      localStorage.setItem("theme", value);
      localStorage.setItem("userSettings", JSON.stringify(updatedSettings));
      toast.success(`Theme changed to ${value}`);
    }
  };

  const handleSaveSettings = () => {
    setIsSaving(true);
    setTimeout(() => {
      localStorage.setItem("userSettings", JSON.stringify(settings));
      setIsSaving(false);
      toast.success("Settings saved successfully!");
    }, 800);
  };

  const handleResetSettings = () => {
    const defaultSettings: UserSettings = {
      theme: "system",
      notifications: true,
      emailAlerts: false,
      weatherAlerts: true,
      priceAlerts: true,
      soilHealthAlerts: true,
      dataRefreshInterval: "5",
      temperatureUnit: "celsius",
      currencyUnit: "INR",
      language: "English",
      twoFactorAuth: false,
      dataCollection: true,
      username: "Farmer User",
      email: "farmer@smartfarm.ai",
    };
    setSettings(defaultSettings);
    localStorage.setItem("userSettings", JSON.stringify(defaultSettings));
    toast.info("Settings reset to default");
  };

  const handleUpdatePassword = () => {
    if (!passwordData.current || !passwordData.new || !passwordData.confirm) {
      toast.error("Please fill in all password fields");
      return;
    }

    if (passwordData.new !== passwordData.confirm) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordData.new.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    toast.success("Password updated successfully!");
    setPasswordData({ current: "", new: "", confirm: "" });
  };

  const handleClearCache = () => {
    localStorage.removeItem("userSettings");
    sessionStorage.clear();
    setCacheSize("0 MB");
    toast.success("Cache cleared successfully!");
  };

  const handleExportData = () => {
    const dataToExport = {
      settings,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };
    const dataStr = JSON.stringify(dataToExport, null, 2);
    const dataBlob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `smartfarm-data-${new Date().toISOString().split("T")[0]}.json`;
    link.click();
    toast.success("Data exported successfully!");
  };

  const handleDeleteAccount = () => {
    if (window.confirm("Are you sure? This action cannot be undone. All your data will be permanently deleted.")) {
      localStorage.clear();
      sessionStorage.clear();
      toast.success("Account deleted. Redirecting to login...");
      setTimeout(() => {
        window.location.href = "/login";
      }, 1500);
    }
  };

  const handleLogOut = () => {
    localStorage.clear();
    toast.success("Logged out successfully!");
    setTimeout(() => {
      window.location.href = "/login";
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navigation />

      {/* Header */}
      <section className="px-2 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-8 max-w-6xl mx-auto w-full">
        <Link to="/">
          <Button variant="ghost" size="sm" className="mb-6">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <SettingsIcon className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground">Settings</h1>
          </div>
          <p className="text-sm sm:text-base text-muted-foreground">
            Customize your SmartFarm AI experience with personalized preferences
          </p>
        </div>

        {/* Settings Tabs */}
        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 mb-8">
            <TabsTrigger value="general" className="text-xs sm:text-sm">General</TabsTrigger>
            <TabsTrigger value="display" className="text-xs sm:text-sm">Display</TabsTrigger>
            <TabsTrigger value="notifications" className="text-xs sm:text-sm">Alerts</TabsTrigger>
            <TabsTrigger value="data" className="text-xs sm:text-sm">Data</TabsTrigger>
            <TabsTrigger value="security" className="text-xs sm:text-sm">Security</TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Basic preferences for your account</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Language */}
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-medium">
                    Language
                  </Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange("language", value)}>
                    <SelectTrigger id="language">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Hindi">Hindi (हिंदी)</SelectItem>
                      <SelectItem value="Marathi">Marathi (मराठी)</SelectItem>
                      <SelectItem value="Tamil">Tamil (தமிழ்)</SelectItem>
                      <SelectItem value="Telugu">Telugu (తెలుగు)</SelectItem>
                      <SelectItem value="Kannada">Kannada (ಕನ್ನಡ)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Choose your preferred language</p>
                </div>

                {/* Temperature Unit */}
                <div className="space-y-2">
                  <Label htmlFor="temp-unit" className="text-sm font-medium">
                    Temperature Unit
                  </Label>
                  <Select value={settings.temperatureUnit} onValueChange={(value: any) => handleSettingChange("temperatureUnit", value)}>
                    <SelectTrigger id="temp-unit">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="celsius">Celsius (°C)</SelectItem>
                      <SelectItem value="fahrenheit">Fahrenheit (°F)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Default unit for weather data</p>
                </div>

                {/* Currency Unit */}
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-sm font-medium">
                    Currency
                  </Label>
                  <Select value={settings.currencyUnit} onValueChange={(value: any) => handleSettingChange("currencyUnit", value)}>
                    <SelectTrigger id="currency">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="INR">Indian Rupee (₹)</SelectItem>
                      <SelectItem value="USD">US Dollar ($)</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Currency for price tracking</p>
                </div>

                {/* Data Refresh Interval */}
                <div className="space-y-2">
                  <Label htmlFor="refresh" className="text-sm font-medium">
                    Data Refresh Interval (minutes)
                  </Label>
                  <Select value={settings.dataRefreshInterval} onValueChange={(value) => handleSettingChange("dataRefreshInterval", value)}>
                    <SelectTrigger id="refresh">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 minute</SelectItem>
                      <SelectItem value="5">5 minutes</SelectItem>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">How often to refresh real-time data</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Display Settings */}
          <TabsContent value="display">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Display Settings
                </CardTitle>
                <CardDescription>Customize the appearance of your interface</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Theme Selection */}
                <div className="space-y-4">
                  <Label className="text-sm font-medium">Theme</Label>
                  <div className="grid grid-cols-3 gap-4">
                    <button
                      onClick={() => handleSettingChange("theme", "light")}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        settings.theme === "light"
                          ? "border-primary bg-primary/10"
                          : "border-muted bg-muted/50 hover:border-muted-foreground"
                      }`}
                    >
                      <Sun className="h-6 w-6 mx-auto mb-2 text-yellow-500" />
                      <p className="text-xs font-medium">Light</p>
                    </button>
                    <button
                      onClick={() => handleSettingChange("theme", "dark")}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        settings.theme === "dark"
                          ? "border-primary bg-primary/10"
                          : "border-muted bg-muted/50 hover:border-muted-foreground"
                      }`}
                    >
                      <Moon className="h-6 w-6 mx-auto mb-2 text-slate-600" />
                      <p className="text-xs font-medium">Dark</p>
                    </button>
                    <button
                      onClick={() => handleSettingChange("theme", "system")}
                      className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                        settings.theme === "system"
                          ? "border-primary bg-primary/10"
                          : "border-muted bg-muted/50 hover:border-muted-foreground"
                      }`}
                    >
                      <Smartphone className="h-6 w-6 mx-auto mb-2 text-blue-500" />
                      <p className="text-xs font-medium">System</p>
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">Choose how the interface appears</p>
                </div>

                {/* Info Box */}
                <div className="bg-muted/50 border border-muted-foreground/20 rounded-lg p-4">
                  <div className="space-y-2">
                    <p className="text-xs sm:text-sm text-muted-foreground">
                      <strong>Note:</strong> Your theme preference will be saved and automatically applied when you return to the app.
                    </p>
                    <p className="text-xs text-muted-foreground">
                      <strong>System Theme:</strong> Automatically detects your device's dark/light mode preference and applies the matching theme in real-time.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Alert Preferences
                </CardTitle>
                <CardDescription>Manage how you receive updates and alerts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* In-App Notifications */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-sm">In-App Notifications</p>
                    <p className="text-xs text-muted-foreground">Receive notifications within the app</p>
                  </div>
                  <Switch
                    checked={settings.notifications}
                    onCheckedChange={(checked) => handleSettingChange("notifications", checked)}
                  />
                </div>

                {/* Email Alerts */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-sm">Email Alerts</p>
                    <p className="text-xs text-muted-foreground">Get important updates via email</p>
                  </div>
                  <Switch
                    checked={settings.emailAlerts}
                    onCheckedChange={(checked) => handleSettingChange("emailAlerts", checked)}
                  />
                </div>

                {/* Weather Alerts */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-sm">Weather Alerts</p>
                    <p className="text-xs text-muted-foreground">Notify about extreme weather conditions</p>
                  </div>
                  <Switch
                    checked={settings.weatherAlerts}
                    onCheckedChange={(checked) => handleSettingChange("weatherAlerts", checked)}
                  />
                </div>

                {/* Price Alerts */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-sm">Price Alerts</p>
                    <p className="text-xs text-muted-foreground">Notify about significant price changes</p>
                  </div>
                  <Switch
                    checked={settings.priceAlerts}
                    onCheckedChange={(checked) => handleSettingChange("priceAlerts", checked)}
                  />
                </div>

                {/* Soil Health Alerts */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-sm">Soil Health Alerts</p>
                    <p className="text-xs text-muted-foreground">Notify when soil conditions need attention</p>
                  </div>
                  <Switch
                    checked={settings.soilHealthAlerts}
                    onCheckedChange={(checked) => handleSettingChange("soilHealthAlerts", checked)}
                  />
                </div>

                {/* Alert Summary */}
                <Alert className="bg-primary/10 border-primary/20">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {settings.notifications || settings.emailAlerts ? "Alerts enabled" : "All alerts disabled"}
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Data Settings */}
          <TabsContent value="data">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="h-5 w-5" />
                  Data & Privacy
                </CardTitle>
                <CardDescription>Manage your data and privacy settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Data Collection */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-sm">Anonymous Data Collection</p>
                    <p className="text-xs text-muted-foreground">Help us improve by sharing usage analytics</p>
                  </div>
                  <Switch
                    checked={settings.dataCollection}
                    onCheckedChange={(checked) => handleSettingChange("dataCollection", checked)}
                  />
                </div>

                {/* Cache Info */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3 hover:bg-muted/70 transition-colors">
                  <p className="font-medium text-sm">Cache & Storage</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Current Cache Size:</span>
                    <span className="font-semibold text-primary">{cacheSize}</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleClearCache}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear Cache
                  </Button>
                </div>

                {/* Export Data */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3 hover:bg-muted/70 transition-colors">
                  <p className="font-medium text-sm">Export Your Data</p>
                  <p className="text-xs text-muted-foreground">Download a copy of your personal data in JSON format</p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full"
                    onClick={handleExportData}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download Data as JSON
                  </Button>
                </div>

                {/* Delete Account */}
                <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-lg space-y-3 hover:bg-destructive/15 transition-colors">
                  <p className="font-medium text-sm text-destructive">Delete Account</p>
                  <p className="text-xs text-muted-foreground">Permanently delete your account and all associated data. This action cannot be undone.</p>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="w-full"
                    onClick={handleDeleteAccount}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="h-5 w-5" />
                  Security Settings
                </CardTitle>
                <CardDescription>Manage your account security and access</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Account Info */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3 hover:bg-muted/70 transition-colors">
                  <p className="font-medium text-sm">Account Information</p>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-muted-foreground">Username</p>
                      <p className="text-sm font-semibold">{settings.username}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Email Address</p>
                      <p className="text-sm font-semibold">{settings.email}</p>
                    </div>
                  </div>
                </div>

                {/* Change Password */}
                <div className="space-y-3">
                  <p className="font-medium text-sm">Change Password</p>
                  <div className="space-y-2">
                    <div className="relative">
                      <Input 
                        type="password" 
                        placeholder="Current password" 
                        className="text-xs sm:text-sm"
                        value={passwordData.current}
                        onChange={(e) => setPasswordData({...passwordData, current: e.target.value})}
                      />
                    </div>
                    <div className="relative">
                      <Input 
                        type={showPassword ? "text" : "password"}
                        placeholder="New password" 
                        className="text-xs sm:text-sm"
                        value={passwordData.new}
                        onChange={(e) => setPasswordData({...passwordData, new: e.target.value})}
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    <Input 
                      type="password" 
                      placeholder="Confirm new password" 
                      className="text-xs sm:text-sm"
                      value={passwordData.confirm}
                      onChange={(e) => setPasswordData({...passwordData, confirm: e.target.value})}
                    />
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full"
                    onClick={handleUpdatePassword}
                  >
                    Update Password
                  </Button>
                </div>

                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted/70 transition-colors">
                  <div>
                    <p className="font-medium text-sm">Two-Factor Authentication</p>
                    <div className="flex items-center gap-2 mt-1">
                      {settings.twoFactorAuth ? (
                        <>
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <p className="text-xs text-green-600">Enabled - Extra security</p>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-4 w-4 text-yellow-500" />
                          <p className="text-xs text-yellow-600">Disabled - Add extra layer of security</p>
                        </>
                      )}
                    </div>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => {
                      handleSettingChange("twoFactorAuth", checked);
                      toast.success(`2FA ${checked ? "enabled" : "disabled"}`);
                    }}
                  />
                </div>

                {/* Active Sessions */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3 hover:bg-muted/70 transition-colors">
                  <p className="font-medium text-sm">Active Sessions</p>
                  <div className="text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <div>
                        <p className="font-medium text-foreground">Current Device (Web Browser)</p>
                        <p>Last active: Just now</p>
                      </div>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="w-full"
                  >
                    Sign Out All Other Sessions
                  </Button>
                </div>

                {/* Login Activity */}
                <div className="p-4 bg-muted/50 rounded-lg space-y-3 hover:bg-muted/70 transition-colors">
                  <p className="font-medium text-sm">Recent Login Activity</p>
                  <div className="text-xs text-muted-foreground space-y-2">
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span>Web Browser - Dec 4, 2025 10:30 AM</span>
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span>Web Browser - Dec 3, 2025 3:45 PM</span>
                      <span className="text-green-600">✓</span>
                    </div>
                    <div className="flex items-center justify-between p-2 bg-background rounded">
                      <span>Web Browser - Dec 2, 2025 9:15 AM</span>
                      <span className="text-green-600">✓</span>
                    </div>
                  </div>
                </div>

                {/* Logout Button */}
                <Button 
                  variant="outline" 
                  className="w-full text-destructive hover:text-destructive"
                  onClick={handleLogOut}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Log Out
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-3 mt-8">
          <Button
            onClick={handleSaveSettings}
            disabled={isSaving}
            size="lg"
            className="flex-1"
          >
            {isSaving ? "Saving..." : "Save Settings"}
          </Button>
          <Button
            onClick={handleResetSettings}
            variant="outline"
            size="lg"
            className="flex-1"
          >
            Reset to Defaults
          </Button>
          <Link to="/" className="flex-1">
            <Button variant="ghost" size="lg" className="w-full">
              Cancel
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default Settings;
