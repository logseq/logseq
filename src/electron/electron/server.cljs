(ns electron.server
  (:require ["fastify" :as Fastify]
            [clojure.string :as string]
            [promesa.core :as p]
            [electron.logger :as logger]))

(defonce ^:private *win (atom nil))
(defonce ^:private *server (atom nil))

(defonce HOST "0.0.0.0")
(defonce PORT 3333)

(defn type-api? [s]
  (when (string? s)
    (string/starts-with? s "logseq.")))

(defn api-invoker-fn
  [^js req ^js rep]
  (.send rep #js {:method (.-method req)
                  :msg    "Hello ❤️ Logseq!"
                  :body   (.-body req)}))

(defn close!
  []
  (when @*server
    (logger/debug "[server] closing ...")
    (-> (.close @*server)
        (p/then #(reset! *server nil)))))

(defn start!
  []
  (-> (p/let [_     (close!)
              ^js s (Fastify. #js {:logger true})
              ;; routes
              _     (doto s
                      (.post "/api-invoker" api-invoker-fn))
              ;; listen port
              _     (.listen s #js {:host HOST :port PORT})]
        (reset! *server s))
      (p/then #(logger/debug "[server] start successfully! :" PORT))
      (p/catch #(logger/error "[server] start error #" %))))

(defn setup!
  [^js win]
  (reset! *win win)
  (start!)
  #())