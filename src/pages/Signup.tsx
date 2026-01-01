import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sprout, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, User, Phone } from "lucide-react";
import { toast } from "sonner";

interface SignUpFormData {
  fullName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  farmName?: string;
  location?: string;
}

interface FormErrors {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
  farmName?: string;
}

const Signup = () => {
  const [formData, setFormData] = useState<SignUpFormData>({
    fullName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    farmName: "",
    location: "",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    // Full Name validation
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (formData.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    }

    // Email validation
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    }

    // Phone validation
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^[0-9]{10,}$/.test(formData.phone.replace(/\D/g, ""))) {
      newErrors.phone = "Please enter a valid phone number";
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = "Password must contain uppercase, lowercase, and numbers";
    }

    // Confirm Password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field when user starts typing
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!agreedToTerms) {
      toast.error("Please agree to the Terms and Conditions");
      setLoading(false);
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the errors in the form");
      setLoading(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Store user data
      const userData = {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        farmName: formData.farmName || "Farm",
        location: formData.location || "India",
        createdAt: new Date().toISOString(),
      };

      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("isLoggedIn", "true");

      toast.success("Account created successfully!");
      
      // Redirect to dashboard
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err) {
      toast.error("Signup failed. Please try again.");
      console.error("Signup error:", err);
    } finally {
      setLoading(false);
    }
  };

  const getPasswordStrength = (): { strength: string; color: string; width: string } => {
    const password = formData.password;
    if (!password) return { strength: "", color: "", width: "0%" };

    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
    if (/\d/.test(password)) strength++;
    if (/[!@#$%^&*]/.test(password)) strength++;

    if (strength <= 1) return { strength: "Weak", color: "bg-red-500", width: "25%" };
    if (strength === 2) return { strength: "Fair", color: "bg-yellow-500", width: "50%" };
    if (strength === 3) return { strength: "Good", color: "bg-blue-500", width: "75%" };
    return { strength: "Strong", color: "bg-green-500", width: "100%" };
  };

  const passwordStrength = getPasswordStrength();

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-accent/10 flex flex-col">
      {/* Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl"></div>
      </div>

      {/* Content */}
      <div className="relative flex-1 flex flex-col items-center justify-center px-2 sm:px-4 md:px-6 py-4 sm:py-6 md:py-8">
        {/* Header with Login Button */}
        <div className="w-full flex justify-between items-center mb-8">
          <div></div>
          <Link to="/login">
            <Button variant="outline" size="sm" className="gap-2">
              Already have an account? <span className="font-semibold">Sign In</span>
            </Button>
          </Link>
        </div>

        {/* Header */}
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 mb-6 group">
            <div className="p-3 bg-primary/10 rounded-lg group-hover:bg-primary/20 transition-colors">
              <Sprout className="h-8 w-8 text-primary" />
            </div>
            <span className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-primary-glow bg-clip-text text-transparent">
              SmartFarm AI
            </span>
          </Link>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-2">Create Account</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-md">
            Join thousands of farmers using AI-powered farming solutions
          </p>
        </div>

        {/* Signup Card */}
        <Card className="w-full max-w-2xl border-border/50 backdrop-blur-sm bg-background/80 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl">Sign Up</CardTitle>
            <CardDescription>Create your SmartFarm AI account and get started</CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Signup Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Full Name & Phone - Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-2">
                  <Label htmlFor="fullName" className="text-sm font-medium">
                    Full Name *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      name="fullName"
                      type="text"
                      placeholder="John Farmer"
                      value={formData.fullName}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`pl-10 h-10 ${errors.fullName ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.fullName && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.fullName}
                    </p>
                  )}
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-sm font-medium">
                    Phone Number *
                  </Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+91 XXXXX XXXXX"
                      value={formData.phone}
                      onChange={handleInputChange}
                      disabled={loading}
                      className={`pl-10 h-10 ${errors.phone ? "border-red-500" : ""}`}
                    />
                  </div>
                  {errors.phone && (
                    <p className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3" /> {errors.phone}
                    </p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email Address *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="name@example.com"
                    value={formData.email}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`pl-10 h-10 ${errors.email ? "border-red-500" : ""}`}
                  />
                </div>
                {errors.email && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.email}
                  </p>
                )}
              </div>

              {/* Farm Name & Location - Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Farm Name */}
                <div className="space-y-2">
                  <Label htmlFor="farmName" className="text-sm font-medium">
                    Farm Name
                  </Label>
                  <Input
                    id="farmName"
                    name="farmName"
                    type="text"
                    placeholder="My Farm"
                    value={formData.farmName}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="h-10"
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="text-sm font-medium">
                    Location
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    placeholder="City, State"
                    value={formData.location}
                    onChange={handleInputChange}
                    disabled={loading}
                    className="h-10"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter a strong password"
                    value={formData.password}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`pl-10 pr-10 h-10 ${errors.password ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.password}
                  </p>
                )}

                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Password Strength:</span>
                      <span className={`font-semibold ${passwordStrength.color.replace("bg-", "text-")}`}>
                        {passwordStrength.strength}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${passwordStrength.color} transition-all duration-300`}
                        style={{ width: passwordStrength.width }}
                      ></div>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Password must be 8+ characters with uppercase, lowercase, and numbers
                </p>
              </div>

              {/* Confirm Password */}
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-sm font-medium">
                  Confirm Password *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Re-enter your password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    disabled={loading}
                    className={`pl-10 pr-10 h-10 ${errors.confirmPassword ? "border-red-500" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.confirmPassword}
                  </p>
                )}
              </div>

              {/* Terms & Conditions */}
              <div className="flex items-start gap-3 p-4 bg-muted/50 rounded-lg">
                <input
                  type="checkbox"
                  id="terms"
                  checked={agreedToTerms}
                  onChange={(e) => setAgreedToTerms(e.target.checked)}
                  className="w-4 h-4 rounded mt-1 cursor-pointer"
                  disabled={loading}
                />
                <label htmlFor="terms" className="text-xs text-muted-foreground cursor-pointer">
                  I agree to the{" "}
                  <Link to="/terms" className="text-primary hover:underline font-semibold">
                    Terms and Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy" className="text-primary hover:underline font-semibold">
                    Privacy Policy
                  </Link>
                </label>
              </div>

              {/* Signup Button */}
              <Button type="submit" disabled={loading || !agreedToTerms} className="w-full h-10 mt-6" size="lg">
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            {/* Sign In Link */}
            <div className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
              <Link to="/login" className="text-primary font-semibold hover:underline">
                Sign in here
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Security Features */}
        <div className="mt-12 w-full max-w-2xl">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="text-center p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="h-6 w-6 text-primary" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Secure Account</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-2">
                <Lock className="h-6 w-6 text-accent" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Data Protected</p>
            </div>
            <div className="text-center p-4 rounded-lg bg-muted/50 hover:bg-muted/70 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center mx-auto mb-2">
                <Sprout className="h-6 w-6 text-blue-500" />
              </div>
              <p className="text-xs font-medium text-muted-foreground">Farm Ready</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="relative border-t border-border/50 bg-background/50 backdrop-blur-sm py-6">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-between text-xs text-muted-foreground gap-4">
          <p>© 2025 SmartFarm AI. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="hover:text-foreground transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-foreground transition-colors">
              Terms of Service
            </Link>
            <Link to="/contact" className="hover:text-foreground transition-colors">
              Contact Support
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Signup;
