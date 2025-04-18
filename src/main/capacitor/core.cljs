(ns capacitor.core
  (:require ["react-dom/client" :as rdc]
            [capacitor.app :as app]
            [capacitor.handler :as handler]))

(defonce ^js root (rdc/createRoot (.getElementById js/document "root")))

(defn ^:export start!
  []
  (.render root (app/main)))

(defn ^:export init []
  ;; init is called ONCE when the page loads
  ;; this is called in the index.html and must be exported
  ;; so it is available even in :advanced release builds
  (prn "[capacitor-new] init!")
  (handler/start! start!))

(defn ^:export stop! []
  ;; stop is called before any code is reloaded
  ;; this is controlled by :before-load in the config
  (prn "[capacitor-new] stop!")
  )
