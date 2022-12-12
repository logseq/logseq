(ns electron.server
  (:require ["fastify" :as Fastify]
            ["electron" :refer [ipcMain]]
            [clojure.string :as string]
            [promesa.core :as p]
            [electron.utils :as utils]
            [camel-snake-kebab.core :as csk]
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

(defn resolve-real-api-method
  [s]
  (when-not (string/blank? s)
    (if (type-proxy-api? s)
      (let [s'   (string/split s ".")
            tag  (second s')
            tag' (when (and (not (string/blank? tag))
                            (contains? #{"ui" "git" "assets"} (string/lower-case tag)))
                   (str tag "_"))]
        (csk/->snake_case (str tag' (last s'))))
      (string/trim s))))

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
  (if-let [^js body (.-body req)]
    (if-let [method (resolve-real-api-method (.-method body))]
      (-> (invoke-logseq-api! method (.-args body))
          (p/then #(.send rep %))
          (p/catch #(.send rep %)))
      (-> rep
          (.code 400)
          (.send (js/Error. ":method of body is missing!"))))
    (throw (js/Error. "Body{:method :args} is required!"))))

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