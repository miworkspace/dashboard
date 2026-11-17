import React, { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { useToast } from '../../lib/toastContext';

export function CopyButton({ text, label, className = '' }) {
  const [copied, setCopied] = useState(false);
  const toast = useToast();

  const handleCopy = (e) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopied(true);
    toast.info(`Copied "${text}" to clipboard`);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      title={label ? `Copy ${label}` : `Copy ${text}`}
      className={`inline-flex items-center gap-1 text-slate-400 hover:text-slate-700 p-1 rounded-md hover:bg-slate-100 transition-colors cursor-pointer ${className}`}
      aria-label="Copy to clipboard"
    >
      {copied ? (
        <Check className="w-3.5 h-3.5 text-emerald-600" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
    </button>
  );
}
