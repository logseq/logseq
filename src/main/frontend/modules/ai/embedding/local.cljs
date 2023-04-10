(ns frontend.modules.ai.embedding.local
  (:require [frontend.util :as util]
            [cljs-bean.core :as bean]
            [promesa.core :as p]))

;; TODO: only for playground, this should be supported by plugins
(defn sentence-transformer
  [texts]
  (util/fetch "http://127.0.0.1:8000/embedding/"
             {:method "POST"
              :headers {:Content-Type "application/json"}
              :body (js/JSON.stringify
                     (bean/->js {:texts texts}))}
             (fn [result]
               (p/resolved result))
             (fn [failed-resp]
               (prn "sentence-transformer embedding failed: " failed-resp)
               (p/rejected failed-resp))))
