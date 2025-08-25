import { useState } from "react";
import { Eye, Download, Trash2, Send, Search, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { queryClient } from "@/lib/queryClient";
import type { File } from "@shared/schema";

interface FileTableProps {
  files: File[];
}

export default function FileTable({ files }: FileTableProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const filteredFiles = files.filter((file) => {
    const matchesSearch = !searchQuery || 
      file.studentId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      file.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = !statusFilter || statusFilter === "all" || file.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleSelectFile = (fileId: string, checked: boolean) => {
    if (checked) {
      setSelectedFiles([...selectedFiles, fileId]);
    } else {
      setSelectedFiles(selectedFiles.filter(id => id !== fileId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const uploadedFileIds = filteredFiles
        .filter(file => file.status === "uploaded")
        .map(file => file.id);
      setSelectedFiles(uploadedFileIds);
    } else {
      setSelectedFiles([]);
    }
  };

  const handleDownload = async (fileId: string) => {
    setIsLoading(true);
    try {
      const response = await apiRequest("POST", `/api/files/${fileId}/download`, {});
      const data = await response.json();
      
      toast({
        title: "File Downloaded Successfully!",
        description: `Token ${data.token} sent to student`,
      });
      
      queryClient.invalidateQueries({ queryKey: ["/api/files"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
    } catch (error) {
      toast({
        title: "Download failed",
        description: "Failed to download file. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchDownload = () => {
    if (selectedFiles.length > 0) {
      // Trigger batch download modal
      const event = new CustomEvent("openBatchDownloadModal", { 
        detail: { fileIds: selectedFiles, files: filteredFiles.filter(f => selectedFiles.includes(f.id)) } 
      });
      window.dispatchEvent(event);
    }
  };

  const handleDelete = async (fileId: string) => {
    if (confirm("Are you sure you want to delete this file?")) {
      try {
        await apiRequest("DELETE", `/api/files/${fileId}`, {});
        toast({
          title: "File deleted",
          description: "File has been successfully deleted.",
        });
        queryClient.invalidateQueries({ queryKey: ["/api/files"] });
        queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      } catch (error) {
        toast({
          title: "Delete failed",
          description: "Failed to delete file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleResendNotification = async (fileId: string) => {
    try {
      await apiRequest("POST", `/api/files/${fileId}/resend-notification`, {});
      toast({
        title: "Notification sent",
        description: "Notification has been resent to student.",
      });
    } catch (error) {
      toast({
        title: "Failed to send notification",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      uploaded: { variant: "secondary" as const, text: "Pending", color: "bg-yellow-100 text-yellow-800" },
      downloaded: { variant: "default" as const, text: "Downloaded", color: "bg-green-100 text-green-800" },
      notified: { variant: "outline" as const, text: "Notified", color: "bg-blue-100 text-blue-800" },
    };
    
    const config = variants[status as keyof typeof variants] || variants.uploaded;
    
    return (
      <Badge className={config.color}>
        {config.text}
      </Badge>
    );
  };

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const iconClass = "mr-2";
    
    switch (ext) {
      case 'pdf':
        return <span className={`fas fa-file-pdf text-red-500 ${iconClass}`}></span>;
      case 'doc':
      case 'docx':
        return <span className={`fas fa-file-word text-blue-600 ${iconClass}`}></span>;
      case 'ppt':
      case 'pptx':
        return <span className={`fas fa-file-powerpoint text-orange-600 ${iconClass}`}></span>;
      case 'xls':
      case 'xlsx':
        return <span className={`fas fa-file-excel text-green-600 ${iconClass}`}></span>;
      default:
        return <span className={`fas fa-file text-slate-500 ${iconClass}`}></span>;
    }
  };

  return (
    <Card className="border border-slate-200" data-testid="file-table">
      <CardHeader className="px-6 py-4 border-b border-slate-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">File Management</h3>
            <p className="text-slate-600 text-sm mt-1">View, download, and manage student submissions</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button 
              onClick={handleBatchDownload}
              disabled={selectedFiles.length === 0}
              className="bg-green-600 hover:bg-green-700"
              data-testid="button-batch-download"
            >
              <Download size={16} className="mr-2" />
              Batch Download
            </Button>
            <Button 
              variant="outline"
              onClick={() => {
                queryClient.invalidateQueries({ queryKey: ["/api/files"] });
                queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
              }}
              data-testid="button-refresh"
            >
              <RefreshCw size={16} className="mr-2" />
              Refresh
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 mt-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={16} />
            <Input
              type="text"
              placeholder="Search by Student ID, Name, or File Name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="input-search"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40" data-testid="select-status-filter">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="uploaded">Uploaded</SelectItem>
                <SelectItem value="downloaded">Downloaded</SelectItem>
                <SelectItem value="notified">Notified</SelectItem>
              </SelectContent>
            </Select>
            <Select value={dateFilter} onValueChange={setDateFilter}>
              <SelectTrigger className="w-40" data-testid="select-date-filter">
                <SelectValue placeholder="All Dates" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Dates</SelectItem>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        {/* Desktop Table View */}
        <div className="hidden lg:block overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left">
                  <Checkbox
                    checked={selectedFiles.length > 0 && selectedFiles.length === filteredFiles.filter(f => f.status === "uploaded").length}
                    onCheckedChange={handleSelectAll}
                    data-testid="checkbox-select-all"
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Student ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Student Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  File Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Upload Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  File Size
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Token
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {filteredFiles.map((file) => (
                <tr key={file.id} className="hover:bg-slate-50 transition-colors" data-testid={`file-row-${file.id}`}>
                  <td className="px-6 py-4">
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                      disabled={file.status !== "uploaded"}
                      data-testid={`checkbox-file-${file.id}`}
                    />
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-slate-900" data-testid={`text-student-id-${file.id}`}>
                    {file.studentId}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900" data-testid={`text-student-name-${file.id}`}>
                    {file.studentName}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-900">
                    <div className="flex items-center">
                      {getFileIcon(file.fileName)}
                      <span data-testid={`text-file-name-${file.id}`}>{file.fileName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500" data-testid={`text-upload-date-${file.id}`}>
                    {new Date(file.uploadDate).toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-sm text-slate-500" data-testid={`text-file-size-${file.id}`}>
                    {file.fileSize}
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(file.status)}
                  </td>
                  <td className="px-6 py-4 text-sm font-mono text-slate-900" data-testid={`text-token-${file.id}`}>
                    {file.token || "-"}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDownload(file.id)}
                        disabled={file.status !== "uploaded" || isLoading}
                        className="text-primary hover:bg-blue-50"
                        data-testid={`button-download-${file.id}`}
                      >
                        <Download size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-slate-600 hover:bg-slate-50"
                        data-testid={`button-view-${file.id}`}
                      >
                        <Eye size={16} />
                      </Button>
                      {file.status === "downloaded" || file.status === "notified" ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleResendNotification(file.id)}
                          className="text-primary hover:bg-blue-50"
                          data-testid={`button-resend-${file.id}`}
                        >
                          <Send size={16} />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(file.id)}
                          className="text-red-500 hover:bg-red-50"
                          data-testid={`button-delete-${file.id}`}
                        >
                          <Trash2 size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="lg:hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50">
            <Checkbox
              checked={selectedFiles.length > 0 && selectedFiles.length === filteredFiles.filter(f => f.status === "uploaded").length}
              onCheckedChange={handleSelectAll}
              data-testid="checkbox-select-all-mobile"
            />
            <span className="ml-2 text-sm text-slate-600">Select All</span>
          </div>
          
          <div className="divide-y divide-slate-200">
            {filteredFiles.map((file) => (
              <div key={file.id} className="p-4 hover:bg-slate-50" data-testid={`file-card-${file.id}`}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Checkbox
                      checked={selectedFiles.includes(file.id)}
                      onCheckedChange={(checked) => handleSelectFile(file.id, checked as boolean)}
                      disabled={file.status !== "uploaded"}
                      data-testid={`checkbox-file-mobile-${file.id}`}
                    />
                    <div>
                      <p className="font-medium text-slate-900" data-testid={`text-student-name-mobile-${file.id}`}>
                        {file.studentName}
                      </p>
                      <p className="text-sm text-slate-500" data-testid={`text-student-id-mobile-${file.id}`}>
                        {file.studentId}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(file.status)}
                </div>

                <div className="mb-3">
                  <div className="flex items-center mb-1">
                    {getFileIcon(file.fileName)}
                    <span className="text-sm font-medium text-slate-900 truncate" data-testid={`text-file-name-mobile-${file.id}`}>
                      {file.fileName}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
                    <div>Size: {file.fileSize}</div>
                    <div>{new Date(file.uploadDate).toLocaleDateString()}</div>
                  </div>
                  {file.token && (
                    <div className="text-xs font-mono text-slate-700 mt-1">
                      Token: {file.token}
                    </div>
                  )}
                </div>

                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDownload(file.id)}
                    disabled={file.status !== "uploaded" || isLoading}
                    className="flex-1"
                    data-testid={`button-download-mobile-${file.id}`}
                  >
                    <Download size={14} className="mr-1" />
                    Download
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    data-testid={`button-view-mobile-${file.id}`}
                  >
                    <Eye size={14} className="mr-1" />
                    View
                  </Button>
                  {file.status === "downloaded" || file.status === "notified" ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleResendNotification(file.id)}
                      className="flex-1"
                      data-testid={`button-resend-mobile-${file.id}`}
                    >
                      <Send size={14} className="mr-1" />
                      Resend
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      className="flex-1 text-red-600 hover:bg-red-50"
                      data-testid={`button-delete-mobile-${file.id}`}
                    >
                      <Trash2 size={14} className="mr-1" />
                      Delete
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {filteredFiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No files found matching your criteria.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}