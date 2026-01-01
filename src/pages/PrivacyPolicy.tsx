import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Shield } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link to="/dashboard">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Button>
        </Link>

        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Privacy Policy</h1>
          </div>

          <p className="text-muted-foreground mb-6">
            Last updated: January 1, 2026
          </p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Introduction</h2>
              <p className="text-muted-foreground leading-relaxed">
                Welcome to SmartFarm AI ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our SmartFarm AI agricultural intelligence platform.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Information We Collect</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">2.1 Personal Information</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    We collect information that you provide directly to us, including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Account information (name, email address, password)</li>
                    <li>Profile information (farm location, crop preferences)</li>
                    <li>Contact information for support requests</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">2.2 Agricultural Data</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    To provide our services, we collect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Soil and environmental data you input</li>
                    <li>Crop selection and farming preferences</li>
                    <li>Irrigation system information</li>
                    <li>Groundwater monitoring data</li>
                    <li>Uploaded images for disease analysis</li>
                    <li>Location data for weather and market price information</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">2.3 Automatically Collected Information</h3>
                  <p className="text-muted-foreground leading-relaxed mb-2">
                    When you use our platform, we automatically collect:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Device information (browser type, operating system)</li>
                    <li>Usage data (pages visited, features used, time spent)</li>
                    <li>IP address and general location</li>
                    <li>Cookies and similar tracking technologies</li>
                  </ul>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. How We Use Your Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                We use the information we collect to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Provide, maintain, and improve our AI-powered agricultural services</li>
                <li>Generate crop predictions and recommendations</li>
                <li>Analyze plant diseases from uploaded images</li>
                <li>Provide irrigation optimization suggestions</li>
                <li>Monitor groundwater levels and trends</li>
                <li>Deliver market price tracking and forecasts</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Send you updates, alerts, and educational content</li>
                <li>Improve our AI models and algorithms</li>
                <li>Ensure platform security and prevent fraud</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Data Sharing and Disclosure</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  We do not sell your personal information. We may share your information in the following circumstances:
                </p>

                <div>
                  <h3 className="text-xl font-semibold mb-2">4.1 Service Providers</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We work with third-party service providers including:
                  </p>
                  <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                    <li>Supabase for authentication and data storage</li>
                    <li>Google Gemini AI for AI-powered analysis and recommendations</li>
                    <li>Weather data providers for forecasting</li>
                    <li>Satellite imagery providers for field analysis</li>
                    <li>Cloud hosting services</li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">4.2 Legal Requirements</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may disclose your information if required by law or in response to valid legal requests from governmental authorities.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">4.3 Aggregated Data</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We may share anonymized, aggregated data for research, agricultural insights, and improving farming practices, ensuring individual users cannot be identified.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Data Security</h2>
              <p className="text-muted-foreground leading-relaxed">
                We implement appropriate technical and organizational security measures to protect your personal information, including:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Encryption of data in transit and at rest</li>
                <li>Secure authentication mechanisms</li>
                <li>Regular security assessments</li>
                <li>Access controls and monitoring</li>
                <li>Secure cloud infrastructure</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-2">
                However, no method of transmission over the internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. Data Retention</h2>
              <p className="text-muted-foreground leading-relaxed">
                We retain your personal information for as long as necessary to provide our services and fulfill the purposes outlined in this Privacy Policy. You may request deletion of your account and associated data at any time through your account settings.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Your Privacy Rights</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                Depending on your location, you may have the following rights:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li><strong>Access:</strong> Request a copy of your personal information</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your personal information</li>
                <li><strong>Portability:</strong> Receive your data in a portable format</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Withdraw consent:</strong> Withdraw consent for data processing where applicable</li>
              </ul>
              <p className="text-muted-foreground leading-relaxed mt-4">
                To exercise these rights, please contact us using the information provided in Section 11.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-muted-foreground leading-relaxed">
                We use cookies and similar tracking technologies to enhance your experience, analyze usage patterns, and maintain your session. You can control cookie preferences through your browser settings, though some features may not function properly if cookies are disabled.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                Our platform integrates with third-party services (weather APIs, satellite data providers, market price feeds, AI services). These services have their own privacy policies, and we encourage you to review them.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Children's Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                SmartFarm AI is not intended for users under the age of 18. We do not knowingly collect information from children. If you become aware that a child has provided us with personal information, please contact us, and we will take steps to delete such information.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Contact Us</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                If you have questions or concerns about this Privacy Policy or our data practices, please contact us at:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">SmartFarm AI Support</p>
                <p className="text-muted-foreground">Email: privacy@smartfarm-ai.com</p>
                <p className="text-muted-foreground">Support: support@smartfarm-ai.com</p>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Changes to This Privacy Policy</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may update this Privacy Policy from time to time to reflect changes in our practices or for legal, regulatory, or operational reasons. We will notify you of any material changes by posting the updated policy on our platform and updating the "Last updated" date. Your continued use of SmartFarm AI after such changes constitutes your acceptance of the updated Privacy Policy.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. International Data Transfers</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your information may be transferred to and processed in countries other than your country of residence. We ensure that appropriate safeguards are in place to protect your information in accordance with this Privacy Policy and applicable data protection laws.
              </p>
            </section>

            <section className="border-t border-border pt-6 mt-8">
              <p className="text-sm text-muted-foreground">
                By using SmartFarm AI, you acknowledge that you have read and understood this Privacy Policy and agree to its terms.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/dashboard">
            <Button variant="default" size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
