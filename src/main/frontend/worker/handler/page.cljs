(ns frontend.worker.handler.page
  "Page operations"
  (:require [logseq.outliner.page :as outliner-page]))

(defn create!
  "Creates a page through the outliner page service.

   Supported options:

   * :uuid                    - when set, use this uuid instead of generating a new one; ignored
                                when :journal? or :today-journal? uses a deterministic journal
                                uuid from :block/journal-day.
   * :class?                  - create the page as a Tag class page.
   * :journal?                - create the page as a Journal page.
   * :today-journal?          - mark the create-page tx as today's journal creation.
   * :tags                    - tag uuids or tag entities added to :block/tags.
   * :properties              - properties to add to the page.
   * :split-namespace?        - create namespace parent pages for non-journal slash pages.
   * :class-ident-namespace   - namespace used when creating a class ident.
   * :persist-op?             - when true, persist the create-page outliner op."
  [conn title & {:as options}]
  (outliner-page/create! conn title options))

(defn delete!
  "Deletes a page through the outliner page service.

   Returns true when the page can be deleted. If deletion is rejected, calls
   :error-handler and returns false.

   Supported options:

   * :persist-op?      - when true, persist the delete-page outliner op.
   * :rename?          - mark the tx as part of a rename flow.
   * :error-handler    - callback invoked with {:msg string} on rejection.
   * :deleted-by-uuid  - user uuid recorded in the delete op metadata.
   * :now-ms           - timestamp recorded in the delete op metadata."
  [conn page-uuid & {:as options}]
  (outliner-page/delete! conn page-uuid options))
