import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2 } from "lucide-react";
import Navigation from "@/components/Navigation";
import { chatWithFarmingAssistant } from "@/lib/gemini";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const Chatbot = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your SmartFarm AI assistant. I can help you with crop selection, farming techniques, fertilizers, pest control, market trends, and answer any agriculture-related questions. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    
    // Add user message
    const newMessages = [...messages, { role: "user" as const, content: userMessage }];
    setMessages(newMessages);
    
    setLoading(true);
    try {
      const response = await chatWithFarmingAssistant(userMessage, messages);

      setMessages([...newMessages, { role: "assistant", content: response }]);
    } catch (error: any) {
      console.error("Chatbot error:", error);
      
      // Provide a helpful fallback response when API is not available
      const fallbackResponse = `I understand you're asking about: "${userMessage}". 

Unfortunately, the AI assistant service is currently unavailable. Here are some general farming tips:

• For crop selection, consider your local climate, soil type, and water availability
• Regular soil testing helps determine nutrient needs
• Crop rotation prevents soil depletion and reduces pest problems
• Proper irrigation and drainage are crucial for healthy crops
• Monitor plants regularly for early signs of disease or pest infestation

To get full AI assistance, please ensure your Gemini API key is configured in the .env file.`;
      
      setMessages([
        ...newMessages,
        { role: "assistant", content: fallbackResponse },
      ]);
      toast.warning("Using fallback response. Please check your Gemini API key.");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted">
      <Navigation />
      
      <div className="container py-12">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 text-foreground">
              AI Farming Assistant
            </h1>
            <p className="text-muted-foreground text-lg">
              Get instant answers about crops, fertilizers, pest control, and farming best practices
            </p>
          </div>

          <Card className="h-[600px] flex flex-col">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center gap-2">
                <Bot className="h-5 w-5 text-primary" />
                Chat with AI Assistant
              </CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 ${
                    message.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  {message.role === "assistant" && (
                    <div className="rounded-full bg-primary p-2">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`rounded-lg px-4 py-3 max-w-[80%] ${
                      message.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                  </div>
                  
                  {message.role === "user" && (
                    <div className="rounded-full bg-accent p-2">
                      <User className="h-4 w-4 text-accent-foreground" />
                    </div>
                  )}
                </div>
              ))}
              
              {loading && (
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-primary p-2">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg px-4 py-3">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </CardContent>

            <div className="border-t p-4">
              <div className="flex gap-2">
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about farming..."
                  disabled={loading}
                  className="flex-1"
                />
                <Button
                  onClick={sendMessage}
                  disabled={loading || !input.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Chatbot;