/**
 * React hooks for attachments
 * Import from '@vorklee2/core-attachments/hooks' or '@vorklee2/core-attachments/dist/hooks'
 * These are optional helpers for React/Next.js apps
 */

import { useState, useEffect } from 'react';
import type {
  FileAttachment,
  LinkAttachment,
  CreateFileAttachmentInput,
  CreateLinkAttachmentInput,
} from './types';

/**
 * Hook for managing file attachments
 */
export function useFileAttachments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = async (
    file: File,
    input: Omit<CreateFileAttachmentInput, 'fileName' | 'fileType' | 'fileSize' | 'fileUrl'>,
    uploadFn: (file: File) => Promise<string>
  ): Promise<FileAttachment | null> => {
    setLoading(true);
    setError(null);

    try {
      // Upload file to storage
      const fileUrl = await uploadFn(file);

      // Create attachment record
      const response = await fetch('/api/attachments/files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...input,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          fileUrl,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create attachment');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { uploadFile, loading, error };
}

/**
 * Hook for managing link attachments
 */
export function useLinkAttachments() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createLink = async (
    input: CreateLinkAttachmentInput
  ): Promise<LinkAttachment | null> => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/attachments/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        throw new Error('Failed to create link attachment');
      }

      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create link');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createLink, loading, error };
}

/**
 * Hook for fetching attachments
 */
export function useAttachments(entityType: string, entityId: string) {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [links, setLinks] = useState<LinkAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAttachments = async () => {
    setLoading(true);
    setError(null);

    try {
      const [filesRes, linksRes] = await Promise.all([
        fetch(`/api/attachments/files?entityType=${entityType}&entityId=${entityId}`),
        fetch(`/api/attachments/links?entityType=${entityType}&entityId=${entityId}`),
      ]);

      if (!filesRes.ok || !linksRes.ok) {
        throw new Error('Failed to fetch attachments');
      }

      const filesData = await filesRes.json();
      const linksData = await linksRes.json();

      setFiles(filesData.data || filesData);
      setLinks(linksData.data || linksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch attachments');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (entityId) {
      fetchAttachments();
    }
  }, [entityId, entityType]);

  return { files, links, loading, error, fetchAttachments };
}
