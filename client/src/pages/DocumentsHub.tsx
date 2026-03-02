import React, { useEffect, useState, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useLabel } from '@/store/appStore';
import { apiGet, apiDelete } from '@/hooks/useApi';
import { toast } from 'sonner';
import { useDropzone } from 'react-dropzone';
import { FileText, Upload, Trash2, Download, Cloud } from 'lucide-react';

export default function DocumentsHub() {
    const label = useLabel();
    const [docs, setDocs] = useState<any[]>([]);

    const fetchData = async () => {
        try { const res = await apiGet('/documents/all'); setDocs(res.data || []); }
        catch { toast.error('Failed to load documents'); }
    };
    useEffect(() => { fetchData(); }, []);

    const onDrop = useCallback(async (acceptedFiles: File[]) => {
        const formData = new FormData();
        acceptedFiles.forEach(f => formData.append('files', f));
        try {
            const res = await fetch('/api/documents/upload', { method: 'POST', body: formData });
            if (!res.ok) throw new Error('Upload failed');
            toast.success(`${acceptedFiles.length} file(s) uploaded`);
            fetchData();
        } catch { toast.error('Upload failed'); }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, maxFiles: 10, maxSize: 50 * 1024 * 1024 });

    const handleDelete = async (id: number) => { await apiDelete(`/documents/${id}`); toast.success('Deleted'); fetchData(); };

    return (
        <div className="page-container animate-fade-in">
            <div className="page-header">
                <h1 className="page-title flex items-center gap-2"><FileText size={24} className="text-primary" /> {label('Documents Hub', 'दस्तावेज़ हब')}</h1>
            </div>

            {/* Dropzone */}
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors mb-6 ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'}`}
            >
                <input {...getInputProps()} />
                <Cloud size={32} className="mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{isDragActive ? label('Drop here...', 'यहाँ छोड़ें...') : label('Drag & drop files, or click to browse', 'फ़ाइलें खींचें और छोड़ें, या ब्राउज़ करें')}</p>
                <p className="text-xs text-muted-foreground mt-1">Max 50MB per file</p>
            </div>

            <div className="space-y-2">
                {docs.map(doc => (
                    <Card key={doc.id}>
                        <CardContent className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-3">
                                <FileText size={18} className="text-muted-foreground" />
                                <div>
                                    <p className="font-medium text-sm">{doc.original_name}</p>
                                    <p className="text-xs text-muted-foreground">{(doc.size_bytes / 1024).toFixed(1)} KB · {new Date(doc.created_at).toLocaleDateString()}</p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" onClick={() => window.open(`/api/documents/${doc.id}/download`)}><Download size={14} /></Button>
                                <Button variant="ghost" size="sm" onClick={() => handleDelete(doc.id)}><Trash2 size={14} /></Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
                {docs.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">{label('No documents uploaded yet', 'कोई दस्तावेज़ नहीं')}</p>}
            </div>
        </div>
    );
}
