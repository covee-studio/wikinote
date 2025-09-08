import { useEffect, useState, useCallback } from 'react';
import { AlertCircle, X, RefreshCw } from 'lucide-react';
import { useI18n } from '../hooks/useI18n';
import type { AppError } from '../types/ArticleProps';

interface ErrorNotificationProps {
  error: AppError | null;
  onClose: () => void;
  autoClose?: boolean;
  duration?: number;
}

export function ErrorNotification({ 
  error, 
  onClose, 
  autoClose = true, 
  duration = 5000 
}: ErrorNotificationProps) {
  const { t } = useI18n();
  const [isVisible, setIsVisible] = useState(false);
  
  const handleClose = useCallback(() => {
    setIsVisible(false);
    setTimeout(onClose, 300); // Wait for animation
  }, [onClose]);

  useEffect(() => {
    if (error) {
      setIsVisible(true);
      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);
        return () => clearTimeout(timer);
      }
    }
  }, [error, autoClose, duration, handleClose]);

  if (!error) return null;

  return (
    <div className={`fixed top-4 right-4 z-50 transition-all duration-300 ${
      isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
    }`}>
      <div className="bg-white rounded-lg shadow-lg border border-red-200 p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 text-red-500 mt-0.5">
            <AlertCircle className="w-full h-full" />
          </div>
          
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-gray-900 text-sm">
              {error.title}
            </h4>
            <p className="text-gray-600 text-sm mt-1">
              {error.message}
            </p>
            
            {error.action && (
              <button
                onClick={error.action.handler}
                className="mt-3 flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium"
              >
                <RefreshCw className="w-3 h-3" />
                {error.action.label}
              </button>
            )}
          </div>
          
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-1"
            aria-label={t('common.close')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}