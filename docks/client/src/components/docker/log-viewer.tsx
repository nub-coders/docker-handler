import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Container } from "@shared/schema";
import { useQuery } from "@tanstack/react-query";
import { Download, X, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";

interface LogViewerProps {
  container: Container;
  isOpen: boolean;
  onClose: () => void;
}

export default function LogViewer({ container, isOpen, onClose }: LogViewerProps) {
  const [logLines, setLogLines] = useState<number>(100);
  const [autoScroll, setAutoScroll] = useState<boolean>(true);
  const logRef = useRef<HTMLPreElement>(null);

  // Fetch container logs
  const { data, isLoading, error } = useQuery({
    queryKey: ["/api/containers", container.id, "logs", logLines],
    queryFn: async () => {
      const res = await fetch(`/api/containers/${container.id}/logs?lines=${logLines}`);
      if (!res.ok) {
        throw new Error("Failed to fetch logs");
      }
      return res.json();
    },
    enabled: isOpen,
    refetchInterval: autoScroll ? 2000 : false, // Auto-refresh if auto-scroll is enabled
  });

  // Auto-scroll to bottom when logs update
  useEffect(() => {
    if (autoScroll && logRef.current && data) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [data, autoScroll]);

  const handleDownload = () => {
    if (!data?.logs) return;
    
    const blob = new Blob([data.logs], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    
    a.href = url;
    a.download = `${container.name}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col p-0">
        <DialogHeader className="p-4 border-b border-slate-200 flex flex-row items-center justify-between">
          <DialogTitle className="flex items-center">
            <FileText className="h-5 w-5 text-primary mr-2" />
            <span>Container Logs: <span className="text-primary">{container.name}</span></span>
          </DialogTitle>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              className="bg-slate-100 hover:bg-slate-200"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-1" />
              Download
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-slate-500 hover:text-slate-700"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-4 bg-slate-800" ref={logRef}>
          {isLoading ? (
            <div className="flex justify-center items-center h-full">
              <div className="text-slate-300">Loading logs...</div>
            </div>
          ) : error ? (
            <div className="text-red-500">
              Error loading logs: {(error as Error).message}
            </div>
          ) : (
            <pre className="font-mono text-xs text-slate-200 whitespace-pre-wrap">
              {data?.logs || "No logs available"}
            </pre>
          )}
        </div>
        
        <div className="p-4 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center">
            <Select
              value={logLines.toString()}
              onValueChange={(value) => setLogLines(parseInt(value))}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Number of lines" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="100">Last 100 lines</SelectItem>
                <SelectItem value="250">Last 250 lines</SelectItem>
                <SelectItem value="500">Last 500 lines</SelectItem>
                <SelectItem value="1000">Last 1000 lines</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="auto-scroll"
              checked={autoScroll}
              onCheckedChange={(checked) => setAutoScroll(checked as boolean)}
            />
            <label
              htmlFor="auto-scroll"
              className="text-sm text-slate-700 cursor-pointer"
            >
              Auto-scroll
            </label>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
