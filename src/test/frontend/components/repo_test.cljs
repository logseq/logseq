(ns frontend.components.repo-test
  (:require [cljs.test :refer [deftest is async]]
            [frontend.components.repo :as repo]
            [frontend.components.rtc.indicator :as rtc-indicator]
            [frontend.db :as db]
            [frontend.handler.db-based.sync :as rtc-handler]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.user :as user-handler]
            [frontend.state :as state]
            [frontend.mobile.util :as mobile-util]
            [frontend.util :as util]
            [logseq.db :as ldb]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- ensure-rsa-key-fn
  []
  #'repo/ensure-e2ee-rsa-key-for-cloud!)

(deftest local-uploadable-graph-allows-native-mobile-local-graph-without-root-test
  (with-redefs [mobile-util/native-platform? (constantly true)
                user-handler/logged-in? (constantly true)
                user-handler/rtc-group? (constantly true)]
    (is (true? (repo/local-uploadable-graph? {:url "logseq_db_mobile"})))))

(deftest upload-local-graph-with-confirm-asks-before-upload-test
  (async done
         (let [upload-fn (some-> (resolve 'frontend.components.repo/upload-local-graph-with-confirm!) deref)
               dialogs (atom [])
               upload-calls (atom [])
               finished-calls (atom 0)]
           (if-not upload-fn
             (do
               (is false "missing upload-local-graph-with-confirm!")
               (done))
             (-> (p/with-redefs [shui/dialog-confirm! (fn [content opts]
                                                        (swap! dialogs conj {:content content
                                                                             :opts opts})
                                                        (p/resolved nil))
                                 rtc-handler/<rtc-upload-graph! (fn [repo graph-e2ee?]
                                                                  (swap! upload-calls conj [repo graph-e2ee?])
                                                                  (p/resolved nil))
                                 state/get-current-repo (fn []
                                                          "logseq_db_demo")
                                 rtc-indicator/on-upload-finished-task (fn [f]
                                                                         (swap! finished-calls inc)
                                                                         (f))
                                 util/mobile? (fn [] false)
                                 shui/popup-show! (fn [& _] nil)
                                 shui/popup-hide! (fn [& _] nil)]
                   (upload-fn {:url "logseq_db_demo"
                               :graph-e2ee? true}))
                 (p/then (fn [_]
                           (is (= 1 (count @dialogs)))
                           (is (= [["logseq_db_demo" true]] @upload-calls))
                           (is (= 1 @finished-calls))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))

(deftest upload-local-graph-switches-before-uploading-non-current-graph-test
  (async done
         (let [upload-fn (some-> (resolve 'frontend.components.repo/upload-local-graph-with-confirm!) deref)
               current-repo (atom "logseq_db_current")
               calls (atom [])]
           (if-not upload-fn
             (do
               (is false "missing upload-local-graph-with-confirm!")
               (done))
             (-> (p/with-redefs [shui/dialog-confirm! (fn [_content _opts]
                                                        (p/resolved nil))
                                 state/get-current-repo (fn []
                                                          @current-repo)
                                 state/pub-event! (fn [event]
                                                    (swap! calls conj event)
                                                    (reset! current-repo (second event))
                                                    (p/resolved nil))
                                 db/get-db (fn []
                                             :db-after-switch)
                                 ldb/get-graph-rtc-e2ee? (fn [db]
                                                           (is (= :db-after-switch db))
                                                           false)
                                 rtc-handler/<rtc-upload-graph! (fn [repo graph-e2ee?]
                                                                  (swap! calls conj [:upload repo graph-e2ee?])
                                                                  (p/resolved nil))
                                 rtc-indicator/on-upload-finished-task (fn [f]
                                                                         (f))
                                 util/mobile? (fn [] false)
                                 shui/popup-show! (fn [& _] nil)
                                 shui/popup-hide! (fn [& _] nil)]
                   (upload-fn {:url "logseq_db_other"}))
                 (p/then (fn [_]
                           (is (= [[:graph/switch "logseq_db_other"]
                                   [:upload "logseq_db_other" false]]
                                  @calls))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))

(deftest upload-local-graph-shows-mobile-popup-before-upload-starts-test
  (async done
         (let [upload-fn (some-> (resolve 'frontend.components.repo/upload-local-graph-with-confirm!) deref)
               calls (atom [])]
           (if-not upload-fn
             (do
               (is false "missing upload-local-graph-with-confirm!")
               (done))
             (-> (p/with-redefs [shui/dialog-confirm! (fn [_content _opts]
                                                        (p/resolved nil))
                                 state/get-current-repo (fn []
                                                          "logseq_db_demo")
                                 rtc-handler/<rtc-upload-graph! (fn [_repo _graph-e2ee?]
                                                                  (swap! calls conj :upload)
                                                                  (is (= [:popup-show :finish-handler :upload] @calls))
                                                                  (p/resolved nil))
                                 rtc-indicator/on-upload-finished-task (fn [_f]
                                                                         (swap! calls conj :finish-handler))
                                 util/mobile? (fn [] true)
                                 shui/popup-show! (fn [& _]
                                                    (swap! calls conj :popup-show))
                                 shui/popup-hide! (fn [& _]
                                                    (swap! calls conj :popup-hide))]
                   (upload-fn {:url "logseq_db_demo"
                               :graph-e2ee? true}))
                 (p/then (fn [_]
                           (is (= [:popup-show :finish-handler :upload :popup-hide]
                                  @calls))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))

(deftest upload-local-graph-hides-mobile-popup-when-upload-errors-test
  (async done
         (let [upload-fn (some-> (resolve 'frontend.components.repo/upload-local-graph-with-confirm!) deref)
               calls (atom [])]
           (if-not upload-fn
             (do
               (is false "missing upload-local-graph-with-confirm!")
               (done))
             (-> (p/with-redefs [shui/dialog-confirm! (fn [_content _opts]
                                                        (p/resolved nil))
                                 state/get-current-repo (fn []
                                                          "logseq_db_demo")
                                 rtc-handler/<rtc-upload-graph! (fn [_repo _graph-e2ee?]
                                                                  (swap! calls conj :upload)
                                                                  (p/rejected (ex-info "upload failed" {})))
                                 rtc-indicator/on-upload-finished-task (fn [_f]
                                                                         (swap! calls conj :finish-handler))
                                 util/mobile? (fn [] true)
                                 shui/popup-show! (fn [& _]
                                                    (swap! calls conj :popup-show))
                                 shui/popup-hide! (fn [& _]
                                                    (swap! calls conj :popup-hide))]
                   (upload-fn {:url "logseq_db_demo"
                               :graph-e2ee? true}))
                 (p/then (fn [_]
                           (is false "expected upload failure")
                           (done)))
                 (p/catch (fn [error]
                            (is (= "upload failed" (ex-message error)))
                            (is (= [:popup-show :finish-handler :upload :popup-hide]
                                   @calls))
                            (done))))))))

(deftest ensure-rsa-key-does-not-create-graph-test
  (async done
         (let [ensure-fn (ensure-rsa-key-fn)
               db-worker-calls (atom [])
               create-calls (atom 0)
               ensured-values (atom [])]
           (if-not ensure-fn
             (do
               (is false "missing ensure-e2ee-rsa-key-for-cloud!")
               (done))
             (-> (p/with-redefs [state/pub-event! (fn [_event]
                                                    (p/resolved nil))
                                 state/<invoke-db-worker
                                 (fn [op & args]
                                   (swap! db-worker-calls conj (into [op] args))
                                   (if (= op :thread-api/db-sync-ensure-user-rsa-keys)
                                     (p/resolved {:public-key "pk"})
                                     (p/resolved nil)))
                                 repo-handler/new-db!
                                 (fn [& _]
                                   (swap! create-calls inc)
                                   (p/resolved "repo"))]
                   (ensure-fn {:cloud? true
                               :graph-e2ee? true
                               :refresh-token "refresh"
                               :token "token"
                               :user-uuid "user-1"
                               :e2ee-rsa-key-ensured? false}
                              (fn [value]
                                (swap! ensured-values conj value))))
                 (p/then (fn [_]
                           (let [[set-config-call ensure-call] @db-worker-calls
                                 set-config (second set-config-call)]
                             (is (= :thread-api/set-db-sync-config (first set-config-call)))
                             (is (= :thread-api/db-sync-ensure-user-rsa-keys (first ensure-call)))
                             (is (= true (:enabled? set-config)))
                             (is (contains? set-config :ws-url))
                             (is (contains? set-config :http-base))
                             (is (not (contains? set-config :oauth-domain)))
                             (is (not (contains? set-config :oauth-client-id))))
                           (is (= [true] @ensured-values))
                           (is (zero? @create-calls))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))

(deftest ensure-rsa-key-nil-result-does-not-create-graph-test
  (async done
         (let [ensure-fn (ensure-rsa-key-fn)
               db-worker-calls (atom [])
               create-calls (atom 0)
               ensured-values (atom [])]
           (if-not ensure-fn
             (do
               (is false "missing ensure-e2ee-rsa-key-for-cloud!")
               (done))
             (-> (p/with-redefs [state/pub-event! (fn [_event]
                                                    (p/resolved nil))
                                 state/<invoke-db-worker
                                 (fn [op & args]
                                   (swap! db-worker-calls conj (into [op] args))
                                   (p/resolved nil))
                                 repo-handler/new-db!
                                 (fn [& _]
                                   (swap! create-calls inc)
                                   (p/resolved "repo"))]
                   (ensure-fn {:cloud? true
                               :graph-e2ee? true
                               :refresh-token "refresh"
                               :token "token"
                               :user-uuid "user-1"
                               :e2ee-rsa-key-ensured? false}
                              (fn [value]
                                (swap! ensured-values conj value))))
                 (p/then (fn [_]
                           (let [[set-config-call ensure-call] @db-worker-calls
                                 set-config (second set-config-call)]
                             (is (= :thread-api/set-db-sync-config (first set-config-call)))
                             (is (= :thread-api/db-sync-ensure-user-rsa-keys (first ensure-call)))
                             (is (= true (:enabled? set-config)))
                             (is (contains? set-config :ws-url))
                             (is (contains? set-config :http-base))
                             (is (not (contains? set-config :oauth-domain)))
                             (is (not (contains? set-config :oauth-client-id))))
                           (is (= [false] @ensured-values))
                           (is (zero? @create-calls))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))

(deftest ensure-rsa-key-skips-when-prerequisites-missing-test
  (async done
         (let [ensure-fn (ensure-rsa-key-fn)
               ensure-calls (atom 0)
               create-calls (atom 0)
               ensured-values (atom [])]
           (if-not ensure-fn
             (do
               (is false "missing ensure-e2ee-rsa-key-for-cloud!")
               (done))
             (-> (p/with-redefs [state/<invoke-db-worker
                                 (fn [& _]
                                   (swap! ensure-calls inc)
                                   (p/resolved {:public-key "pk"}))
                                 repo-handler/new-db!
                                 (fn [& _]
                                   (swap! create-calls inc)
                                   (p/resolved "repo"))]
                   (ensure-fn {:cloud? false
                               :refresh-token nil
                               :token nil
                               :user-uuid nil
                               :e2ee-rsa-key-ensured? false}
                              (fn [value]
                                (swap! ensured-values conj value))))
                 (p/then (fn [_]
                           (is (zero? @ensure-calls))
                           (is (empty? @ensured-values))
                           (is (zero? @create-calls))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))

(deftest ensure-rsa-key-skips-when-graph-e2ee-disabled-test
  (async done
         (let [ensure-fn (ensure-rsa-key-fn)
               ensure-calls (atom 0)
               ensured-values (atom [])]
           (if-not ensure-fn
             (do
               (is false "missing ensure-e2ee-rsa-key-for-cloud!")
               (done))
             (-> (p/with-redefs [state/<invoke-db-worker
                                 (fn [& _]
                                   (swap! ensure-calls inc)
                                   (p/resolved {:public-key "pk"}))]
                   (ensure-fn {:cloud? true
                               :graph-e2ee? false
                               :refresh-token "refresh"
                               :token "token"
                               :user-uuid "user-1"
                               :e2ee-rsa-key-ensured? false}
                              (fn [value]
                                (swap! ensured-values conj value))))
                 (p/then (fn [_]
                           (is (zero? @ensure-calls))
                           (is (empty? @ensured-values))
                           (done)))
                 (p/catch (fn [error]
                            (is false (str error))
                            (done))))))))

(deftest not-ready-remote-graph-does-not-trigger-download-test
  (let [events (atom [])
        links (#'repo/repos-dropdown-links
               [{:url "logseq_db_demo"
                 :remote? true
                 :rtc-graph? true
                 :GraphName "demo"
                 :GraphUUID "graph-1"
                 :GraphSchemaVersion "65"
                 :graph-ready-for-use? false}]
               nil
               nil)
        on-click (get-in (first links) [:options :on-click])]
    (with-redefs [state/pub-event! (fn [event]
                                     (swap! events conj event))]
      (on-click #js {})
      (is (empty? @events)))))
