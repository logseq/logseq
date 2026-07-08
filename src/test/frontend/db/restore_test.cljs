(ns frontend.db.restore-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.db.conn :as db-conn]
            [frontend.db.restore :as db-restore]
            [frontend.persist-db :as persist-db]
            [frontend.state :as state]
            [logseq.db.frontend.schema :as db-schema]
            [promesa.core :as p]))

(deftest restore-graph-does-not-create-renderer-datascript-conn-test
  (async done
    (let [repo "logseq_db_restore_without_ui_conn"
          previous-state @state/state
          previous-conns @db-conn/conns
          events (atom [])
          current-repos (atom [])]
      (reset! db-conn/conns {})
      (p/with-redefs [persist-db/<fetch-init-data
                      (fn [repo' _opts]
                        (is (= repo repo'))
                        (p/resolved {:schema db-schema/schema
                                     :initial-data []}))
                      state/pub-event!
                      (fn [event]
                        (swap! events conj event)
                        (p/resolved nil))
                      state/set-current-repo!
                      (fn [repo']
                        (swap! current-repos conj repo')
                        (swap! state/state assoc :git/current-repo repo')
                        nil)]
        (-> (db-restore/restore-graph! repo)
            (p/then
             (fn [_]
               (is (= [repo] @current-repos))
               (is (= [[:graph/restored repo] [:ui/re-render-root]]
                      @events))
               (is (empty? @db-conn/conns)
                   "Restoring a graph must not create a renderer DataScript connection.")))
            (p/catch
             (fn [error]
               (is false (str error))))
            (p/finally
             (fn []
               (reset! state/state previous-state)
               (reset! db-conn/conns previous-conns)
               (done))))))))
