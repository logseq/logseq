(ns frontend.worker.sync.crypt-mutation3-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.common.crypt :as crypt]
            [frontend.common.thread-api :as thread-api]
            [frontend.worker-common.util :as worker-util]
            [frontend.worker.platform :as platform]
            [frontend.worker.state :as worker-state]
            [frontend.worker.sync.auth :as sync-auth]
            [frontend.worker.sync.crypt :as sync-crypt]
            [frontend.worker.sync.util :as sync-util]
            [frontend.worker.ui-request :as ui-request]
            [logseq.db :as ldb]
            [promesa.core :as p]))

(defn- <outcome
  "Calls f; resolves to its value, or to {::error e} when it throws or rejects."
  [f]
  (-> (p/resolved nil)
      (p/then (fn [_] (f)))
      (p/catch (fn [error] {::error error}))))

(defn- finish [promise done]
  (-> promise
      (p/catch (fn [error] (is false (str "unexpected error: " error))))
      (p/finally done)))

(defn- error-of [outcome]
  (::error outcome))

(defn- error-info [outcome]
  (let [error (error-of outcome)]
    [(ex-message error) (ex-data error)]))

(defn- <spied
  "Calls f with a fake platform and the crypt collaborators redefined into
  spies recording [kind & args]; env overrides what they answer.
  Resolves to {:result .. :calls ..}."
  [env f]
  (let [calls* (atom [])
        record! (fn [& entry] (swap! calls* conj (vec entry)))
        env (merge {:runtime :node
                    :owner-source nil
                    :auth-token nil
                    :jwt-sub nil
                    :ws-token-result (p/rejected (ex-info "no token" {}))
                    :read-text (p/resolved nil)
                    :request-result (p/resolved {:supported? false})
                    :delete-result (p/resolved nil)
                    :kv-get-result (p/resolved nil)
                    :refresh-token "refresh-token"}
                   env)
        fake-platform {:env {:runtime (:runtime env) :owner-source (:owner-source env)}
                       :storage {:read-text! (fn [path] (record! :read-text path) (:read-text env))}
                       :kv {:get (fn [k] (record! :kv-get k) (:kv-get-result env))
                            :set! (fn [k v] (record! :kv-set k v) (p/resolved nil))}
                       :crypto {:save-secret-text! (fn [k text] (record! :save-secret k text) (p/resolved nil))
                                :delete-secret-text! (fn [k]
                                                       (record! :delete-secret k)
                                                       (:delete-result env))}}]
    (reset! worker-state/*state {:auth/refresh-token (:refresh-token env)})
    (p/let [result (p/with-redefs [platform/current (fn [] fake-platform)
                                   ui-request/<request (fn [action payload & _]
                                                         (record! :ui-request action payload)
                                                         (let [r (:request-result env)]
                                                           (if (fn? r) (r) r)))
                                   sync-util/auth-token (fn [] (:auth-token env))
                                   worker-util/parse-jwt (fn [_token] {:sub (:jwt-sub env)})
                                   sync-auth/<resolve-ws-token (fn [] (:ws-token-result env))
                                   sync-util/fetch-json (fn [url request opts]
                                                          (record! :fetch url request opts)
                                                          (p/resolved (:fetch-result env)))
                                   sync-util/coerce-http-request (fn [schema-key body]
                                                                   (record! :coerce schema-key body)
                                                                   (:coerce-result env))
                                   crypt/<generate-rsa-key-pair (fn [] (p/resolved {:publicKey :pub :privateKey :priv}))
                                   crypt/<encrypt-private-key (fn [password private-key]
                                                                (record! :encrypt-private-key password private-key)
                                                                (p/resolved {:encrypted [password private-key]}))
                                   crypt/<export-public-key (fn [_public-key] (p/resolved {:exported :pub}))
                                   crypt/<encrypt-text-by-text-password (fn [refresh-token password]
                                                                          (record! :encrypt-text refresh-token password)
                                                                          (p/resolved {:text-encrypted password}))]
                     (<outcome f))]
      {:result result :calls @calls*})))

(defn- calls-of [calls kind]
  (filterv #(= kind (first %)) calls))

(defn- thrown [f]
  (try (f) nil (catch :default e e)))

(def ^:private password-key "logseq-encrypted-password")

;; ------------------------------------------------------------------ helpers

;; Fails if, in `ensure-refresh-token!`, the `:reason` key is dropped or the `:hint` key is dropped.
(deftest ensure-refresh-token-requires-a-token-test
  (let [error (thrown #(#'sync-crypt/ensure-refresh-token! nil))]
    (is (= {:code :db-sync/missing-e2ee-password
            :field :e2ee-password
            :reason :missing-refresh-token
            :hint "Run logseq login first."}
           (ex-data error)))
    (is (nil? (#'sync-crypt/ensure-refresh-token! "token")))))

;; Fails if, in `auth-file-path`, the body becomes `nil`.
;; Fails if, in `<read-refresh-token-from-auth-file`, the `(p/catch (fn [_]` step is dropped, the `:reason` key is dropped or the `:hint` key is dropped.
(deftest read-refresh-token-from-auth-file-test
  (async done
         (finish
          (p/let [ok (<spied {:read-text (p/resolved "{\"refresh-token\":\"rt\"}")}
                             #(#'sync-crypt/<read-refresh-token-from-auth-file (platform/current)))
                  unreadable (<spied {:read-text (p/rejected (ex-info "no file" {}))}
                                     #(#'sync-crypt/<read-refresh-token-from-auth-file (platform/current)))
                  invalid (<spied {:read-text (p/resolved "{not json")}
                                  #(#'sync-crypt/<read-refresh-token-from-auth-file (platform/current)))]
            (is (= "rt" (:result ok)))
            (is (= [[:read-text "~/logseq/auth.json"]] (:calls ok)))
            (is (= :missing-refresh-token (:reason (second (error-info (:result unreadable))))))
            (is (= {:code :db-sync/missing-e2ee-password
                    :field :e2ee-password
                    :reason :invalid-auth-file
                    :hint "Run logseq login first."}
                   (second (error-info (:result invalid))))))
          done)))

;; Fails if, in `<clear-e2ee-password!`, `if` becomes `if-not`, `when-not` becomes `when`, the body becomes `nil`, the `(p/then (fn [resp]` step is dropped, the `(p/catch (fn [e]` step is dropped or the `:key` key is dropped.
(deftest clear-e2ee-password-deletes-the-persisted-secret-test
  (async done
         (finish
          (p/let [native-deleted (<spied {:runtime :browser :owner-source :capacitor
                                          :request-result (p/resolved {:supported? true})}
                                         #(#'sync-crypt/<clear-e2ee-password!))
                  native-unsupported (<spied {:runtime :browser :owner-source :capacitor
                                              :request-result (p/resolved {:supported? false})}
                                             #(#'sync-crypt/<clear-e2ee-password!))
                  native-fails (<spied {:runtime :browser :owner-source :capacitor
                                        :request-result (p/rejected (ex-info "native failed" {}))}
                                       #(#'sync-crypt/<clear-e2ee-password!))
                  plain (<spied {:runtime :node :owner-source :cli}
                                #(#'sync-crypt/<clear-e2ee-password!))
                  delete-fails (<spied {:runtime :node :owner-source :cli
                                        :delete-result (p/rejected (ex-info "delete failed" {}))}
                                       #(#'sync-crypt/<clear-e2ee-password!))]
            (is (nil? (:result native-deleted)))
            (is (= [[:ui-request :native-delete-e2ee-password {:key password-key}]] (:calls native-deleted)))
            (is (= [[:ui-request :native-delete-e2ee-password {:key password-key}]
                    [:delete-secret password-key]]
                   (:calls native-unsupported)))
            (is (= [[:delete-secret password-key]] (calls-of (:calls native-fails) :delete-secret)))
            (is (= [[:delete-secret password-key]] (:calls plain)))
            (is (nil? (:result delete-fails))))
          done)))

;; ------------------------------------------------------- user rsa key cache

;; Fails if, in `<fetch-user-rsa-key-pair-raw`, the `:method` key is dropped, the `:response-schema` key is dropped or `:e2ee/user-keys` becomes `:e2ee/user-public-key`.
(deftest fetch-user-rsa-key-pair-raw-gets-the-user-keys-test
  (async done
         (finish
          (p/let [{:keys [result calls]} (<spied {:fetch-result {:public-key "p"}}
                                                 #(sync-crypt/<fetch-user-rsa-key-pair-raw "https://sync.example.test"))]
            (is (= {:public-key "p"} result))
            (is (= [[:fetch "https://sync.example.test/e2ee/user-keys"
                     {:method "GET"}
                     {:response-schema :e2ee/user-keys}]]
                   calls)))
          done)))

;; Fails if, in `user-rsa-key-pair-valid?`, `and` becomes `or`.
(deftest user-rsa-key-pair-valid-needs-both-string-keys-test
  (is (true? (#'sync-crypt/user-rsa-key-pair-valid? {:public-key "p" :encrypted-private-key "e"})))
  (is (false? (boolean (#'sync-crypt/user-rsa-key-pair-valid? {:public-key "p"}))))
  (is (false? (boolean (#'sync-crypt/user-rsa-key-pair-valid? {:public-key 1 :encrypted-private-key "e"}))))
  (is (false? (boolean (#'sync-crypt/user-rsa-key-pair-valid? ["p" "e"])))))

;; Fails if, in `<set-user-rsa-key-pair-to-idb!`, `and` becomes `or`.
;; Fails if, in `<get-user-rsa-key-pair-from-idb`, `and` becomes `or`.
;; Fails if, in `<clear-user-rsa-key-pair-cache!`, `and` becomes `or`.
(deftest user-rsa-key-pair-idb-cache-test
  (async done
         (finish
          (p/let [pair {:public-key "p" :encrypted-private-key "e"}
                  idb-key "rtc-user-rsa-key-pair###b###u"
                  stored (<spied {} #(#'sync-crypt/<set-user-rsa-key-pair-to-idb! "b" "u" pair))
                  no-user (<spied {} #(#'sync-crypt/<set-user-rsa-key-pair-to-idb! "b" nil pair))
                  no-base (<spied {} #(#'sync-crypt/<set-user-rsa-key-pair-to-idb! nil "u" pair))
                  invalid (<spied {} #(#'sync-crypt/<set-user-rsa-key-pair-to-idb! "b" "u" {:public-key "p"}))
                  read-back (<spied {:kv-get-result (p/resolved (ldb/write-transit-str pair))}
                                    #(#'sync-crypt/<get-user-rsa-key-pair-from-idb "b" "u"))
                  read-no-user (<spied {} #(#'sync-crypt/<get-user-rsa-key-pair-from-idb "b" nil))
                  read-no-base (<spied {} #(#'sync-crypt/<get-user-rsa-key-pair-from-idb nil "u"))
                  cleared (<spied {} #(#'sync-crypt/<clear-user-rsa-key-pair-cache! "b" "u"))
                  cleared-no-user (<spied {} #(#'sync-crypt/<clear-user-rsa-key-pair-cache! "b" nil))
                  cleared-no-base (<spied {} #(#'sync-crypt/<clear-user-rsa-key-pair-cache! nil "u"))]
            (is (= pair (:result stored)))
            (is (= [[:kv-set idb-key (ldb/write-transit-str pair)]] (:calls stored)))
            (is (= [] (:calls no-user)))
            (is (= [] (:calls no-base)))
            (is (= pair (:result no-user)))
            (is (= [] (:calls invalid)))
            (is (= pair (:result read-back)))
            (is (= [[:kv-get idb-key]] (:calls read-back)))
            (is (= [] (:calls read-no-user)))
            (is (= [] (:calls read-no-base)))
            (is (= [[:kv-set idb-key nil]] (:calls cleared)))
            (is (= [] (:calls cleared-no-user)))
            (is (= [] (:calls cleared-no-base))))
          done)))

;; Fails if, in `<get-user-rsa-key-pair-raw`, `and` becomes `or`, `:db-sync/missing-field` becomes `:db-sync/read-e2ee-password-native-failed`, the `:base` key is dropped, the `:user-id` key is dropped or the `:field` key is dropped.
;; Fails if, in `<resolve-user-uuid`, the `(p/catch (fn [_error]` step is dropped.
(deftest get-user-rsa-key-pair-raw-needs-a-base-and-a-user-test
  (async done
         (finish
          (p/let [no-user (<spied {} #(#'sync-crypt/<get-user-rsa-key-pair-raw "b"))
                  no-base (<spied {:auth-token "jwt" :jwt-sub "u"} #(#'sync-crypt/<get-user-rsa-key-pair-raw nil))
                  user-from-ws-token (<spied {:ws-token-result (p/resolved "ws-token") :jwt-sub "u"}
                                             #(#'sync-crypt/<resolve-user-uuid))
                  no-ws-token (<spied {} #(#'sync-crypt/<resolve-user-uuid))]
            (is (= ["missing-field" {:base "b" :user-id nil :field :user-rsa-key-pair}]
                   (error-info (:result no-user))))
            (is (= ["missing-field" {:base nil :user-id "u" :field :user-rsa-key-pair}]
                   (error-info (:result no-base))))
            (is (= "u" (:result user-from-ws-token)))
            (is (nil? (:result no-ws-token))))
          done)))

;; Fails if, in `<upload-user-rsa-key-pair!`, `when` becomes `when-not`, `nil?` becomes `some?`, `:db-sync/invalid-field` becomes `:db-sync/missing-e2ee-password`, the `:type` key is dropped, the `:body` key is dropped, `:e2ee/user-keys` becomes `:e2ee/user-public-key`, the `:method` key is dropped, the `:headers` key is dropped or the `:response-schema` key is dropped.
(deftest upload-user-rsa-key-pair-posts-the-coerced-body-test
  (async done
         (finish
          (p/let [rejected (<spied {:coerce-result nil}
                                   #(sync-crypt/<upload-user-rsa-key-pair! "https://sync.example.test" "pub" "enc"))
                  ok (<spied {:coerce-result {:public-key "pub" :encrypted-private-key "enc"}
                              :fetch-result {:public-key "pub" :encrypted-private-key "enc"}
                              :auth-token "jwt" :jwt-sub "u"}
                             #(sync-crypt/<upload-user-rsa-key-pair! "https://sync.example.test" "pub" "enc"))]
            (is (= ["invalid-field" {:type :e2ee/user-keys :body nil}] (error-info (:result rejected))))
            (is (= [] (calls-of (:calls rejected) :fetch)))
            (is (= {:public-key "pub" :encrypted-private-key "enc"} (:result ok)))
            (is (= [[:fetch "https://sync.example.test/e2ee/user-keys"
                     {:method "POST"
                      :headers {"content-type" "application/json"}
                      :body "{\"public-key\":\"pub\",\"encrypted-private-key\":\"enc\"}"}
                     {:response-schema :e2ee/user-keys}]]
                   (calls-of (:calls ok) :fetch))))
          done)))

;; ------------------------------------------- generate-and-upload (password)

;; Fails if, in `<generate-and-upload-user-rsa-key-pair!`, `and` becomes `or`, `seq` becomes `empty?`, the `:reason` key is dropped, the `:hint` key is dropped, the `:public-key` key is dropped or the `:encrypted-private-key` key is dropped.
(deftest generate-and-upload-user-rsa-key-pair-needs-a-non-empty-password-test
  (async done
         (finish
          (p/let [generate! (fn [env password]
                              (<spied env #(#'sync-crypt/<generate-and-upload-user-rsa-key-pair!
                                            "https://sync.example.test" {:password password})))
                  empty-password (generate! {:runtime :node :owner-source :cli} "")
                  number-password (generate! {:runtime :node :owner-source :cli} 123)
                  ok (generate! {:runtime :browser
                                 :coerce-result {:public-key "p" :encrypted-private-key "e"}
                                 :fetch-result {:public-key "p" :encrypted-private-key "e"}
                                 :auth-token "jwt" :jwt-sub "u"}
                                "pw")]
            (is (= ["missing-e2ee-password"
                    {:code :db-sync/missing-e2ee-password
                     :field :e2ee-password
                     :reason :missing-password-for-generate-user-rsa-key-pair
                     :hint "Provide --e2ee-password when running sync ensure-keys --upload-keys."}]
                   (error-info (:result empty-password))))
            (is (= (error-info (:result empty-password))
                   (error-info (:result number-password))))
            (is (= (ldb/write-transit-str {:exported :pub})
                   (:public-key (:result ok))))
            (is (= (ldb/write-transit-str {:encrypted [ "pw" :priv]})
                   (:encrypted-private-key (:result ok))))
            (is (= "pw" (:password (:result ok)))))
          done)))

;; ------------------------------------------------ crypto-stubbing harness

(def ^:private sync-base "https://sync.example.test")
(def ^:private aes-idb-key "rtc-encrypted-aes-key###g1")

(def ^:private graph-e2ee?-orig sync-crypt/graph-e2ee?)
(def ^:private ensure-graph-aes-key-orig sync-crypt/<ensure-graph-aes-key)
(def ^:private get-item-orig @#'sync-crypt/<get-item)
(def ^:private load-key-material-orig @#'sync-crypt/<load-user-rsa-key-material)
(def ^:private get-user-rsa-key-pair-raw-orig @#'sync-crypt/<get-user-rsa-key-pair-raw)
(def ^:private decrypt-private-key-orig @#'sync-crypt/<decrypt-private-key)
(def ^:private ensure-user-rsa-key-pair-raw-orig @#'sync-crypt/<ensure-user-rsa-key-pair-raw)

(defn- <crypted
  "<spied plus the key and password crypto stubbed, the caches emptied and the
  sync base set. env answers (fn [& args] promise) under :read-secret,
  :decrypt-text-by-text-password, :decrypt-private-key, :import-public-key,
  :encrypt-aes-key, :decrypt-aes-key, :generate-aes-key, :encrypt-text and
  :decrypt-text-if-encrypted; every stub call is returned as :seen [kind & args].
  When present, :graph-e2ee?, :aes-key-result, :items (idb key -> value),
  :key-material, :rsa-pair, :private-key-result and :ensure-raw replace the
  matching private helpers."
  [env f]
  (let [seen* (atom [])
        stub (fn [kind default]
               (fn [& args]
                 (swap! seen* conj (into [kind] args))
                 (apply (get env kind default) args)))]
    (p/let [out (<spied
                 env
                 (fn []
                   (reset! worker-state/*db-sync-config (get env :db-sync-config {:http-base sync-base}))
                   (reset! @#'sync-crypt/*graph->aes-key {})
                   (reset! @#'sync-crypt/*user-rsa-key-pair-inflight {})
                   (reset! @#'sync-crypt/*ensure-user-rsa-key-pair-inflight {})
                   (let [base-platform (platform/current)]
                     (p/with-redefs [platform/current (fn []
                                                        (assoc-in base-platform [:crypto :read-secret-text]
                                                                  (stub :read-secret (fn [_k] (p/resolved nil)))))
                                     crypt/<decrypt-text-by-text-password (stub :decrypt-text-by-text-password
                                                                                (fn [_refresh-token _data] (p/resolved "pw")))
                                     crypt/<decrypt-private-key (stub :decrypt-private-key
                                                                      (fn [_password _encrypted] (p/resolved :private-key)))
                                     crypt/<import-public-key (stub :import-public-key
                                                                    (fn [exported] (p/resolved [:imported exported])))
                                     crypt/<encrypt-aes-key (stub :encrypt-aes-key
                                                                  (fn [_public-key aes-key] (p/resolved [:encrypted-aes aes-key])))
                                     crypt/<decrypt-aes-key (stub :decrypt-aes-key
                                                                  (fn [_private-key _encrypted] (p/resolved :aes-key)))
                                     crypt/<generate-aes-key (stub :generate-aes-key
                                                                   (fn [] (p/resolved :new-aes-key)))
                                     crypt/<encrypt-text (stub :encrypt-text
                                                               (fn [_aes-key text] (p/resolved [:enc text])))
                                     crypt/<decrypt-text-if-encrypted (stub :decrypt-text-if-encrypted
                                                                            (fn [_aes-key _data] (p/resolved nil)))
                                     sync-crypt/graph-e2ee? (fn [repo]
                                                              (if (contains? env :graph-e2ee?)
                                                                (:graph-e2ee? env)
                                                                (graph-e2ee?-orig repo)))
                                     sync-crypt/<ensure-graph-aes-key (fn [repo graph-id]
                                                                        (if (contains? env :aes-key-result)
                                                                          (p/resolved (:aes-key-result env))
                                                                          (ensure-graph-aes-key-orig repo graph-id)))
                                     sync-crypt/<get-item (fn [k]
                                                            (if (contains? env :items)
                                                              (p/resolved (get (:items env) k))
                                                              (get-item-orig k)))
                                     sync-crypt/<load-user-rsa-key-material (fn [& args]
                                                                              (if (contains? env :key-material)
                                                                                (p/resolved (:key-material env))
                                                                                (apply load-key-material-orig args)))
                                     sync-crypt/<get-user-rsa-key-pair-raw (fn [base]
                                                                             (if (contains? env :rsa-pair)
                                                                               (p/resolved (:rsa-pair env))
                                                                               (get-user-rsa-key-pair-raw-orig base)))
                                     sync-crypt/<decrypt-private-key (fn [& args]
                                                                       (if (contains? env :private-key-result)
                                                                         (p/resolved (:private-key-result env))
                                                                         (apply decrypt-private-key-orig args)))
                                     sync-crypt/<ensure-user-rsa-key-pair-raw (fn [& args]
                                                                                (if (contains? env :ensure-raw)
                                                                                  (p/resolved (:ensure-raw env))
                                                                                  (apply ensure-user-rsa-key-pair-raw-orig args)))]
                       (f)))))]
      (assoc out :seen @seen*))))

(def ^:private missing-persisted-password-error
  ["missing-e2ee-password"
   {:code :db-sync/missing-e2ee-password
    :field :e2ee-password
    :reason :missing-persisted-password
    :hint "Provide --e2ee-password to persist it."}])

;; ------------------------------------------------- saving and reading the password

;; Fails if, in `<save-e2ee-password`, the `(p/then (fn [resp]` step is dropped or the `(p/catch (fn [e]` step is dropped.
(deftest save-e2ee-password-falls-back-to-secret-storage-unless-native-saved-test
  (async done
         (finish
          (p/let [text (ldb/write-transit-str {:text-encrypted "pw"})
                  request [:ui-request :native-save-e2ee-password {:key password-key :encrypted-text text}]
                  save! (fn [env]
                          (<crypted (merge {:runtime :browser :owner-source :capacitor} env)
                                    #(#'sync-crypt/<save-e2ee-password "pw")))
                  native-saved (save! {:request-result (p/resolved {:supported? true})})
                  native-unsupported (save! {:request-result (p/resolved {:supported? false})})
                  native-fails (save! {:request-result (p/rejected (ex-info "native failed" {}))})
                  plain (save! {:owner-source nil})]
            (is (nil? (:result native-saved)))
            (is (= [request] (calls-of (:calls native-saved) :ui-request)))
            (is (= [] (calls-of (:calls native-saved) :save-secret)))
            (is (nil? (:result native-unsupported)))
            (is (= [request] (calls-of (:calls native-unsupported) :ui-request)))
            (is (= [[:save-secret password-key text]] (calls-of (:calls native-unsupported) :save-secret)))
            (is (nil? (:result native-fails)))
            (is (= [[:save-secret password-key text]] (calls-of (:calls native-fails) :save-secret)))
            (is (nil? (:result plain)))
            (is (= [] (calls-of (:calls plain) :ui-request)))
            (is (= [[:save-secret password-key text]] (calls-of (:calls plain) :save-secret))))
          done)))

;; Fails if, in `<read-platform-e2ee-password-text`, the `(p/catch (fn [e]` step is dropped.
;; Fails if, in `<read-e2ee-password-text`, the `(p/catch (fn [e]` step is dropped.
(deftest read-e2ee-password-text-reads-native-then-secret-storage-test
  (async done
         (finish
          (p/let [stored-secret (fn [_k] (p/resolved "stored"))
                  capacitor {:runtime :browser :owner-source :capacitor :read-secret stored-secret}
                  read! (fn [env] (<crypted env #(#'sync-crypt/<read-e2ee-password-text "rt")))
                  stored (read! {:runtime :node :read-secret stored-secret})
                  secret-fails (read! {:runtime :node :read-secret (fn [_k] (p/rejected (ex-info "boom" {})))})
                  native (read! (assoc capacitor :request-result (p/resolved {:supported? true :encrypted-text "native"})))
                  native-unsupported (read! (assoc capacitor :request-result (p/resolved {:supported? false :encrypted-text "native"})))
                  native-fails (read! (assoc capacitor :request-result (p/rejected (ex-info "native failed" {}))))]
            (is (= "stored" (:result stored)))
            (is (= [[:read-secret password-key]] (:seen stored)))
            (is (= [] (calls-of (:calls stored) :ui-request)))
            (is (nil? (:result secret-fails)))
            (is (= "native" (:result native)))
            (is (= [[:ui-request :native-get-e2ee-password {:key password-key}]] (:calls native)))
            (is (= [] (:seen native)))
            (is (= "stored" (:result native-unsupported)))
            (is (= "stored" (:result native-fails)))
            (is (= [[:read-secret password-key]] (:seen native-fails))))
          done)))

;; Fails if, in `<decrypt-e2ee-password-text`, the `:reason` key is dropped, the `:hint` key is dropped, `:db-sync/invalid-e2ee-password-payload` becomes `:db-sync/invalid-field` or the `:field` key is dropped.
(deftest decrypt-e2ee-password-text-rejects-missing-and-invalid-payloads-test
  (async done
         (finish
          (p/let [decrypt! (fn [text] (<crypted {} #(#'sync-crypt/<decrypt-e2ee-password-text "rt" text)))
                  empty-text (decrypt! "")
                  nil-text (decrypt! nil)
                  invalid (decrypt! "{not transit")
                  ok (decrypt! (ldb/write-transit-str [:stored]))]
            (is (= missing-persisted-password-error (error-info (:result empty-text))))
            (is (= missing-persisted-password-error (error-info (:result nil-text))))
            (is (= ["invalid-e2ee-password-payload"
                    {:field :e2ee-password :reason :invalid-transit-payload}]
                   (error-info (:result invalid))))
            (is (= "pw" (:result ok)))
            (is (= [[:decrypt-text-by-text-password "rt" [:stored]]] (:seen ok))))
          done)))

;; Fails if, in `<request-e2ee-password-from-ui`, the `:hint` key is dropped, `:db-sync/missing-e2ee-password` becomes `:db-sync/missing-field`, the `:field` key is dropped or the `:reason` key is dropped.
(deftest request-e2ee-password-from-ui-requires-a-non-empty-password-test
  (async done
         (finish
          (p/let [requests* (atom [])
                  request! (fn [response]
                             (<spied {}
                                     (fn []
                                       (p/with-redefs [ui-request/<request (fn [action payload opts]
                                                                             (swap! requests* conj [action payload opts])
                                                                             (p/resolved response))]
                                         (#'sync-crypt/<request-e2ee-password-from-ui {:reason :why})))))
                  ok (request! {:password "pw"})
                  empty-password (request! {:password ""})
                  no-password (request! {})
                  rejected ["missing-e2ee-password" {:field :e2ee-password :reason :empty-ui-password}]]
            (is (= "pw" (:result ok)))
            (is (= (repeat 3 [:request-e2ee-password {:reason :why} {:hint "Provide e2ee-password to continue."}])
                   @requests*))
            (is (= rejected (error-info (:result empty-password))))
            (is (= rejected (error-info (:result no-password)))))
          done)))

;; Fails if, in `<verify-e2ee-password`, the `:reason` key is dropped.
(deftest verify-e2ee-password-rejects-empty-passwords-and-maps-invalid-ones-test
  (async done
         (finish
          (p/let [verify! (fn [env password encrypted]
                            (<crypted env #(#'sync-crypt/<verify-e2ee-password password encrypted)))
                  rejecting (fn [invalid?]
                              {:decrypt-private-key (fn [_password _encrypted]
                                                      (p/rejected (ex-info "bad" {:invalid-password? invalid?})))})
                  empty-password (verify! {} "" "x")
                  ok (verify! {} "pw" (ldb/write-transit-str [:enc]))
                  invalid-password (verify! (rejecting true) "pw" [:enc])
                  other-error (verify! (rejecting false) "pw" [:enc])]
            (is (= ["missing-e2ee-password"
                    {:code :db-sync/missing-e2ee-password :field :e2ee-password :reason :empty-password}]
                   (error-info (:result empty-password))))
            (is (= :private-key (:result ok)))
            (is (= [[:decrypt-private-key "pw" [:enc]]] (:seen ok)))
            (is (= ["invalid-e2ee-password" {:code :db-sync/invalid-e2ee-password}]
                   (error-info (:result invalid-password))))
            (is (= ["bad" {:invalid-password? false}] (error-info (:result other-error)))))
          done)))

;; Fails if, in `<verify-and-save-e2ee-password-from-server!`, `:db-sync/missing-field` becomes `:db-sync/read-e2ee-password-native-failed`, the `:base` key is dropped or the `:field` key is dropped.
(deftest verify-and-save-e2ee-password-from-server-needs-the-base-and-the-private-key-test
  (async done
         (finish
          (p/let [verify! (fn [env]
                            (<crypted (merge {:runtime :browser} env)
                                      #(#'sync-crypt/<verify-and-save-e2ee-password-from-server! "pw")))
                  no-base (verify! {:db-sync-config {}})
                  no-key (verify! {:fetch-result {:public-key "p"}})
                  ok (verify! {:fetch-result {:encrypted-private-key (ldb/write-transit-str [:enc])}})]
            (is (= ["missing-field" {:base nil :field :e2ee-base}] (error-info (:result no-base))))
            (is (= ["missing-field" {:base sync-base :field :encrypted-private-key}]
                   (error-info (:result no-key))))
            (is (= :private-key (:result ok)))
            (is (= [[:decrypt-private-key "pw" [:enc]]] (:seen ok)))
            (is (= 1 (count (calls-of (:calls ok) :save-secret)))))
          done)))

;; ------------------------------------------------------- user rsa key pair

;; Fails if, in `<get-user-rsa-key-pair-raw`, the `(p/finally (fn []` step is dropped.
(deftest get-user-rsa-key-pair-raw-forgets-the-inflight-task-when-done-test
  (async done
         (finish
          (p/let [pair {:public-key "p" :encrypted-private-key "e"}
                  {:keys [result calls]} (<crypted {:auth-token "jwt" :jwt-sub "u"
                                                    :fetch-result pair
                                                    :kv-get-result (p/resolved (ldb/write-transit-str {}))}
                                                   #(p/let [first-pair (#'sync-crypt/<get-user-rsa-key-pair-raw sync-base)
                                                            second-pair (#'sync-crypt/<get-user-rsa-key-pair-raw sync-base)]
                                                      [first-pair second-pair @@#'sync-crypt/*user-rsa-key-pair-inflight]))]
            (is (= [pair pair {}] result))
            (is (= 2 (count (calls-of calls :fetch)))))
          done)))

;; Fails if, in `<ensure-user-rsa-key-pair`, `:db-sync/missing-field` becomes `:db-sync/read-e2ee-password-native-failed`, the `:base` key is dropped, the `:user-id` key is dropped or the `:field` key is dropped.
(deftest ensure-user-rsa-key-pair-without-password-needs-a-base-and-a-user-test
  (async done
         (finish
          (p/let [ensure! (fn [env base] (<crypted env #(#'sync-crypt/<ensure-user-rsa-key-pair base nil)))
                  no-user (ensure! {} sync-base)
                  no-base (ensure! {:auth-token "jwt" :jwt-sub "u"} nil)]
            (is (= ["missing-field" {:base sync-base :user-id nil :field :user-rsa-key-pair}]
                   (error-info (:result no-user))))
            (is (= ["missing-field" {:base nil :user-id "u" :field :user-rsa-key-pair}]
                   (error-info (:result no-base)))))
          done)))

;; Fails if, in `<ensure-user-rsa-key-pair`, `and` becomes `or`.
(deftest ensure-user-rsa-key-pair-without-a-user-resolves-the-token-once-test
  (async done
         (let [token-requests (atom 0)]
           (reset! @#'sync-crypt/*ensure-user-rsa-key-pair-inflight {})
           (reset! @#'sync-crypt/*user-rsa-key-pair-inflight {})
           (finish
            (p/let [outcome (p/with-redefs [sync-util/auth-token (fn [] nil)
                                            sync-auth/<resolve-ws-token (fn []
                                                                          (swap! token-requests inc)
                                                                          (p/rejected (ex-info "refresh failed" {})))]
                              (<outcome #(#'sync-crypt/<ensure-user-rsa-key-pair sync-base nil)))]
              (is (= ["missing-field" {:base sync-base :user-id nil :field :user-rsa-key-pair}]
                     (error-info outcome)))
              (is (= 1 @token-requests)))
            done))))

;; Fails if, in `interactive-runtime?`, `and` becomes `or`.
;; Fails if, in `<decrypt-private-key`, `if` becomes `if-not`, `seq` becomes `empty?`, `when-not` becomes `when`, the `:reason` key is dropped or the `:hint` key is dropped.
;; Fails if, in `missing-e2ee-password-ex`, the `:code` key is dropped or the `:field` key is dropped.
;; Fails if, in `fail-missing-e2ee-password!`, `:db-sync/missing-e2ee-password` becomes `:db-sync/missing-field`, the `:code` key is dropped or the `:field` key is dropped.
(deftest decrypt-private-key-headless-reads-the-persisted-password-test
  (async done
         (finish
          (p/let [encrypted (ldb/write-transit-str [:enc])
                  stored-secret (fn [_k] (p/resolved (ldb/write-transit-str [:stored])))
                  decrypt! (fn [env]
                             (<crypted (merge {:runtime :node :owner-source :cli} env)
                                       #(#'sync-crypt/<decrypt-private-key encrypted)))
                  no-secret (decrypt! {})
                  blank-password (decrypt! {:read-secret stored-secret
                                            :decrypt-text-by-text-password (fn [_refresh-token _data] (p/resolved ""))})
                  ok (decrypt! {:read-secret stored-secret})]
            (is (= missing-persisted-password-error (error-info (:result no-secret))))
            (is (= ["missing-e2ee-password"
                    {:code :db-sync/missing-e2ee-password
                     :field :e2ee-password
                     :reason :headless-empty-password
                     :hint "Provide --e2ee-password to persist it."}]
                   (error-info (:result blank-password))))
            (is (= :private-key (:result ok)))
            (is (= [[:read-secret password-key]
                    [:decrypt-text-by-text-password "refresh-token" [:stored]]
                    [:decrypt-private-key "pw" [:enc]]]
                   (:seen ok))))
          done)))

;; ------------------------------------------------------- server requests

;; Fails if, in `<upsert-graph-encrypted-aes-key!`, `:db-sync/invalid-field` becomes `:db-sync/missing-e2ee-password`, the `:type` key is dropped, the `:body` key is dropped, `:e2ee/graph-aes-key` becomes `:e2ee/user-keys`, the `:headers` key is dropped or the `:response-schema` key is dropped.
(deftest upsert-graph-encrypted-aes-key-posts-the-coerced-body-test
  (async done
         (finish
          (p/let [rejected (<spied {:coerce-result nil}
                                   #(#'sync-crypt/<upsert-graph-encrypted-aes-key! sync-base "g1" "enc"))
                  ok (<spied {:coerce-result {:encrypted-aes-key "enc"}
                              :fetch-result {:encrypted-aes-key "enc"}}
                             #(#'sync-crypt/<upsert-graph-encrypted-aes-key! sync-base "g1" "enc"))]
            (is (= ["invalid-field" {:type :e2ee/graph-aes-key :body nil}] (error-info (:result rejected))))
            (is (= [] (calls-of (:calls rejected) :fetch)))
            (is (= [[:coerce :e2ee/graph-aes-key {:encrypted-aes-key "enc"}]] (calls-of (:calls rejected) :coerce)))
            (is (= {:encrypted-aes-key "enc"} (:result ok)))
            (is (= [[:fetch "https://sync.example.test/e2ee/graphs/g1/aes-key"
                     {:method "POST"
                      :headers {"content-type" "application/json"}
                      :body "{\"encrypted-aes-key\":\"enc\"}"}
                     {:response-schema :e2ee/graph-aes-key}]]
                   (calls-of (:calls ok) :fetch))))
          done)))

;; ------------------------------------------------------- key material

;; Fails if, in `<load-user-rsa-key-material`, `and` becomes `or`, `:db-sync/missing-field` becomes `:db-sync/read-e2ee-password-native-failed`, the `:base` key is dropped, the `:user-id` key is dropped, the `:graph-id` key is dropped, the `:field` key is dropped, the `:public-key` key is dropped or the `:private-key` key is dropped.
(deftest load-user-rsa-key-material-needs-both-key-strings-and-returns-the-keys-test
  (async done
         (finish
          (p/let [pair {:public-key (ldb/write-transit-str {:k 1}) :encrypted-private-key "enc-str"}
                  load! (fn [ensure-raw]
                          (<crypted {:ensure-raw ensure-raw :private-key-result :private}
                                    #(#'sync-crypt/<load-user-rsa-key-material "b" "u" "g")))
                  ok (load! pair)
                  no-private (load! (assoc pair :encrypted-private-key nil))
                  no-public (load! (assoc pair :public-key nil))
                  missing ["missing-field" {:base "b" :user-id "u" :graph-id "g" :field :user-rsa-key-pair}]]
            (is (= {:public-key [:imported {:k 1}] :private-key :private} (:result ok)))
            (is (= [[:import-public-key {:k 1}]] (:seen ok)))
            (is (= missing (error-info (:result no-private))))
            (is (= missing (error-info (:result no-public)))))
          done)))

;; Fails if, in `<preflight-upload-e2ee!`, `and` becomes `or`, `:db-sync/missing-field` becomes `:db-sync/read-e2ee-password-native-failed`, the `:repo` key is dropped, the `:base` key is dropped, the `:user-id` key is dropped or the `:field` key is dropped.
(deftest preflight-upload-e2ee-needs-a-base-and-a-user-test
  (async done
         (finish
          (p/let [preflight! (fn [env encrypted-graph?]
                               (<crypted env #(sync-crypt/<preflight-upload-e2ee! "repo" encrypted-graph?)))
                  no-user (preflight! {} true)
                  no-base (preflight! {:db-sync-config {} :auth-token "jwt" :jwt-sub "u"} true)
                  ok (preflight! {:auth-token "jwt" :jwt-sub "u" :key-material {:public-key :pub :private-key :priv}} true)
                  skipped (preflight! {} false)]
            (is (= ["missing-field" {:repo "repo" :base sync-base :user-id nil :field :user-rsa-key-pair}]
                   (error-info (:result no-user))))
            (is (= ["missing-field" {:repo "repo" :base nil :user-id "u" :field :user-rsa-key-pair}]
                   (error-info (:result no-base))))
            (is (nil? (:result ok)))
            (is (nil? (:result skipped))))
          done)))

;; ------------------------------------------------------- graph aes key

(defn- <aes-key-for
  [env]
  (<crypted (merge {:graph-e2ee? true
                    :auth-token "jwt" :jwt-sub "u"
                    :key-material {:public-key :pub :private-key :priv}
                    :items {}}
                   env)
            #(sync-crypt/<ensure-graph-aes-key "repo" "g1")))

;; Fails if, in `<ensure-graph-aes-key`, `and` becomes `or`, `:db-sync/missing-field` becomes `:db-sync/read-e2ee-password-native-failed`, the `:base` key is dropped, the `:user-id` key is dropped or the `:graph-id` key is dropped.
(deftest ensure-graph-aes-key-needs-a-base-and-a-user-test
  (async done
         (finish
          (p/let [no-user (<aes-key-for {:auth-token nil :jwt-sub nil})
                  no-base (<aes-key-for {:db-sync-config {}})
                  not-e2ee (<aes-key-for {:graph-e2ee? false})]
            (is (= ["missing-field" {:base sync-base :user-id nil :graph-id "g1"}]
                   (error-info (:result no-user))))
            (is (= ["missing-field" {:base nil :user-id "u" :graph-id "g1"}]
                   (error-info (:result no-base))))
            (is (nil? (:result not-e2ee))))
          done)))

;; Fails if, in `<fetch-graph-encrypted-aes-key-raw`, the `:method` key is dropped, the `:response-schema` key is dropped or `:e2ee/graph-aes-key` becomes `:e2ee/user-keys`.
(deftest ensure-graph-aes-key-fetches-and-stores-the-remote-key-test
  (async done
         (finish
          (p/let [{:keys [result calls seen]} (<aes-key-for {:fetch-result {:encrypted-aes-key (ldb/write-transit-str "remote-enc")}
                                                             :decrypt-aes-key (fn [_private-key encrypted] (p/resolved [:aes encrypted]))})]
            (is (= [:aes "remote-enc"] result))
            (is (= [[:fetch "https://sync.example.test/e2ee/graphs/g1/aes-key"
                     {:method "GET"}
                     {:response-schema :e2ee/graph-aes-key}]]
                   (calls-of calls :fetch)))
            (is (= [[:kv-set aes-idb-key "remote-enc"]] (calls-of calls :kv-set)))
            (is (= [[:decrypt-aes-key :priv "remote-enc"]] seen)))
          done)))

;; Fails if, in `<upsert-graph-encrypted-aes-key!`, `when` becomes `when-not`, `nil?` becomes `some?`, the body becomes `nil`, `:e2ee/graph-aes-key` becomes `:e2ee/user-keys`, the `:encrypted-aes-key` key is dropped or the `:method` key is dropped.
(deftest ensure-graph-aes-key-generates-and-uploads-a-new-key-test
  (async done
         (finish
          (p/let [encrypted [:encrypted-aes :new-aes-key]
                  {:keys [result calls]} (<aes-key-for {:fetch-result {}
                                                        :coerce-result {:encrypted-aes-key "x"}})]
            (is (= :new-aes-key result))
            (is (= [[:coerce :e2ee/graph-aes-key {:encrypted-aes-key (ldb/write-transit-str encrypted)}]]
                   (calls-of calls :coerce)))
            (is (= ["GET" "POST"] (mapv #(:method (nth % 2)) (calls-of calls :fetch))))
            (is (= [[:kv-set aes-idb-key encrypted]] (calls-of calls :kv-set))))
          done)))

;; Fails if, in `<ensure-graph-aes-key`, `and` becomes `or`, `if-not` becomes `if` or the `(p/catch (fn [error]` step is dropped.
(deftest ensure-graph-aes-key-refetches-when-the-local-key-fails-to-decrypt-test
  (async done
         (finish
          (p/let [decrypt (fn [_private-key encrypted]
                            (if (= "local-enc" encrypted)
                              (p/rejected (ex-info "decrypt-aes-key" {}))
                              (p/resolved [:aes encrypted])))
                  refetched (<aes-key-for {:items {aes-idb-key "local-enc"}
                                           :fetch-result {:encrypted-aes-key (ldb/write-transit-str "fresh-enc")}
                                           :decrypt-aes-key decrypt})
                  nothing-to-refetch (<aes-key-for {:items {aes-idb-key "local-enc"}
                                                    :fetch-result {}
                                                    :decrypt-aes-key decrypt})
                  remote-fails (<aes-key-for {:fetch-result {:encrypted-aes-key (ldb/write-transit-str "remote-enc")}
                                              :decrypt-aes-key (fn [_private-key _encrypted]
                                                                 (p/rejected (ex-info "decrypt-aes-key" {})))})]
            (is (= [:aes "fresh-enc"] (:result refetched)))
            (is (= [[:kv-set aes-idb-key nil] [:kv-set aes-idb-key "fresh-enc"]]
                   (calls-of (:calls refetched) :kv-set)))
            (is (= 1 (count (calls-of (:calls refetched) :fetch))))
            (is (= [[:decrypt-aes-key :priv "local-enc"] [:decrypt-aes-key :priv "fresh-enc"]]
                   (:seen refetched)))
            (is (= ["decrypt-aes-key" {}] (error-info (:result nothing-to-refetch))))
            (is (= ["decrypt-aes-key" {}] (error-info (:result remote-fails))))
            (is (= [] (calls-of (:calls remote-fails) :kv-set)))
            (is (= 1 (count (calls-of (:calls remote-fails) :fetch)))))
          done)))

(defn- <download-aes-key
  [env graph-id]
  (<crypted (merge {:auth-token "jwt" :jwt-sub "u"
                    :rsa-pair {:public-key "p" :encrypted-private-key "enc"}
                    :private-key-result :priv
                    :decrypt-aes-key (fn [_private-key encrypted] (p/resolved [:aes encrypted]))}
                   env)
            #(sync-crypt/<fetch-graph-aes-key-for-download graph-id)))

;; Fails if, in `<fetch-graph-aes-key-for-download`, `and` becomes `or`, `:db-sync/missing-field` becomes `:db-sync/read-e2ee-password-native-failed`, the `:base` key is dropped, the `:graph-id` key is dropped or the `:field` key is dropped.
(deftest fetch-graph-aes-key-for-download-needs-a-base-a-graph-and-key-strings-test
  (async done
         (finish
          (p/let [no-graph (<download-aes-key {} nil)
                  no-base (<download-aes-key {:db-sync-config {}} "g1")
                  no-private-key (<download-aes-key {:rsa-pair {:public-key "p" :encrypted-private-key nil}} "g1")
                  no-public-key (<download-aes-key {:rsa-pair {:public-key nil :encrypted-private-key "enc"}} "g1")
                  no-remote-key (<download-aes-key {:fetch-result {}} "g1")
                  ok (<download-aes-key {:fetch-result {:encrypted-aes-key (ldb/write-transit-str "enc")}} "g1")]
            (is (= ["missing-field" {:base sync-base :graph-id nil}] (error-info (:result no-graph))))
            (is (= ["missing-field" {:base nil :graph-id "g1"}] (error-info (:result no-base))))
            (is (= ["missing-field" {:graph-id "g1" :field :user-rsa-key-pair}] (error-info (:result no-private-key))))
            (is (= ["missing-field" {:graph-id "g1" :field :user-rsa-key-pair}] (error-info (:result no-public-key))))
            (is (= ["missing-field" {:graph-id "g1" :field :encrypted-aes-key}] (error-info (:result no-remote-key))))
            (is (= [:aes "enc"] (:result ok)))
            (is (= [[:kv-set aes-idb-key nil] [:kv-set aes-idb-key "enc"]]
                   (calls-of (:calls ok) :kv-set))))
          done)))

;; ------------------------------------------------------- granting access

(defn- <grant-access
  [env]
  (<crypted (merge {:graph-e2ee? true
                    :aes-key-result :aes
                    :coerce-result {:body 1}
                    :fetch-result {:public-key (ldb/write-transit-str {:k 1})}}
                   env)
            #(sync-crypt/<grant-graph-access! "repo" "g1" "a@x.com")))

;; Fails if, in `<grant-graph-access!`, `if-not` becomes `if`, `when-not` becomes `when`, `when` becomes `when-not`, `nil?` becomes `some?`, the body becomes `nil`, `:db-sync/missing-field` becomes `:db-sync/read-e2ee-password-native-failed`, the `:base` key is dropped, the `:graph-id` key is dropped, the `:repo` key is dropped, the `:field` key is dropped, the `:email` key is dropped, `:e2ee/grant-access` becomes `:e2ee/graph-aes-key`, the `:target-user-email+encrypted-aes-key-...` key is dropped, the `:encrypted-aes-key` key is dropped, `:db-sync/invalid-field` becomes `:db-sync/missing-e2ee-password`, the `:type` key is dropped, the `:body` key is dropped, the `:method` key is dropped, the `:headers` key is dropped or the `:response-schema` key is dropped.
;; Fails if, in `<import-public-key`, the body becomes `nil`.
;; Fails if, in `<fetch-user-public-key-by-email`, the body becomes `nil`, the `:method` key is dropped, the `:response-schema` key is dropped or `:e2ee/user-public-key` becomes `:e2ee/grant-access`.
(deftest grant-graph-access-posts-the-encrypted-aes-key-for-the-target-user-test
  (async done
         (finish
          (p/let [ok (<grant-access {})
                  not-e2ee (<grant-access {:graph-e2ee? false})
                  no-base (<grant-access {:db-sync-config {}})
                  no-aes-key (<grant-access {:aes-key-result nil})
                  no-public-key (<grant-access {:fetch-result {}})
                  invalid-body (<grant-access {:coerce-result nil})]
            (is (nil? (:result ok)))
            (is (= [[:import-public-key {:k 1}] [:encrypt-aes-key [:imported {:k 1}] :aes]] (:seen ok)))
            (is (= [[:coerce :e2ee/grant-access
                     {:target-user-email+encrypted-aes-key-coll
                      [{:email "a@x.com"
                        :encrypted-aes-key (ldb/write-transit-str [:encrypted-aes :aes])}]}]]
                   (calls-of (:calls ok) :coerce)))
            (is (= [[:fetch "https://sync.example.test/e2ee/user-public-key?email=a%40x.com"
                     {:method "GET"}
                     {:response-schema :e2ee/user-public-key}]
                    [:fetch "https://sync.example.test/e2ee/graphs/g1/grant-access"
                     {:method "POST"
                      :headers {"content-type" "application/json"}
                      :body "{\"body\":1}"}
                     {:response-schema :e2ee/grant-access}]]
                   (calls-of (:calls ok) :fetch)))
            (is (nil? (:result not-e2ee)))
            (is (= [] (:calls not-e2ee)))
            (is (= ["missing-field" {:base nil :graph-id "g1"}] (error-info (:result no-base))))
            (is (= ["missing-field" {:repo "repo" :field :aes-key}] (error-info (:result no-aes-key))))
            (is (= ["missing-field" {:repo "repo" :field :public-key :email "a@x.com"}]
                   (error-info (:result no-public-key))))
            (is (= ["invalid-field" {:type :e2ee/grant-access :body nil}] (error-info (:result invalid-body)))))
          done)))

;; ------------------------------------------------------- tx data and datoms

(defn- encrypted-value [v]
  (ldb/write-transit-str [:enc (ldb/write-transit-str v)]))

;; Fails if, in `encrypt-tx-item`, `and` becomes `or`, `<=` becomes `<`, `if` becomes `if-not` or the body becomes `nil`.
(deftest encrypt-tx-data-encrypts-long-enough-vectors-with-encrypted-attrs-test
  (async done
         (finish
          (p/let [tx-data [[:db/add 1 :block/title "hello"]
                           [:db/add 1 :block/uuid "u"]
                           [:db/add 1 :block/name]
                           [:db/retract 1]
                           {:block/title "x"}]
                  {:keys [result]} (<crypted {} #(sync-crypt/<encrypt-tx-data :aes tx-data))]
            (is (= [[:db/add 1 :block/title (encrypted-value "hello")]
                    [:db/add 1 :block/uuid "u"]
                    [:db/add 1 :block/name]
                    [:db/retract 1]
                    {:block/title "x"}]
                   result)))
          done)))

;; Fails if, in `<decrypt-snapshot-row`, `when` becomes `when-not` or `some?` becomes `nil?`.
(deftest decrypt-snapshot-row-decrypts-the-keys-and-keeps-the-addresses-test
  (async done
         (finish
          (p/let [package (ldb/write-transit-str [:pkg])
                  content (ldb/write-transit-str {:keys [[1 :block/title package 5] [2 :block/uuid "u" 5]]})
                  decrypt (fn [_aes-key data]
                            (p/resolved (when (= [:pkg] data) (ldb/write-transit-str "plain"))))
                  row! (fn [raw-addresses]
                         (<crypted {:decrypt-text-if-encrypted decrypt}
                                   #(#'sync-crypt/<decrypt-snapshot-row :aes ["addr" content raw-addresses])))
                  with-addresses (row! "[1,2]")
                  without-addresses (row! nil)
                  parsed-with (ldb/read-transit-str (second (:result with-addresses)))
                  parsed-without (ldb/read-transit-str (second (:result without-addresses)))]
            (is (= "addr" (first (:result with-addresses))))
            (is (= "[1,2]" (nth (:result with-addresses) 2)))
            (is (= [[1 :block/title "plain" 5] [2 :block/uuid "u" 5]] (:keys parsed-with)))
            (is (= [1 2] (vec (:addresses parsed-with))))
            (is (= [[1 :block/title "plain" 5] [2 :block/uuid "u" 5]] (:keys parsed-without)))
            (is (false? (contains? parsed-without :addresses)))
            (is (nil? (nth (:result without-addresses) 2))))
          done)))

;; Fails if, in `<encrypt-datoms`, `if` becomes `if-not`, `empty?` becomes `seq`, `first` becomes `last`, `when` becomes `when-not` or the body becomes `nil`.
(deftest encrypt-datoms-encrypts-encrypted-attrs-in-batches-and-reports-progress-test
  (async done
         (finish
          (p/let [small [{:e 1 :a :block/title :v "hello" :t 1}
                         {:e 2 :a :block/uuid :v "u" :t 1}]
                  big (mapv (fn [i] {:e i :a :block/uuid :v "u" :t 1}) (range 5001))
                  progress* (atom [])
                  plain (<crypted {} #(sync-crypt/<encrypt-datoms :aes small))
                  batched (<crypted {} #(sync-crypt/<encrypt-datoms :aes big (fn [done-count total]
                                                                               (swap! progress* conj [done-count total]))))]
            (is (= [{:e 1 :a :block/title :v (encrypted-value "hello") :t 1}
                    {:e 2 :a :block/uuid :v "u" :t 1}]
                   (:result plain)))
            (is (true? (= big (:result batched))))
            (is (= [[5000 5001] [5001 5001]] @progress*)))
          done)))

;; ------------------------------------------------------- thread apis

;; Fails if, in `cancel-ui-requests!`, the body becomes `nil`.
(deftest cancel-ui-requests-cancels-every-request-in-flight-test
  (is (= {:ok true :cancelled 0} (sync-crypt/cancel-ui-requests! :context))))

;; Fails if, in `(top level)`, `when-not` becomes `when`, `when` becomes `when-not`, `and` becomes `or`, `:thread-api/get-user-rsa-key-pair` becomes `:thread-api/init-user-rsa-key-pair`, `:db-sync/missing-field` becomes `:db-sync/read-e2ee-password-native-failed`, the `:base` key is dropped, the `:public-key` key is dropped or the `:encrypted-private-key` key is dropped.
(deftest get-user-rsa-key-pair-thread-api-returns-only-the-key-strings-test
  (async done
         (finish
          (p/let [api (get @thread-api/*thread-apis :thread-api/get-user-rsa-key-pair)
                  call! (fn [env] (<crypted env #(api "token" "user")))
                  no-base (call! {:db-sync-config {}})
                  full (call! {:rsa-pair {:public-key "p" :encrypted-private-key "e" :extra 1}})
                  no-private (call! {:rsa-pair {:public-key "p"}})
                  no-public (call! {:rsa-pair {:encrypted-private-key "e"}})]
            (is (fn? api))
            (is (= ["missing-field" {:base nil}] (error-info (:result no-base))))
            (is (= {:public-key "p" :encrypted-private-key "e"} (:result full)))
            (is (nil? (:result no-private)))
            (is (nil? (:result no-public))))
          done)))

;; Fails if, in `<upload-user-rsa-key-pair!`, the body becomes `nil`, `:e2ee/user-keys` becomes `:e2ee/user-public-key`, the `:public-key` key is dropped or the `:encrypted-private-key` key is dropped.
(deftest upload-user-rsa-key-pair-coerces-the-public-and-private-key-test
  (async done
         (finish
          (p/let [{:keys [calls]} (<spied {:coerce-result {:public-key "pub" :encrypted-private-key "enc"}
                                           :fetch-result {}
                                           :auth-token "jwt" :jwt-sub "u"}
                                          #(sync-crypt/<upload-user-rsa-key-pair! sync-base "pub" "enc"))]
            (is (= [[:coerce :e2ee/user-keys {:public-key "pub" :encrypted-private-key "enc"}]]
                   (calls-of calls :coerce))))
          done)))
