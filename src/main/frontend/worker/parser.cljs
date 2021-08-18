(ns frontend.worker.parser
  (:require ["mldoc" :refer [Mldoc]]
            ["threads/worker" :refer [expose]]))

(def parse-json (.-parseJson Mldoc))

(expose (clj->js {:parse parse-json}))

(defn init
  []
  (println "Parser worker initialized!")
  (js/self.addEventListener "message"
                            (fn [^js e]
                              (js/postMessage (.. e -data)))))
