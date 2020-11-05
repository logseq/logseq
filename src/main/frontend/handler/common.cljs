(ns frontend.handler.common
  (:require [goog.object :as gobj]
            [frontend.state :as state]
            [cljs-bean.core :as bean]
            [promesa.core :as p]
            [frontend.util :as util]
            [frontend.text :as text]))

(defn check-changed-files-status
  []
  (when-let [repo (state/get-current-repo)]
    (when (and
           (gobj/get js/window "workerThread")
           (gobj/get js/window.workerThread "getChangedFiles"))
      (->
       (p/let [files (js/window.workerThread.getChangedFiles (util/get-repo-dir repo))]
         (let [files (bean/->clj files)]
           (state/set-changed-files! repo files)))
       (p/catch (fn [error]
                  (js/console.dir error)))))))

(defn copy-to-clipboard-without-id-property!
  [content]
  (util/copy-to-clipboard! (text/remove-id-property content)))
