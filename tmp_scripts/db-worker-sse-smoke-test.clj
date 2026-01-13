#!/usr/bin/env bb
(require '[babashka.process :as process]
         '[clojure.java.io :as io]
         '[clojure.string :as string])

(def base-url (or (System/getenv "DB_WORKER_URL")
                  "http://127.0.0.1:9101"))
(def auth-token (System/getenv "DB_WORKER_AUTH_TOKEN"))
(def events-url (str (string/replace base-url #"/$" "") "/v1/events"))

(defn- open-sse-connection
  [url token]
  (let [^java.net.HttpURLConnection conn (.openConnection (java.net.URL. url))]
    (.setRequestMethod conn "GET")
    (.setRequestProperty conn "Accept" "text/event-stream")
    (when (seq token)
      (.setRequestProperty conn "Authorization" (str "Bearer " token)))
    (.setDoInput conn true)
    (.connect conn)
    conn))

(defn- wait-for-sse!
  [^java.net.HttpURLConnection conn timeout-ms]
  (let [event-seen (promise)
        reader (future
                 (try
                   (with-open [rdr (io/reader (.getInputStream conn))]
                     (doseq [line (line-seq rdr)]
                       (when (string/starts-with? line "data:")
                         (deliver event-seen line)
                         (reduced nil))))
                   (catch Exception _ nil)))]
    (try
      (let [result (deref event-seen timeout-ms ::timeout)]
        (when (= result ::timeout)
          (throw (ex-info "No SSE events captured" {:url events-url})))
        result)
      (finally
        (.disconnect conn)
        (future-cancel reader)))))

(defn- run-smoke-test!
  []
  (let [{:keys [exit]} (process/shell {:inherit true}
                                      "bb" "tmp_scripts/db-worker-smoke-test.clj")]
    (when-not (zero? exit)
      (throw (ex-info "Smoke test failed" {:exit exit})))))

(comment
  (let [conn (open-sse-connection events-url auth-token)]
    (run-smoke-test!)
    (wait-for-sse! conn 2000)
    (println "SSE smoke test OK")))
