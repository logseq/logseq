(ns logseq.cli.e2e.shell
  (:require [babashka.process :as process])
  (:import [java.io ByteArrayOutputStream OutputStream]))

(defn- utf8-string
  [^ByteArrayOutputStream payload]
  (.toString payload "UTF-8"))

(defn- capture-stream
  [target stream-output?]
  (let [payload (ByteArrayOutputStream.)]
    {:payload payload
     :stream (if stream-output?
               (proxy [OutputStream] []
                 (write
                   ([byte]
                    (.write payload byte)
                    (.write target byte)
                    (.flush target))
                   ([bytes offset length]
                    (.write payload bytes offset length)
                    (.write target bytes offset length)
                    (.flush target)))
                 (flush []
                   (.flush target))
                 (close []
                   (.flush target)))
               payload)}))

(defn- default-executor
  [cmd {:keys [dir extra-env in stream-output?]}]
  (let [{out-payload :payload
         out-stream :stream} (capture-stream System/out stream-output?)
        {err-payload :payload
         err-stream :stream} (capture-stream System/err stream-output?)
        result @(process/process {:continue true
                                  :dir dir
                                  :extra-env extra-env
                                  :in in
                                  :out out-stream
                                  :err err-stream}
                                 "/bin/bash"
                                 "-lc"
                                 cmd)]
    {:exit (:exit result 0)
     :out (utf8-string out-payload)
     :err (utf8-string err-payload)}))

(defn run!
  [{:keys [cmd dir env stdin executor throw? stream-output?]
    :or {throw? true}}]
  (let [runner (or executor default-executor)
        result (runner cmd {:dir dir
                            :extra-env env
                            :in stdin
                            :stream-output? stream-output?})
        exit (:exit result 0)
        payload {:cmd cmd
                 :dir dir
                 :exit exit
                 :out (:out result "")
                 :err (:err result "")}]
    (when (and throw?
               (not (zero? exit)))
      (throw (ex-info "Shell command failed"
                      payload)))
    payload))
