import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface DownloadModalProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DownloadModal({ isOpen = false, onClose }: DownloadModalProps) {
  const [open, setOpen] = useState(isOpen);
  const [selectedFile, setSelectedFile] = useState<any>(null);

  useEffect(() => {
    const handleOpenModal = (event: CustomEvent) => {
      setSelectedFile(event.detail);
      setOpen(true);
    };

    window.addEventListener("openDownloadModal" as any, handleOpenModal);
    return () => window.removeEventListener("openDownloadModal" as any, handleOpenModal);
  }, []);

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  const handleConfirm = () => {
    // This would be handled by the parent component
    handleClose();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md" data-testid="download-modal">
        <DialogHeader>
          <DialogTitle>Download Confirmation</DialogTitle>
        </DialogHeader>
        
        {selectedFile && (
          <div className="py-4">
            <div className="flex items-center space-x-3 mb-4">
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Download className="text-primary" size={20} />
              </div>
              <div>
                <p className="font-medium text-slate-900" data-testid="selected-file-name">
                  {selectedFile.fileName}
                </p>
                <p className="text-sm text-slate-500" data-testid="selected-file-student">
                  Student: {selectedFile.studentName} ({selectedFile.studentId})
                </p>
              </div>
            </div>
            <p className="text-slate-600 mb-6">
              After downloading, a notification with a collection token will be automatically sent to the student.
            </p>
            <div className="flex items-center justify-end space-x-3">
              <Button variant="outline" onClick={handleClose} data-testid="button-cancel-download">
                Cancel
              </Button>
              <Button onClick={handleConfirm} data-testid="button-confirm-download">
                Download & Notify
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}