(ns frontend.worker.handler.page
  "Page operations"
  (:require [logseq.outliner.page :as outliner-page]))

(defn create!
  "Create page. Has the following options:

   * :uuid                     - when set, use this uuid instead of generating a new one.
   * :class?                   - when true, adds a :block/tags ':logseq.class/Tag'
   * :tags                     - tag uuids that are added to :block/tags
   * :persist-op?              - when true, add an update-page op
   * :properties               - properties to add to the page
  TODO: Add other options"
  [conn title & {:as options}]
  (outliner-page/create! conn title options))

(defn delete!
  "Deletes a page. Returns true if able to delete page. If unable to delete,
  calls error-handler fn and returns false"
  [conn page-uuid & {:as options}]
  (outliner-page/delete! conn page-uuid options))
