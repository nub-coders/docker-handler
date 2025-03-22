import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchImages, deleteImage, runContainer, formatBytes } from "@/lib/docker";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";
import BuildImageModal from "./BuildImageModal";
import PullImageModal from "./PullImageModal";

const ImagesList = () => {
  const { toast } = useToast();
  const { isAuthenticated, isVisitorMode, showAuthWarning } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isBuildModalOpen, setIsBuildModalOpen] = useState(false);
  const [isPullModalOpen, setIsPullModalOpen] = useState(false);

  const {
    data: images,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ["/api/images"],
    queryFn: fetchImages,
  });

  const handleDeleteImage = async (id: string, name: string) => {
    if (isVisitorMode) {
      showAuthWarning();
      return;
    }

    try {
      await deleteImage(id);
      toast({
        title: "Image deleted",
        description: `Image ${name} has been deleted successfully.`
      });
      refetch();
    } catch (error) {
      toast({
        title: "Failed to delete image",
        description: `An error occurred while deleting ${name}.`,
        variant: "destructive"
      });
    }
  };

  const handleRunContainer = async (image: string) => {
    if (isVisitorMode) {
      showAuthWarning();
      return;
    }

    try {
      await runContainer({ image });
      toast({
        title: "Container created",
        description: `Container from image ${image} has been created successfully.`
      });
    } catch (error) {
      toast({
        title: "Failed to create container",
        description: `An error occurred while creating container from ${image}.`,
        variant: "destructive"
      });
    }
  };

  const handleOpenBuildModal = () => {
    if (isVisitorMode) {
      showAuthWarning();
      return;
    }
    setIsBuildModalOpen(true);
  };

  const handleOpenPullModal = () => {
    if (isVisitorMode) {
      showAuthWarning();
      return;
    }
    setIsPullModalOpen(true);
  };

  // Filter images based on search query
  const filteredImages = images?.filter(image => {
    const repoTag = `${image.repository}:${image.tag}`;
    return repoTag.toLowerCase().includes(searchQuery.toLowerCase()) ||
           image.id.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <>
      {/* Create New Image Banner - Prominent at the top */}
      <Card className="mb-6 border-2 border-primary-300 bg-gradient-to-r from-primary-50 to-white">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <h2 className="text-xl font-bold text-gray-900 mb-2">Create your own Docker image</h2>
              <p className="text-gray-600 mb-0">Build custom images with your own Dockerfile or pull from Docker Hub</p>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                variant="outline"
                onClick={handleOpenPullModal}
                className="border-primary-500 text-primary-700 hover:bg-primary-50"
                size="lg"
              >
                <i className="ri-download-line mr-1 text-lg"></i> Pull Image
              </Button>
              <Button
                variant="default"
                onClick={handleOpenBuildModal}
                className="bg-primary-600 hover:bg-primary-700 text-white font-semibold shadow-md"
                size="lg"
              >
                <i className="ri-add-circle-line mr-1 text-lg"></i> Create New Image
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-lg font-medium text-gray-800">Image Management</h2>
          </div>
          
          {/* Image search and filter controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <div className="relative flex-1 max-w-md">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <i className="ri-search-line text-gray-400"></i>
              </div>
              <Input
                type="search"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant="outline"
              onClick={() => refetch()}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700"
            >
              <i className="ri-refresh-line mr-1"></i> Refresh
            </Button>
          </div>
          
          {/* Images list table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Repository</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tag</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image ID</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Created</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Size</th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <tr key={i}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-28" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-20" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-24" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <Skeleton className="h-4 w-16" />
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex space-x-2">
                          <Skeleton className="h-4 w-4" />
                          <Skeleton className="h-4 w-4" />
                        </div>
                      </td>
                    </tr>
                  ))
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-red-500 text-sm">Error loading images</td>
                  </tr>
                ) : filteredImages?.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-3 text-gray-500 text-sm text-center">No images found</td>
                  </tr>
                ) : (
                  filteredImages?.map(image => (
                    <tr key={image.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{image.repository}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{image.tag}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">{image.id.slice(0, 5)}...</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{image.created}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{formatBytes(image.size)}</td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium">
                        <div className="flex space-x-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Run Container"
                            onClick={() => handleRunContainer(`${image.repository}:${image.tag}`)}
                            className="text-green-500 hover:text-green-700"
                          >
                            <i className="ri-play-circle-line"></i>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            title="Remove"
                            onClick={() => handleDeleteImage(image.id, `${image.repository}:${image.tag}`)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
      
      <BuildImageModal
        isOpen={isBuildModalOpen}
        onClose={() => setIsBuildModalOpen(false)}
      />
      
      <PullImageModal
        isOpen={isPullModalOpen}
        onClose={() => setIsPullModalOpen(false)}
      />
    </>
  );
};

export default ImagesList;
