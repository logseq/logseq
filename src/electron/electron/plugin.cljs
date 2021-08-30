(ns electron.plugin
  (:require [promesa.core :as p]
            [cljs-bean.core :as bean]
            [electron.utils :refer [*win]]))

(def *installing (atom nil))
(def emit (fn [type payload]
            (.. ^js @*win -webContents
                (send (name type) (bean/->js payload)))))

(defn install!
  [item]
  (when-let [repo (and (not @*installing) (:repo item))]
    (js/console.debug "Installing:" repo)
    (-> (p/create
          (fn [resolve]
            (reset! *installing item)
            (js/setTimeout (fn []
                             (emit :lsp-installed
                                   {:status :completed
                                    :payload repo})

                             (resolve)) 3000)))
        (p/finally #(reset! *installing nil)))))
