import { useState } from 'react';
import { DeletePostDialog, EditCaptionDialog, ReportPostDialog } from '../components/PostDialogs';
import type { Post } from '../lib/api';

/** Owner actions (edit caption, delete) and the report flow, shared by the feed, profiles and the comments page. */
export function usePostActions(onMessage: (m: string) => void) {
  const [deleting, setDeleting] = useState<Post | null>(null);
  const [editing, setEditing] = useState<Post | null>(null);
  const [reporting, setReporting] = useState<Post | null>(null);
  return {
    askEdit: setEditing,
    askDelete: setDeleting,
    askReport: setReporting,
    dialogs: (
      <>
        <DeletePostDialog post={deleting} onClose={() => setDeleting(null)} onMessage={onMessage} />
        <EditCaptionDialog post={editing} onClose={() => setEditing(null)} />
        <ReportPostDialog post={reporting} onClose={() => setReporting(null)} onMessage={onMessage} />
      </>
    ),
  };
}
