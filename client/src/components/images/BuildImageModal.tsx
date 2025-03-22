import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { buildImage, runContainer } from "@/lib/docker";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/lib/auth";

interface BuildImageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const BuildImageModal = ({ isOpen, onClose }: BuildImageModalProps) => {
  const { toast } = useToast();
  const { isVisitorMode, showAuthWarning } = useAuth();
  const [buildMode, setBuildMode] = useState("path");
  const [imageName, setImageName] = useState("");
  const [imageTag, setImageTag] = useState("latest");
  const [dockerfilePath, setDockerfilePath] = useState("");
  const [buildContext, setBuildContext] = useState("");
  const [buildArgs, setBuildArgs] = useState("");
  const [dockerfileContent, setDockerfileContent] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buildSuccess, setBuildSuccess] = useState(false);
  const [builtImageName, setBuiltImageName] = useState("");

  const handleRunBuiltImage = async () => {
    if (isVisitorMode) {
      showAuthWarning();
      return;
    }

    try {
      await runContainer({ image: builtImageName });
      toast({
        title: "Container started",
        description: `Container from image ${builtImageName} has been started successfully.`,
      });
    } catch (error) {
      toast({
        title: "Failed to start container",
        description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!imageName) {
      toast({
        title: "Missing required fields",
        description: "Please enter an image name",
        variant: "destructive",
      });
      return;
    }
    
    if (buildMode === "path" && (!dockerfilePath || !buildContext)) {
      toast({
        title: "Missing required fields",
        description: "Please fill in both Dockerfile path and build context",
        variant: "destructive",
      });
      return;
    }
    
    if (buildMode === "content" && !dockerfileContent) {
      toast({
        title: "Missing Dockerfile content",
        description: "Please provide the Dockerfile content",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    setBuildSuccess(false);
    
    try {
      const fullImageName = `${imageName}:${imageTag || "latest"}`;
      
      // If using content mode, we need to create a temporary Dockerfile
      if (buildMode === "content") {
        // This is a simplified approach - the server would need additional handling
        // to create a temporary Dockerfile from the provided content
        await buildImage({
          name: imageName,
          tag: imageTag || "latest",
          dockerfilePath: "Dockerfile", // Default name
          buildContext: ".", // Current directory
          buildArgs,
          dockerfileContent, // Pass content to server
        });
      } else {
        await buildImage({
          name: imageName,
          tag: imageTag || "latest",
          dockerfilePath,
          buildContext,
          buildArgs,
        });
      }
      
      toast({
        title: "Image built successfully",
        description: `Image ${fullImageName} has been built. You can now run a container from this image.`,
      });
      
      // Save the successfully built image name
      setBuiltImageName(fullImageName);
      setBuildSuccess(true);
    } catch (error) {
      toast({
        title: "Failed to build image",
        description: `An error occurred: ${error instanceof Error ? error.message : String(error)}`,
        variant: "destructive",
      });
      setBuildSuccess(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setImageName("");
    setImageTag("latest");
    setDockerfilePath("");
    setBuildContext("");
    setBuildArgs("");
    setDockerfileContent("");
    setBuildMode("path");
    setBuildSuccess(false);
    setBuiltImageName("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose();
    }}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-800">Create New Docker Image</DialogTitle>
          <DialogDescription>
            Create a new Docker image by uploading a Dockerfile or entering Dockerfile content directly. Use the tabs below to choose your preferred method.
          </DialogDescription>
        </DialogHeader>
        
        {buildSuccess ? (
          <div className="space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
              <div className="flex items-center mb-2">
                <svg className="w-5 h-5 mr-2 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                </svg>
                <p className="font-medium">Image built successfully!</p>
              </div>
              <p>Your Docker image <code className="bg-green-100 px-1 py-0.5 rounded">{builtImageName}</code> has been created successfully.</p>
            </div>
            
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base font-medium mb-2">What would you like to do next?</h3>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={handleRunBuiltImage}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    <i className="ri-play-circle-line mr-1"></i> Run Container from this Image
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleClose}
                  >
                    Close
                  </Button>
                </div>
              </div>
              <div className="text-sm text-gray-500">
                <p>You can also find this image in the Images list and run it later.</p>
              </div>
            </div>
          </div>
        ) : (
          <form id="build-image-form" className="space-y-4" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="image-name">Image Name</Label>
                <Input
                  id="image-name"
                  value={imageName}
                  onChange={(e) => setImageName(e.target.value)}
                  placeholder="e.g. myapp"
                  required
                />
              </div>
              <div>
                <Label htmlFor="image-tag">Tag</Label>
                <Input
                  id="image-tag"
                  value={imageTag}
                  onChange={(e) => setImageTag(e.target.value)}
                  placeholder="e.g. latest, v1.0"
                />
              </div>
            </div>
            
            <Tabs value={buildMode} onValueChange={setBuildMode} className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="path">Use Dockerfile Path</TabsTrigger>
                <TabsTrigger value="content">Enter Dockerfile Content</TabsTrigger>
              </TabsList>
              
              <TabsContent value="path" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="dockerfile-path">Dockerfile Path</Label>
                  <Input
                    id="dockerfile-path"
                    value={dockerfilePath}
                    onChange={(e) => setDockerfilePath(e.target.value)}
                    placeholder="e.g. /path/to/Dockerfile"
                  />
                </div>
                
                <div>
                  <Label htmlFor="build-context">Build Context</Label>
                  <Input
                    id="build-context"
                    value={buildContext}
                    onChange={(e) => setBuildContext(e.target.value)}
                    placeholder="e.g. /path/to/build/context"
                  />
                </div>
              </TabsContent>
              
              <TabsContent value="content" className="space-y-4 pt-4">
                <div>
                  <Label htmlFor="dockerfile-content" className="text-base font-medium mb-2 block">
                    Enter Dockerfile Content Below
                  </Label>
                  <Textarea
                    id="dockerfile-content"
                    value={dockerfileContent}
                    onChange={(e) => setDockerfileContent(e.target.value)}
                    placeholder="FROM node:14
WORKDIR /app
COPY . .
RUN npm install
CMD npm start"
                    className="font-mono bg-gray-50 border-2 border-gray-300 focus:border-primary-500 resize-y"
                    rows={10}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Enter your Dockerfile instructions here. This content will be used to build your Docker image.
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            
            <div>
              <Label htmlFor="build-args">Build Arguments</Label>
              <Textarea
                id="build-args"
                value={buildArgs}
                onChange={(e) => setBuildArgs(e.target.value)}
                placeholder="ARG=VALUE (one per line)"
                rows={3}
              />
            </div>
            
            <DialogFooter className="pt-4 flex justify-end space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                className="bg-primary-600 hover:bg-primary-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Building..." : "Build Image"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BuildImageModal;
