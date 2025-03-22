import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

const AuthModal = () => {
  const { isAuthenticated, login, setVisitorMode } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isOpen, setIsOpen] = useState(true);

  useEffect(() => {
    setIsOpen(!isAuthenticated);
  }, [isAuthenticated]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const success = await login(username, password);
      if (!success) {
        setError("Invalid username or password. Please try again.");
      }
    } catch (err) {
      setError("Authentication failed. Please try again.");
    }
  };

  const handleVisitorAccess = () => {
    setVisitorMode(true);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <VisuallyHidden>
          <DialogTitle>Authentication Required</DialogTitle>
        </VisuallyHidden>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Authentication Required</h2>
          <div className="h-8 w-24 bg-primary-600 flex items-center justify-center text-white rounded">
            <span className="font-bold">Docker</span>
          </div>
        </div>
        <p className="text-gray-600 mb-4">Please authenticate to access Docker management tools.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="username" className="text-sm font-medium text-gray-700">
              Username
            </Label>
            <Input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-sm font-medium text-gray-700">
              Password
            </Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>
          
          {error && <div className="text-red-500 text-sm">{error}</div>}
          
          <div className="pt-2 space-y-3">
            <Button type="submit" className="w-full bg-primary-600 hover:bg-primary-700">
              Login
            </Button>
            
            <div className="text-center">
              <span className="text-sm text-gray-500">or</span>
            </div>
            
            <Button 
              type="button" 
              variant="outline" 
              className="w-full" 
              onClick={handleVisitorAccess}
            >
              <i className="ri-eye-line mr-1"></i> Continue as Visitor
            </Button>
            
            <p className="text-xs text-gray-500 text-center mt-2">
              Visitor mode has view-only access. You'll need to login to perform actions.
            </p>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
