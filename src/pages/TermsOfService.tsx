import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileText } from "lucide-react";

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container max-w-4xl mx-auto px-4 py-8">
        <Link to="/login">
          <Button variant="ghost" className="mb-6 gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Login
          </Button>
        </Link>

        <div className="bg-card border border-border rounded-lg shadow-lg p-8">
          <div className="flex items-center gap-3 mb-6">
            <FileText className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Terms of Service</h1>
          </div>

          <p className="text-muted-foreground mb-6">
            Last updated: January 1, 2026
          </p>

          <div className="space-y-8 text-foreground">
            <section>
              <h2 className="text-2xl font-semibold mb-4">1. Acceptance of Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                By accessing and using SmartFarm AI ("the Service"), you accept and agree to be bound by the terms and provisions of this agreement. If you do not agree to these Terms of Service, please do not use the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">2. Description of Service</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                SmartFarm AI provides an agricultural intelligence platform offering:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>AI-powered crop prediction and recommendations</li>
                <li>Smart irrigation optimization</li>
                <li>Plant disease analysis and diagnostics</li>
                <li>Groundwater monitoring and forecasting</li>
                <li>Agricultural market price tracking</li>
                <li>Weather-based farming insights</li>
                <li>Satellite imagery analysis for field monitoring</li>
                <li>AI chatbot for farming guidance</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">3. User Accounts</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">3.1 Account Creation</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You must create an account to access most features of the Service. You agree to provide accurate, current, and complete information during registration and to update such information as necessary.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">3.2 Account Security</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">3.3 Account Termination</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    We reserve the right to suspend or terminate your account at any time for violation of these terms or for any other reason at our sole discretion.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">4. Acceptable Use</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                You agree not to:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>Use the Service for any illegal or unauthorized purpose</li>
                <li>Violate any laws in your jurisdiction</li>
                <li>Transmit any viruses, malware, or harmful code</li>
                <li>Attempt to gain unauthorized access to the Service or related systems</li>
                <li>Interfere with or disrupt the Service or servers</li>
                <li>Use automated systems to access the Service without permission</li>
                <li>Resell or redistribute the Service without authorization</li>
                <li>Impersonate any person or entity</li>
                <li>Collect or harvest user information without consent</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">5. Intellectual Property</h2>
              <div className="space-y-4">
                <div>
                  <h3 className="text-xl font-semibold mb-2">5.1 Our Content</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    The Service, including its original content, features, and functionality, is owned by SmartFarm AI and is protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
                  </p>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-2">5.2 Your Content</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    You retain ownership of any data, images, or content you upload to the Service. By uploading content, you grant us a license to use, store, and process such content to provide and improve the Service.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">6. AI-Powered Recommendations</h2>
              <div className="space-y-4">
                <p className="text-muted-foreground leading-relaxed">
                  The Service uses artificial intelligence and machine learning to provide agricultural recommendations, predictions, and analysis. You acknowledge and agree that:
                </p>
                <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                  <li>AI recommendations are provided for informational purposes only</li>
                  <li>Results may vary and are not guaranteed</li>
                  <li>You should use professional judgment and consult with agricultural experts</li>
                  <li>We are not liable for farming decisions based on our recommendations</li>
                  <li>Disease diagnoses should be confirmed by agricultural professionals</li>
                  <li>Weather and market predictions are estimates and may not be accurate</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">7. Disclaimer of Warranties</h2>
              <p className="text-muted-foreground leading-relaxed">
                THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, TIMELY, SECURE, OR ERROR-FREE.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">8. Limitation of Liability</h2>
              <p className="text-muted-foreground leading-relaxed">
                TO THE MAXIMUM EXTENT PERMITTED BY LAW, SMARTFARM AI SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4 mt-2">
                <li>Your use or inability to use the Service</li>
                <li>Any unauthorized access to or use of our servers</li>
                <li>Any interruption or cessation of transmission to or from the Service</li>
                <li>Any bugs, viruses, or other harmful code</li>
                <li>Any errors or omissions in content</li>
                <li>Crop failures or agricultural losses based on our recommendations</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">9. Third-Party Services</h2>
              <p className="text-muted-foreground leading-relaxed">
                The Service may integrate with or link to third-party services (weather APIs, satellite data, market price feeds, AI services). We are not responsible for the content, accuracy, or practices of these third-party services.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">10. Data and Privacy</h2>
              <p className="text-muted-foreground leading-relaxed">
                Your use of the Service is also governed by our Privacy Policy. Please review our <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> to understand our data collection and use practices.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">11. Modifications to Service</h2>
              <p className="text-muted-foreground leading-relaxed">
                We reserve the right to modify, suspend, or discontinue the Service (or any part thereof) at any time with or without notice. We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">12. Changes to Terms</h2>
              <p className="text-muted-foreground leading-relaxed">
                We may revise these Terms of Service from time to time. The most current version will always be posted on our platform. By continuing to use the Service after revisions become effective, you agree to be bound by the revised terms.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">13. Governing Law</h2>
              <p className="text-muted-foreground leading-relaxed">
                These Terms shall be governed by and construed in accordance with applicable laws, without regard to conflict of law provisions. Any disputes arising from these Terms or the Service shall be resolved in the appropriate courts.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">14. Severability</h2>
              <p className="text-muted-foreground leading-relaxed">
                If any provision of these Terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-4">15. Contact Information</h2>
              <p className="text-muted-foreground leading-relaxed mb-2">
                For questions about these Terms of Service, please contact us:
              </p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="font-semibold">SmartFarm AI Legal</p>
                <p className="text-muted-foreground">Email: legal@smartfarm-ai.com</p>
                <p className="text-muted-foreground">Support: support@smartfarm-ai.com</p>
              </div>
            </section>

            <section className="border-t border-border pt-6 mt-8">
              <p className="text-sm text-muted-foreground">
                By using SmartFarm AI, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
              </p>
            </section>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/login">
            <Button variant="default" size="lg" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Return to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
