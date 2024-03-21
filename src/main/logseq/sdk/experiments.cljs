(ns logseq.sdk.experiments
  (:require [frontend.state :as state]
            [cljs-bean.core :as bean]
            [frontend.components.page :as page]))

(defn ^:export cp_page_editor
  [^js props]
  (let [p (some-> props (aget "page"))]
    (when-let [e (page/get-page-entity p)]
      (page/page-blocks-cp (state/get-current-repo) e {}))))