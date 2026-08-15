(ns logseq.e2e.chat-local-sync-test
  (:require [clojure.test :refer [deftest is testing use-fixtures]]
            [jsonista.core :as json]
            [logseq.e2e.block :as block]
            [logseq.e2e.fixtures :as fixtures]
            [logseq.e2e.graph :as graph]
            [logseq.e2e.rtc :as rtc]
            [logseq.e2e.settings :as settings]
            [logseq.e2e.util :as util]
            [wally.main :as w]))

(use-fixtures :once fixtures/open-page)

(def ^:private default-server-url "http://127.0.0.1:8787")

(defn- env
  [name default-value]
  (let [value (System/getenv name)]
    (if (seq value) value default-value)))

(defn- unique-value
  [prefix]
  (str prefix "-" (.toEpochMilli (java.time.Instant/now))))

(defn- configure-local-sync-server!
  [server-url]
  (w/eval-js
   "url => localStorage.setItem('sync-server-url', url)"
   server-url)
  (settings/refresh-test-env!))

(defn- fetch-json!
  ([server-url path]
   (fetch-json! server-url "GET" path nil))
  ([server-url method path body]
   (w/eval-js
    "async encoded => {
       const request = JSON.parse(encoded);
       const token = localStorage.getItem('access-token');
       if (!token) throw new Error('Logseq E2E access token is missing');
       const response = await fetch(request.serverUrl + request.path, {
         method: request.method,
         headers: {
           authorization: `Bearer ${token}`,
           ...(request.body ? {'content-type': 'application/json'} : {})
         },
         body: request.body ? JSON.stringify(request.body) : undefined
       });
       const text = await response.text();
       if (!response.ok) {
         throw new Error(`${request.method} ${request.path} failed with HTTP ${response.status}: ${text}`);
       }
       return text ? JSON.parse(text) : null;
     }"
    (json/write-value-as-string
     {:serverUrl server-url
      :method method
      :path path
      :body body}))))

(defn- graph-by-name!
  [server-url graph-name]
  (let [response (fetch-json! server-url "/api/v1/graphs")]
    (or (some #(when (= graph-name (get % "graph-name")) %) (get response "graphs"))
        (throw (ex-info "New graph is missing from the semantic graph list"
                        {:graph-name graph-name
                         :response response})))))

(deftest local-server-graph-is-ready-for-logseq-chat-test
  (let [server-url (env "LOGSEQ_CHAT_E2E_SERVER_URL" default-server-url)
        graph-name (env "LOGSEQ_CHAT_E2E_GRAPH_NAME" (unique-value "chat-local-e2e"))
        desktop-block (env "LOGSEQ_CHAT_E2E_DESKTOP_BLOCK" (unique-value "Desktop block"))
        server-block (env "LOGSEQ_CHAT_E2E_SERVER_BLOCK" (unique-value "Server block"))]
    (testing "a new unencrypted graph is fully initialized on the local server"
      (configure-local-sync-server! server-url)
      (util/login-test-account)
      (graph/new-graph graph-name true false)
      (let [remote-graph (graph-by-name! server-url graph-name)]
        (is (false? (get remote-graph "graph-e2ee?")))
        (is (true? (get remote-graph "graph-ready-for-use?")))
        (is (seq (get remote-graph "schema-version")))))

    (testing "a Logseq block advances the authoritative server transaction"
      (let [{:keys [local-tx remote-tx]}
            (rtc/with-wait-tx-updated
              (block/new-block desktop-block))]
        (is (pos-int? remote-tx))
        (is (= local-tx remote-tx))))

    (testing "a semantic REST capture is applied back to Logseq"
      (let [remote-graph (graph-by-name! server-url graph-name)
            graph-id (get remote-graph "graph-id")
            capture (fetch-json!
                     server-url
                     "POST"
                     (str "/api/v1/graphs/" graph-id "/capture")
                     {:blocks [{:uuid (str (random-uuid))
                                :title server-block}]})]
        (is (= server-block (-> capture (get "blocks") first (get "title"))))
        (w/wait-for (format ".ls-block :text('%s')" server-block) {:timeout 30000})
        (println "LOGSEQ_CHAT_E2E_GRAPH_NAME=" graph-name)
        (println "LOGSEQ_CHAT_E2E_GRAPH_ID=" graph-id)
        (println "LOGSEQ_CHAT_E2E_DESKTOP_BLOCK=" desktop-block)
        (println "LOGSEQ_CHAT_E2E_SERVER_BLOCK=" server-block)))))
