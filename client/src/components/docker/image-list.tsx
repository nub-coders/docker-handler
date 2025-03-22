import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Image } from "@shared/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCw, 
  Server, 
  Trash2, 
  AlertCircle 
} from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ImageListProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  refreshData: () => void;
}

export default function ImageList({
  searchTerm,
  setSearchTerm,
  refreshData,
}: ImageListProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [imageToDelete, setImageToDelete] = useState<Image | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Get images
  const { data: images = [] } = useQuery<Image[]>({
    queryKey: ["/api/images"],
  });

  // Delete image mutation
  const deleteImageMutation = useMutation({
    mutationFn: async (imageId: string) => {
      const res = await apiRequest("DELETE", `/api/images/${imageId}`);
      return res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Success",
        description: data.message || "Image deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/images"] });
      setIsDeleteDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete image",
        variant: "destructive",
      });
      setIsDeleteDialogOpen(false);
    },
  });

  const handleDeleteImage = (image: Image) => {
    setImageToDelete(image);
    setIsDeleteDialogOpen(true);
  };

  const confirmDeleteImage = () => {
    if (imageToDelete) {
      deleteImageMutation.mutate(imageToDelete.id);
    }
  };

  const formatCreatedTime = (created: string) => {
    try {
      // Try to parse as date directly
      const date = new Date(created);
      if (!isNaN(date.getTime())) {
        // Check if it's within the last day
        const now = new Date();
        const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
        
        if (diffInHours < 1) {
          return `${Math.floor(diffInHours * 60)} minutes ago`;
        } else if (diffInHours < 24) {
          return `${Math.floor(diffInHours)} hours ago`;
        } else if (diffInHours < 48) {
          return "1 day ago";
        } else {
          return `${Math.floor(diffInHours / 24)} days ago`;
        }
      }
      
      // If the date is not a valid date object, return the original string
      return created;
    } catch (error) {
      // If parsing fails, return the original string
      return created;
    }
  };

  // Filter images based on search term
  const filteredImages = images.filter((image: Image) => {
    const searchString = searchTerm.toLowerCase();
    return (
      image.name.toLowerCase().includes(searchString) ||
      image.tag.toLowerCase().includes(searchString)
    );
  });

  return (
    <>
      <Card className="mb-6">
        <div className="p-4 border-b border-slate-200 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h3 className="font-medium text-slate-800">Docker Images</h3>
          <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2">
            <div className="relative">
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search images..."
                className="pl-8 pr-3 py-1.5 w-full md:w-64 h-9"
              />
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-slate-400 absolute left-2.5 top-1/2 transform -translate-y-1/2"
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <Button
              onClick={refreshData}
              size="sm"
              className="flex items-center h-9"
            >
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50">
              <TableRow>
                <TableHead>Repository</TableHead>
                <TableHead>Tag</TableHead>
                <TableHead>ID</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredImages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                    No images found
                  </TableCell>
                </TableRow>
              ) : (
                filteredImages.map((image: Image) => (
                  <TableRow key={image.id} className="hover:bg-slate-50">
                    <TableCell>
                      <div className="flex items-center">
                        <Server className="text-slate-500 mr-2 h-5 w-5" />
                        <div className="text-sm font-medium text-slate-900">
                          {image.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className="bg-blue-100 text-blue-800 hover:bg-blue-100"
                      >
                        {image.tag}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500 font-mono">
                      {image.id.substring(0, 12)}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {image.size}
                    </TableCell>
                    <TableCell className="text-sm text-slate-500">
                      {formatCreatedTime(image.created)}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-red-500 hover:text-red-700 hover:bg-transparent"
                          onClick={() => handleDeleteImage(image)}
                          disabled={deleteImageMutation.isPending}
                        >
                          <Trash2 className="h-5 w-5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-between">
          <div className="text-sm text-slate-500">
            Showing <span className="font-medium">1</span> to{" "}
            <span className="font-medium">{filteredImages.length}</span> of{" "}
            <span className="font-medium">{filteredImages.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              disabled={true}
            >
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={true}
            >
              Next
            </Button>
          </div>
        </div>
      </Card>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
              Delete Image
            </AlertDialogTitle>
            <AlertDialogDescription>
              <p className="mb-2">
                Are you sure you want to delete <span className="font-medium">{imageToDelete?.name}:{imageToDelete?.tag}</span>?
              </p>
              <p className="mb-2">
                This action may fail if this image is being used by any containers.
              </p>
              <p>
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteImageMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteImage}
              disabled={deleteImageMutation.isPending}
              className="bg-red-500 hover:bg-red-600"
            >
              {deleteImageMutation.isPending ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}