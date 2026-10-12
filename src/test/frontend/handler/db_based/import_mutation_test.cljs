(ns frontend.handler.db-based.import-mutation-test
  (:require ["jszip" :as JSZip]
            [cljs.test :refer [async deftest is]]
            [frontend.config :as config]
            [frontend.context.i18n :as i18n]
            [frontend.fs :as fs]
            [frontend.handler.db-based.import :as import-handler]
            [frontend.handler.notification :as notification]
            [frontend.state :as state]
            [logseq.shui.ui :as shui]
            [promesa.core :as p]))

(defn- zip-file
  "A File-like object whose arrayBuffer is a zip of db.sqlite and 2 assets"
  []
  (let [zip (JSZip.)]
    (.file zip "db.sqlite" "sqlite bytes")
    (.file zip "assets/a.png" "a")
    (.file zip "assets/b.png" "b")
    #js {:arrayBuffer (fn [] (.generateAsync zip #js {:type "arraybuffer"}))}))

(defn- <import-zip!
  "Imports the zip with the worker side stubbed; resolves to the recorded calls."
  [failing-file-name]
  (let [calls (atom {:imports [] :states [] :notifications [] :writes [] :finished 0})]
    (p/let [_ (p/with-redefs [import-handler/import-from-sqlite-db!
                              (fn [_buffer graph-name ok]
                                (swap! calls update :imports conj graph-name)
                                (ok))
                              state/set-state!
                              (fn [k v & _] (swap! calls update :states conj [k v]) nil)
                              state/get-current-repo (constantly "logseq_db_imported")
                              config/get-repo-dir (constantly "/graph")
                              fs/mkdir-if-not-exists (fn [_] (p/resolved nil))
                              fs/write-asset-file!
                              (fn [_repo file-name _data]
                                (if (= file-name failing-file-name)
                                  (p/rejected (js/Error. "write failed"))
                                  (do (swap! calls update :writes conj file-name)
                                      (p/resolved nil))))
                              notification/show!
                              (fn [content status & _]
                                (swap! calls update :notifications conj [content status]) nil)
                              i18n/t (fn [k & args] (into [k] args))
                              shui/dialog-close! (fn [& _] nil)]
                (import-handler/import-from-sqlite-zip!
                 (zip-file) "imported" #(swap! calls update :finished inc)))]
      @calls)))

(deftest import-from-sqlite-zip-copies-every-asset-test
  (async done
    (-> (<import-zip! nil)
        (p/then
         (fn [{:keys [imports states notifications writes finished]}]
           (is (= ["imported"] imports) "the db.sqlite entry is imported")
           (is (= #{"a.png" "b.png"} (set writes)))
           (is (= [[:graph/importing :sqlite-zip]
                   [:graph/importing-state {:total 2 :current-idx 0 :current-page "Assets"}]
                   [:graph/importing-state {:total 2 :current-idx 1 :current-page "Assets"}]
                   [:graph/importing-state {:total 2 :current-idx 2 :current-page "Assets"}]
                   [:graph/importing nil]
                   [:graph/importing-state nil]]
                  states)
               "progress over the 2 asset files")
           (is (= [[[:import/assets-imported 2] :success]] notifications)
               "no skipped or partial warning when every asset is copied")
           (is (= 1 finished))))
        (p/catch (fn [e] (is false (str e))))
        (p/finally done))))

(deftest import-from-sqlite-zip-reports-a-skipped-asset-test
  (async done
    (-> (<import-zip! "b.png")
        (p/then
         (fn [{:keys [notifications writes finished]}]
           (is (= ["a.png"] writes))
           (is (= [[[:import/assets-imported 1] :success]
                   [[:import/assets-skipped 1] :warning]]
                  notifications))
           (is (= 1 finished))))
        (p/catch (fn [e] (is false (str e))))
        (p/finally done))))
