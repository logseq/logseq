(ns server.main
  (:require ["express" :as express]
            [server.router :refer [router]]
            ["cors" :as cors]
            ["cookie-parser" :as cookie-parser]))

(defonce server (atom nil))

(defonce config
  {:allowed-origins #{"http://localhost:8080" "https://logseq.now.sh"}})

(def cors-options
  {:origin (fn [origin callback]
             (callback nil true)
             ;; (prn {:origin origin})
             ;; (if (contains? (:allowed-origins config) origin)
             ;;   (callback nil true)
             ;;   (callback (js/Error. "Origin not allowed")))
             )})

(defn start-server []
  (println "Starting server")
  (let [app (express)]
    (.use app (cors (clj->js cors-options)))
    (.use app (cookie-parser js/process.env.COOKIE_SECRET))
    (.use app "/api" router)
    (.listen app 3000 (fn [] (println "Example app listening on port 3000!")))))

(defn start! []
  ;; called by main and after reloading code
  (reset! server (start-server)))

(defn stop! []
  ;; called before reloading code
  (.close @server)
  (reset! server nil))

(defn -main []
  ;; executed once, on startup, can do one time setup here
  (start!))
