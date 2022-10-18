(ns frontend.test.fixtures
  (:require [datascript.core :as d]
            [frontend.config :as config]
            [logseq.db.schema :as db-schema]
            [frontend.db.conn :as conn]
            [frontend.db.react :as react]
            [frontend.fs.test-node :as test-node]
            [frontend.fs :as fs]
            [frontend.state :as state]
            [frontend.test.helper :as test-helper]
            [cljs.test :refer [async]]))

(defn load-test-env
  [f]
  (with-redefs [config/test? true] (f)))

(defn react-components
  [f]
  (reset! react/query-state {})
  (let [r (f)]
    (reset! react/query-state {})
    r))

(defn- reset-datascript
  [repo]
  (let [db-name (conn/datascript-db repo)
        db-conn (d/create-conn db-schema/schema)]
    (state/set-current-repo! repo)
    (swap! conn/conns assoc db-name db-conn)))

(defn reset-db
  [f]
  (let [repo test-helper/test-db]
    (reset-datascript repo)
    (let [r (f)]
      (reset-datascript repo) r)))

(let [get-fs-fn (atom nil)]
  (def redef-get-fs
    "Redef fs/get-fs to an implementation that is valid for node tests"
    {:before (fn []
               (async done
                      (reset! get-fs-fn fs/get-fs)
                      (set! fs/get-fs (constantly (test-node/->NodeTestfs)))
                      (done)))
     :after (fn [] (set! fs/get-fs @get-fs-fn))}))
