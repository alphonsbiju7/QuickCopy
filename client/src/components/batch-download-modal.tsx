import { useState, useEffect } from "react";
import { Archive, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";

interface BatchDownloadModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function BatchDownloadModal({ isOpen = false, onClose }: BatchDownloadModalProps) {
  const [open, setOpen] = useState(isOpen);
  const [selectedData, setSelectedData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      setSelectedData(event.detail);
      setOpen(true);
    };

    window.addEventListener("openBatchDownloadModal" as any, handleOpenModal);
    return () => window.removeEventListener("openBatchDownloadModal" as any, handleOpenModal);
  }, []);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleConfirm = async () => {
    if (!selectedData?.fileIds) return;

    setIsLoading(true);
    try {
      const response = await apiRequest("POST", "/api/files/batch-download", {
        fileIds: selectedData.fileIds,
      });
      const data = await response.json();
      
      toast({
        title: "Batch Download Successful!",
        description: `${data.results.length} files downloaded and notifications sent`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      handleClose();
    } catch (error) {
      toast({
        title: "Batch download failed",
        description: "Failed to download files. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg" data-testid="batch-download-modal">
        <DialogHeader>
          <DialogTitle>Batch Download</DialogTitle>
        </DialogHeader>
        
        {selectedData && (
          <div className="py-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <Archive className="text-green-600" size={20} />
              </div>
              <div>
                <p className="font-medium text-slate-900">Download Multiple Files</p>
                <p className="text-sm text-slate-500" data-testid="selected-files-count">
                  {selectedData.files?.length || 0} files selected for download
                </p>
              </div>
            </div>
            
            <div className="bg-slate-50 rounded-lg p-4 mb-6">
              <p className="text-sm font-medium text-slate-700 mb-2">Selected Files:</p>
              <ul className="space-y-1 text-sm text-slate-600">
                {selectedData.files?.map((file: any) => (
                  <li key={file.id} data-testid={`selected-file-${file.id}`}>
                    • {file.fileName} ({file.studentId})
                  </li>
                ))}
              </ul>
            </div>
            
            <p className="text-slate-600 mb-6">
              Files will be compressed into a ZIP archive. Notifications with collection tokens will be sent to all students.
            </p>
            
            <div className="flex items-center justify-end space-x-3">
              <Button variant="outline" onClick={handleClose} disabled={isLoading} data-testid="button-cancel-batch">
                Cancel
              </Button>
              <Button 
                onClick={handleConfirm} 
                disabled={isLoading}
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-confirm-batch"
              >
                {isLoading ? "Processing..." : "Download All & Notify"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}