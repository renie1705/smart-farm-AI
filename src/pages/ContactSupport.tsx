import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Mail, Phone, MapPin, MessageSquare, Send, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

const ContactSupport = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simulate form submission
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setLoading(false);
    setSubmitted(true);
    toast.success("Message sent successfully! We'll get back to you soon.");

    // Reset form after 3 seconds
    setTimeout(() => {
      setFormData({ name: "", email: "", subject: "", message: "" });
      setSubmitted(false);
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-6xl mx-auto px-4 py-8">
        <Link to="/login">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </Link>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Contact Form */}
          <div>
            <div className="mb-6">
              <div className="flex items-center gap-3 mb-4">
                <MessageSquare className="h-8 w-8 text-primary" />
                <h1 className="text-4xl font-bold">Contact Support</h1>
              </div>
              <p className="text-muted-foreground">
                Have a question or need assistance? We're here to help! Send us a message and our team will get back to you as soon as possible.
              </p>
            </div>

            <Card className="border border-border shadow-lg">
              <CardHeader>
                <CardTitle>Send us a Message</CardTitle>
                <CardDescription>Fill out the form below and we'll respond within 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                {submitted ? (
                  <div className="py-8 text-center space-y-4">
                    <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto">
                      <CheckCircle2 className="h-8 w-8 text-green-500" />
                    </div>
                    <h3 className="text-xl font-semibold">Message Sent!</h3>
                    <p className="text-muted-foreground">
                      Thank you for contacting us. We'll get back to you soon.
                    </p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        type="text"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject">Subject *</Label>
                      <Input
                        id="subject"
                        name="subject"
                        type="text"
                        placeholder="How can we help you?"
                        value={formData.subject}
                        onChange={handleChange}
                        required
                        disabled={loading}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message *</Label>
                      <Textarea
                        id="message"
                        name="message"
                        placeholder="Please describe your issue or question in detail..."
                        value={formData.message}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        rows={6}
                        className="resize-none"
                      />
                    </div>

                    <Button type="submit" className="w-full" size="lg" disabled={loading}>
                      {loading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Send Message
                        </>
                      )}
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Contact Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold mb-4">Get in Touch</h2>
              <p className="text-muted-foreground mb-6">
                Our support team is available to assist you with any questions, technical issues, or feedback about SmartFarm AI.
              </p>
            </div>

            <div className="space-y-4">
              {/* Email */}
              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email Support</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Get help via email within 24 hours
                      </p>
                      <a
                        href="mailto:support@smartfarm-ai.com"
                        className="text-primary hover:underline text-sm"
                      >
                        support@smartfarm-ai.com
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Phone */}
              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0">
                      <Phone className="h-6 w-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone Support</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        Mon-Fri, 9:00 AM - 6:00 PM IST
                      </p>
                      <a
                        href="tel:+911234567890"
                        className="text-primary hover:underline text-sm"
                      >
                        +91 123 456 7890
                      </a>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Office */}
              <Card className="border border-border">
                <CardContent className="p-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-lg bg-blue-500/10 flex items-center justify-center flex-shrink-0">
                      <MapPin className="h-6 w-6 text-blue-500" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Office Location</h3>
                      <p className="text-sm text-muted-foreground">
                        SmartFarm AI Headquarters<br />
                        Agricultural Technology Park<br />
                        Innovation District, India
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* FAQ Section */}
            <Card className="border border-border bg-muted/50">
              <CardHeader>
                <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm mb-1">How accurate are the crop predictions?</h4>
                  <p className="text-sm text-muted-foreground">
                    Our AI models achieve 85-90% accuracy based on historical data and environmental factors.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Can I use SmartFarm AI offline?</h4>
                  <p className="text-sm text-muted-foreground">
                    Currently, an internet connection is required for real-time data and AI processing.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">Is my farm data secure?</h4>
                  <p className="text-sm text-muted-foreground">
                    Yes, we use industry-standard encryption and security measures. See our{" "}
                    <Link to="/privacy-policy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                    .
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-sm mb-1">What payment methods do you accept?</h4>
                  <p className="text-sm text-muted-foreground">
                    We accept credit/debit cards, UPI, and bank transfers for premium plans.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Quick Links */}
            <div className="flex flex-wrap gap-3">
              <Link to="/privacy-policy">
                <Button variant="outline" size="sm">Privacy Policy</Button>
              </Link>
              <Link to="/terms">
                <Button variant="outline" size="sm">Terms of Service</Button>
              </Link>
              <Link to="/signup">
                <Button variant="outline" size="sm">Create Account</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactSupport;
