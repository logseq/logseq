(ns electron.server
  (:require ["fastify" :as Fastify]
            ["electron" :refer [ipcMain]]
            [clojure.string :as string]
            [promesa.core :as p]
            [electron.utils :as utils]
            [electron.logger :as logger]))

(defonce ^:private *win (atom nil))
(defonce ^:private *server (atom nil))

(defonce HOST "0.0.0.0")
(defonce PORT 3333)

(defn type-proxy-api? [s]
  (when (string? s)
    (string/starts-with? s "logseq.")))

(defn type-normal-api? [s]
  (not (type-proxy-api? s)))

(defonce ^:private *cid (volatile! 0))
(defn- invoke-logseq-api!
  [method args]
  (p/create
   (fn [resolve _reject]
     (let [sid        (vswap! *cid inc)
           ret-handle (fn [^js _w ret] (resolve ret))]
       (utils/send-to-renderer @*win :invokeLogseqAPI {:syncId sid :method method :args args})
       (.handleOnce ipcMain (str ::sync! sid) ret-handle)))))

(defn api-invoker-fn!
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
                      (.post "/api-invoker" api-invoker-fn!))
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