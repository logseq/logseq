(ns logseq.sdk.assets
  (:require [cljs-bean.core :as bean]
            [electron.ipc :as ipc]
            [frontend.extensions.pdf.assets :as pdf-assets]
            [frontend.handler.assets :as assets-handler]
            [frontend.state :as state]
            [frontend.util :as util]
            [promesa.core :as p]))

(def ^:export make_url assets-handler/make-asset-url)

(defn ^:export list_files_of_current_graph
  [^js exts]
  (p/let [files (ipc/ipc :getAssetsFiles {:exts exts})]
    (bean/->js files)))

(defn ^:export built_in_open
  [asset-file]
  (when-let [ext (util/trim-safe (util/get-file-ext asset-file))]
    (cond
      (contains? #{"pdf"} ext)
      (state/set-current-pdf! (pdf-assets/inflate-asset asset-file))

      :else false)))
