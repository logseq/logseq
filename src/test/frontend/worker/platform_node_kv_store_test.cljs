(ns frontend.worker.platform-node-kv-store-test
  "kv-store.json is shared by the workers of every open graph"
  (:require ["fs" :as fs]
            ["path" :as node-path]
            [cljs.test :refer [async deftest is]]
            [frontend.test.node-helper :as node-helper]
            [frontend.worker.platform.node :as platform-node]
            [promesa.core :as p]))

(defn- <kv
  "The kv-store of a new graph worker platform on root-dir"
  [root-dir]
  (p/let [platform (platform-node/node-platform {:root-dir root-dir})]
    (:kv platform)))

(deftest kv-store-keeps-keys-set-by-two-graph-workers-test
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-kv-store-workers")]
      (-> (p/let [kv-x (<kv root-dir)
                  kv-y (<kv root-dir)
                  ;; Both workers have read the file before either writes
                  _ ((:get kv-x) "any")
                  _ ((:get kv-y) "any")
                  _ ((:set! kv-x) "e2ee-password" "pw")
                  _ ((:set! kv-y) "aes-key###graph-y" "aes-y")
                  kv-reopened (<kv root-dir)
                  password ((:get kv-reopened) "e2ee-password")
                  aes-key ((:get kv-reopened) "aes-key###graph-y")
                  password-in-y ((:get kv-y) "e2ee-password")]
            (is (= "pw" password) "Graph Y's write keeps the password graph X saved")
            (is (= "aes-y" aes-key))
            (is (= "pw" password-in-y) "Graph Y's worker reads the password graph X saved"))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest kv-store-keeps-every-key-of-concurrent-writes-test
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-kv-store-concurrent")]
      (-> (p/let [kv (<kv root-dir)
                  _ (p/all (map #((:set! kv) (str "key-" %) %) (range 10)))
                  kv-reopened (<kv root-dir)
                  values (p/all (map #((:get kv-reopened) (str "key-" %)) (range 10)))]
            (is (= (range 10) values) "Every key written at once is in the file"))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest kv-store-write-leaves-no-temp-files-test
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-kv-store-tmp")]
      (-> (p/let [kv (<kv root-dir)
                  _ ((:set! kv) "k" "v")]
            (is (= ["kv-store.json"]
                   (filter #(re-find #"kv-store" %) (js->clj (fs/readdirSync root-dir))))
                "The write replaced kv-store.json and left no temp file")
            (is (fs/existsSync (node-path/join root-dir "kv-store.json"))))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest kv-store-keeps-every-key-of-overlapping-writers-test
  (async done
    ;; Each platform has its own kv-store, as the worker of each graph process
    ;; does, so only the lock file orders their writes
    (let [root-dir (node-helper/create-tmp-dir "platform-node-kv-store-writers")
          writer-keys (fn [writer] (map #(str "writer-" writer "-key-" %) (range 5)))]
      (-> (p/let [kvs (p/all (repeatedly 4 #(<kv root-dir)))
                  _ (p/all (for [[writer kv] (map-indexed vector kvs)
                                 k (writer-keys writer)]
                             ((:set! kv) k k)))
                  kv-reopened (<kv root-dir)
                  all-keys (mapcat writer-keys (range 4))
                  values (p/all (map (:get kv-reopened) all-keys))]
            (is (= all-keys values) "Every key of every writer is in the file")
            (is (not (fs/existsSync (node-path/join root-dir "kv-store.json.lock")))
                "The writers released the lock file"))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest kv-store-write-waits-for-a-held-lock-test
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-kv-store-held-lock")
          lock-path (node-path/join root-dir "kv-store.json.lock")]
      (-> (p/let [kv (<kv root-dir)
                  _ (fs/writeFileSync lock-path "other process")
                  ;; In a vector so that p/let does not wait for the write here
                  [write] [((:set! kv) "k" "v")]
                  _ (p/delay 200)
                  value-while-locked ((:get kv) "k")
                  _ (fs/rmSync lock-path)
                  _ write
                  value ((:get kv) "k")]
            (is (nil? value-while-locked) "The write waits while another process holds the lock")
            (is (= "v" value) "The write runs once the lock is released"))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))

(deftest kv-store-write-removes-a-stale-lock-test
  (async done
    (let [root-dir (node-helper/create-tmp-dir "platform-node-kv-store-stale-lock")
          lock-path (node-path/join root-dir "kv-store.json.lock")
          minute-ago (/ (- (js/Date.now) 60000) 1000)]
      (-> (p/let [kv (<kv root-dir)
                  _ (fs/writeFileSync lock-path "dead process")
                  _ (fs/utimesSync lock-path minute-ago minute-ago)
                  _ ((:set! kv) "k" "v")
                  value ((:get kv) "k")]
            (is (= "v" value) "A lock left by a dead process does not block the write"))
          (p/catch (fn [e]
                     (is false (str "unexpected error: " e))))
          (p/finally done)))))
