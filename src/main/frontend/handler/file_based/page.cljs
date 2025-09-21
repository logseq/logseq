(ns ^:no-doc frontend.handler.file-based.page
  (:require [clojure.string :as string]
            [frontend.config :as config]
            [frontend.date :as date]
            [frontend.db.file-based.model :as file-model]
            [frontend.handler.common.page :as page-common-handler]
            [frontend.mobile.util :as mobile-util]
            [frontend.state :as state]
            [frontend.util :as util]
            [logseq.common.util :as common-util]
            [logseq.common.util.page-ref :as page-ref]))

;; FIXME: add whiteboard
(defn- get-directory
  [journal?]
  (if journal?
    (config/get-journals-directory)
    (config/get-pages-directory)))

(defn- get-file-name
  [journal? title]
  (when-let [s (if journal?
                 (date/journal-title->default title)
                 ;; legacy in org-mode format, don't escape slashes except bug reported
                 (common-util/page-name-sanity (string/lower-case title)))]
    ;; Win10 file path has a length limit of 260 chars
    (common-util/safe-subs s 0 200)))

(defn get-page-ref-text
  [page]
  (let [edit-block-file-path (file-model/get-block-file-path (state/get-edit-block))
        page-name (string/lower-case page)]
    (if (and edit-block-file-path
             (state/org-mode-file-link? (state/get-current-repo)))
      (if-let [ref-file-path (:file/path (file-model/get-page-file page-name))]
        (util/format "[[file:%s][%s]]"
                     (util/get-relative-path edit-block-file-path ref-file-path)
                     page)
        (let [journal? (date/valid-journal-title? page)
              ref-file-path (str
                             (if (or (util/electron?) (mobile-util/native-platform?))
                               (-> (config/get-repo-dir (state/get-current-repo))
                                   js/decodeURI
                                   (string/replace #"/+$" "")
                                   (str "/"))
                               "")
                             (get-directory journal?)
                             "/"
                             (get-file-name journal? page)
                             ".org")]
          (page-common-handler/<create! page {:redirect? false})
          (util/format "[[file:%s][%s]]"
                       (util/get-relative-path edit-block-file-path ref-file-path)
                       page)))
      (page-ref/->page-ref page))))