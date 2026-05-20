'use client'

import type { DocumentViewerProps } from './types'
import { useDocumentViewer } from './use-document-viewer'
import { DocumentEditMode } from './document-edit-mode'
import { DocumentViewMode } from './document-view-mode'

export function DocumentViewer(props: DocumentViewerProps) {
  const {
    doc,
    isEditing, setIsEditing,
    editTitle, setEditTitle,
    editContent, setEditContent,
    editCategoryId, setEditCategoryId,
    showDeleteDialog, setShowDeleteDialog,
    isAnalyzing, analysis, isSaving,
    relatedDocs, isRelatedLoading, relatedFetched,
    handleStar, handleDelete, handleSave,
    handleAnalyze, handleApplyAnalysis,
    fetchRelatedDocuments, handleRelatedClick,
    cancelEdit,
    setView, selectDocument, setSelectedCategory,
  } = useDocumentViewer(props)

  if (isEditing) {
    return (
      <DocumentEditMode
        editTitle={editTitle}
        setEditTitle={setEditTitle}
        editContent={editContent}
        setEditContent={setEditContent}
        editCategoryId={editCategoryId}
        setEditCategoryId={setEditCategoryId}
        categories={props.categories}
        isSaving={isSaving}
        onSave={handleSave}
        onCancel={cancelEdit}
      />
    )
  }

  return (
    <DocumentViewMode
      doc={doc}
      isAnalyzing={isAnalyzing}
      analysis={analysis}
      isSaving={isSaving}
      relatedDocs={relatedDocs}
      isRelatedLoading={isRelatedLoading}
      relatedFetched={relatedFetched}
      showDeleteDialog={showDeleteDialog}
      setShowDeleteDialog={setShowDeleteDialog}
      onStar={handleStar}
      onDelete={handleDelete}
      onAnalyze={handleAnalyze}
      onApplyAnalysis={handleApplyAnalysis}
      onFetchRelated={fetchRelatedDocuments}
      onRelatedClick={handleRelatedClick}
      onEdit={() => setIsEditing(true)}
      setView={setView}
      selectDocument={selectDocument}
      setSelectedCategory={setSelectedCategory}
    />
  )
}
