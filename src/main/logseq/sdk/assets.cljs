(ns logseq.sdk.assets
  (:require [electron.ipc :as ipc]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.handler.editor :as editor-handler]))

(def ^:export make_url editor-handler/make-asset-url)

(defn ^:export list_files_of_current_graph
  [^js exts]
  (p/let [files (ipc/ipc :getAssetsFiles {:exts exts})]
    (bean/->js files)))

(defn ^:export delete_files_of_current_graph
  [^js files]
  (this-as this1
    (let [files (bean/->clj files)
          pid   (some-> this1 (.-id))]
      (prn "===>>> delete assets #" files)
      (prn "==>>" pid))))
