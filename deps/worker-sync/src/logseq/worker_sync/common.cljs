(ns logseq.worker-sync.common
  (:require [clojure.string :as string]
            [logseq.db.sqlite.util :as sqlite-util])
  (:require-macros [logseq.worker-sync.async :refer [js-await]]))

(def text-decoder (js/TextDecoder.))

(defn- cors-headers []
  #js {"access-control-allow-origin" "*"
       "access-control-allow-headers" "content-type"
       "access-control-allow-methods" "GET,POST,DELETE,OPTIONS"})

(defn json-response
  ([data] (json-response data 200))
  ([data status]
   (js/Response.
    (js/JSON.stringify (clj->js data))
    #js {:status status
         :headers (js/Object.assign
                   #js {"content-type" "application/json"}
                   (cors-headers))})))

(defn options-response []
  (js/Response. nil #js {:status 204 :headers (cors-headers)}))

(defn bad-request [message]
  (json-response {:error message} 400))

(defn not-found []
  (json-response {:error "not found"} 404))

(defn get-sql-rows [^js result]
  (let [iter-fn (when result (aget result js/Symbol.iterator))]
    (cond
      (nil? result) []
      (fn? (.-toArray result)) (.toArray result)
      (fn? iter-fn) (vec (js/Array.from result))
      (array? (.-results result)) (.-results result)
      (array? (.-rows result)) (.-rows result)
      (array? result) (if (empty? result)
                        []
                        (let [first-row (first result)]
                          (cond
                            (array? (.-results first-row)) (.-results first-row)
                            (array? (.-rows first-row)) (.-rows first-row)
                            :else result)))
      :else [])))

(defn sql-exec
  [sql sql-str & args]
  (.apply (.-exec sql) sql (to-array (cons sql-str args))))

(defn read-json [request]
  (js-await [body (.text request)]
            (when (seq body)
              (js/JSON.parse body))))

(defn read-transit [value]
  (when (string? value)
    (sqlite-util/read-transit-str value)))

(defn write-transit [value]
  (sqlite-util/write-transit-str value))

(defn now-ms []
  (.now js/Date))

(defn upgrade-request? [request]
  (= "websocket"
     (string/lower-case (or (.get (.-headers request) "upgrade") ""))))
