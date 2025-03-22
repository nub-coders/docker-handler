import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { fetchImages, runContainer } from "@/lib/docker";
import { useToast } from "@/hooks/use-toast";

interface RunContainerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const RunContainerModal = ({ isOpen, onClose }: RunContainerModalProps) => {
  const { toast } = useToast();
  const [containerName, setContainerName] = useState("");
  const [selectedImage, setSelectedImage] = useState("");
  const [ports, setPorts] = useState("");
  const [volumes, setVolumes] = useState("");
  const [env, setEnv] = useState("");
  const [restart, setRestart] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: images, isLoading: imagesLoading } = useQuery({
    queryKey: ["/api/images"],
    queryFn: fetchImages,
    enabled: isOpen, // Only fetch when modal is open
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedImage) {
      toast({
        title: "Image required",
        description: "Please select an image to run",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await runContainer({
        image: selectedImage,
        name: containerName,
        ports,
        volumes,
        env,
        restart,
      });
      
      toast({
        title: "Container created",
        description: `Container has been created successfully.`,
      });
      
      // Reset form and close modal
      resetForm();
      onClose();
    } catch (error) {
      toast({
        title: "Failed to create container",
        description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setContainerName("");
    setSelectedImage("");
    setPorts("");
    setVolumes("");
    setEnv("");
    setRestart(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) onClose();
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">Run New Container</DialogTitle>
        </DialogHeader>
        
        <form id="run-container-form" className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="container-image">Image</Label>
              <Select value={selectedImage} onValueChange={setSelectedImage}>
                <SelectTrigger id="container-image" className="w-full">
                  <SelectValue placeholder="Select an image" />
                </SelectTrigger>
                <SelectContent>
                  {imagesLoading ? (
                    <SelectItem value="loading" disabled>Loading images...</SelectItem>
                  ) : images && images.length > 0 ? (
                    images.map(image => (
                      <SelectItem 
                        key={image.id} 
                        value={`${image.repository}:${image.tag}`}
                      >
                        {image.repository}:{image.tag}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-images" disabled>No images available</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="container-name">Container Name</Label>
              <Input
                id="container-name"
                value={containerName}
                onChange={(e) => setContainerName(e.target.value)}
                placeholder="Optional container name"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="container-ports">Ports (host:container)</Label>
            <Input
              id="container-ports"
              value={ports}
              onChange={(e) => setPorts(e.target.value)}
              placeholder="e.g. 8080:80, 3000:3000"
            />
          </div>
          
          <div>
            <Label htmlFor="container-volumes">Volumes (host:container)</Label>
            <Input
              id="container-volumes"
              value={volumes}
              onChange={(e) => setVolumes(e.target.value)}
              placeholder="e.g. /data:/var/lib/data"
            />
          </div>
          
          <div>
            <Label htmlFor="container-env">Environment Variables</Label>
            <Textarea
              id="container-env"
              value={env}
              onChange={(e) => setEnv(e.target.value)}
              placeholder="KEY=VALUE (one per line)"
              rows={3}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox 
              id="container-restart" 
              checked={restart}
              onCheckedChange={(checked) => setRestart(checked as boolean)}
            />
            <Label htmlFor="container-restart" className="text-sm text-gray-700">Always restart</Label>
          </div>
          
          <DialogFooter className="pt-4 flex justify-end space-x-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              className="bg-primary-600 hover:bg-primary-700"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Run Container"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RunContainerModal;
