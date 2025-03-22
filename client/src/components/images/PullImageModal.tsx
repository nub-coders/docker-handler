import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { pullImage } from "@/lib/docker";
import { useToast } from "@/hooks/use-toast";

interface PullImageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PullImageModal = ({ isOpen, onClose }: PullImageModalProps) => {
  const { toast } = useToast();
  const [imageName, setImageName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageName) {
      toast({
        title: "Image name required",
        description: "Please enter an image name to pull",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await pullImage(imageName);
      
      toast({
        title: "Image pulled",
        description: `Image ${imageName} has been pulled successfully.`,
      });
      
      setImageName("");
      onClose();
    } catch (error) {
      toast({
        title: "Failed to pull image",
        description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">Pull Image</DialogTitle>
        </DialogHeader>
        
        <form id="pull-image-form" className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <Label htmlFor="pull-image-name">Image Name</Label>
            <Input
              id="pull-image-name"
              value={imageName}
              onChange={(e) => setImageName(e.target.value)}
              placeholder="e.g. nginx:latest"
              required
            />
          </div>
          
          <DialogFooter className="pt-4 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setImageName("");
                onClose();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-secondary-500 hover:bg-secondary-400"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Pulling..." : "Pull Image"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PullImageModal;
