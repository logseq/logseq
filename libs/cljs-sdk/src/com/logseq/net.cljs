;; Auto-generated via `bb libs:generate-cljs-sdk`
(ns com.logseq.net
  (:refer-clojure :exclude [get])
  (:require [com.logseq.core :as core]))

(def api-proxy (aget js/logseq "Net"))

(defn request
  [options]
  (let [method (aget api-proxy "request")
        args [options]]
    (core/call-method api-proxy method args)))

(defn- get-impl
  [url options]
  (let [method (aget api-proxy "get")
        args [url options]]
    (core/call-method api-proxy method args)))

(defn get
  ([url]
   (get-impl url nil))
  ([url options]
   (get-impl url options)))

(defn- head-impl
  [url options]
  (let [method (aget api-proxy "head")
        args [url options]]
    (core/call-method api-proxy method args)))

(defn head
  ([url]
   (head-impl url nil))
  ([url options]
   (head-impl url options)))

(defn- post-impl
  [url body options]
  (let [method (aget api-proxy "post")
        args [url body options]]
    (core/call-method api-proxy method args)))

(defn post
  ([url]
   (post-impl url nil nil))
  ([url body]
   (post-impl url body nil))
  ([url body options]
   (post-impl url body options)))

(defn- put-impl
  [url body options]
  (let [method (aget api-proxy "put")
        args [url body options]]
    (core/call-method api-proxy method args)))

(defn put
  ([url]
   (put-impl url nil nil))
  ([url body]
   (put-impl url body nil))
  ([url body options]
   (put-impl url body options)))

(defn- patch-impl
  [url body options]
  (let [method (aget api-proxy "patch")
        args [url body options]]
    (core/call-method api-proxy method args)))

(defn patch
  ([url]
   (patch-impl url nil nil))
  ([url body]
   (patch-impl url body nil))
  ([url body options]
   (patch-impl url body options)))

(defn- delete-impl
  [url options]
  (let [method (aget api-proxy "delete")
        args [url options]]
    (core/call-method api-proxy method args)))

(defn delete
  ([url]
   (delete-impl url nil))
  ([url options]
   (delete-impl url options)))
