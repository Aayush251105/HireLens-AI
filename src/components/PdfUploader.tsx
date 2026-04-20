import { useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

interface PdfUploaderProps {
  onTextExtracted: (text: string) => void;
}

type UploadState = 'idle' | 'dragging' | 'parsing' | 'success' | 'error';

async function extractTextFromPdf(file: File): Promise<string> {
  const { getDocument, GlobalWorkerOptions } = await import('pdfjs-dist');

  // Use the unpkg CDN worker matching the installed pdfjs-dist version
  GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.6.205/build/pdf.worker.min.mjs`;

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await getDocument({ data: arrayBuffer }).promise;

  const textParts: string[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items
      .map((item) => ('str' in item ? item.str : ''))
      .join(' ');
    textParts.push(pageText);
  }

  return textParts.join('\n').replace(/\s{3,}/g, '\n').trim();
}

export default function PdfUploader({ onTextExtracted }: PdfUploaderProps) {
  const [state, setState] = useState<UploadState>('idle');
  const [fileName, setFileName] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (file.type !== 'application/pdf') {
      setState('error');
      setErrorMsg('Only PDF files are supported.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setState('error');
      setErrorMsg('File is too large. Max size is 10MB.');
      return;
    }

    setFileName(file.name);
    setState('parsing');
    setErrorMsg(null);

    try {
      const text = await extractTextFromPdf(file);
      if (!text || text.length < 50) {
        throw new Error('Could not extract readable text from this PDF. Try pasting your resume manually.');
      }
      onTextExtracted(text);
      setState('success');
    } catch (err) {
      setState('error');
      setErrorMsg(err instanceof Error ? err.message : 'Failed to parse PDF.');
    }
  }, [onTextExtracted]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setState('idle');
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setState('dragging');
  };

  const handleDragLeave = () => {
    setState((s) => (s === 'dragging' ? 'idle' : s));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so same file can be re-uploaded
    e.target.value = '';
  };

  const handleClear = () => {
    setState('idle');
    setFileName(null);
    setErrorMsg(null);
    onTextExtracted('');
  };

  const isDragging = state === 'dragging';
  const isParsing = state === 'parsing';
  const isSuccess = state === 'success';
  const isError = state === 'error';

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        className="hidden"
        onChange={handleInputChange}
      />

      <AnimatePresence mode="wait">
        {isSuccess ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.97 }}
            className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-green-500/40 bg-green-500/10"
          >
            <div className="flex items-center gap-3 min-w-0">
              <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              <div className="min-w-0">
                <p className="text-sm font-medium text-green-400 truncate">{fileName}</p>
                <p className="text-xs text-muted-foreground">Text extracted successfully</p>
              </div>
            </div>
            <button
              onClick={handleClear}
              className="p-1 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors shrink-0"
              title="Remove file"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="dropzone"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isParsing && inputRef.current?.click()}
            className={`
              relative flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-xl border-2 border-dashed cursor-pointer transition-all duration-200
              ${isDragging ? 'border-primary bg-primary/10 scale-[1.01]' : ''}
              ${isParsing ? 'border-primary/40 bg-primary/5 cursor-wait' : ''}
              ${isError ? 'border-red-500/40 bg-red-500/5' : ''}
              ${!isDragging && !isParsing && !isError ? 'border-border hover:border-primary/50 hover:bg-primary/5' : ''}
            `}
          >
            {isParsing ? (
              <>
                <Loader2 className="w-6 h-6 text-primary animate-spin" />
                <p className="text-sm text-muted-foreground">Extracting text from PDF...</p>
              </>
            ) : isError ? (
              <>
                <AlertCircle className="w-6 h-6 text-red-400" />
                <p className="text-sm text-red-400 text-center">{errorMsg}</p>
                <p className="text-xs text-muted-foreground">Click to try again</p>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    {isDragging ? (
                      <FileText className="w-5 h-5 text-primary" />
                    ) : (
                      <Upload className="w-5 h-5 text-primary" />
                    )}
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-foreground">
                    {isDragging ? 'Drop your PDF here' : 'Upload PDF Resume'}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Drag & drop or click to browse · Max 10MB
                  </p>
                </div>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
