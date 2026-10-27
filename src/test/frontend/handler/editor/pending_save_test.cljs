(ns frontend.handler.editor.pending-save-test
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [frontend.handler.editor.pending-save :as pending-save]
            [goog.object :as gobj]))

(use-fixtures :each {:before pending-save/clear-all!
                     :after pending-save/clear-all!})

(deftest persist-and-entries-round-trip-test
  (let [repo "logseq_db_pending"
        block-uuid #uuid "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa"]
    (pending-save/persist! repo block-uuid "draft title")
    (is (= [{:block-uuid block-uuid
             :title "draft title"}]
           (pending-save/entries repo)))
    (is (empty? (pending-save/entries "other-repo"))
        "Saves are scoped to the repo that created them")))

(deftest persist-overwrites-the-same-block-test
  (let [repo "logseq_db_pending"
        block-uuid #uuid "bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"]
    (pending-save/persist! repo block-uuid "first")
    (pending-save/persist! repo block-uuid "second")
    (is (= [{:block-uuid block-uuid
             :title "second"}]
           (pending-save/entries repo)))))

(deftest clear-if-match-only-drops-the-same-title-test
  (let [repo "logseq_db_pending"
        block-uuid #uuid "cccccccc-cccc-cccc-cccc-cccccccccccc"]
    (pending-save/persist! repo block-uuid "current")
    (pending-save/clear-if-match! repo block-uuid "stale")
    (is (= [{:block-uuid block-uuid
             :title "current"}]
           (pending-save/entries repo))
        "A later edit must not be cleared by an older save's ack")
    (pending-save/clear-if-match! repo block-uuid "current")
    (is (empty? (pending-save/entries repo)))))

(deftest persist-rejects-invalid-input-test
  (let [block-uuid #uuid "dddddddd-dddd-dddd-dddd-dddddddddddd"]
    (pending-save/persist! nil block-uuid "x")
    (pending-save/persist! "" block-uuid "x")
    (pending-save/persist! "repo" nil "x")
    (pending-save/persist! "repo" "not-a-uuid" "x")
    (pending-save/persist! "repo" block-uuid nil)
    (is (empty? (pending-save/snapshot)))))

(defn- with-mocked-session-storage
  [f]
  (let [items (atom {})
        old-storage (gobj/get js/globalThis "sessionStorage")
        had-storage? (.call (.-hasOwnProperty (.-prototype js/Object))
                            js/globalThis
                            "sessionStorage")
        mocked-storage #js {:getItem (fn [k] (get @items k))
                            :setItem (fn [k v] (swap! items assoc k v) nil)
                            :removeItem (fn [k] (swap! items dissoc k) nil)}]
    (js/Object.defineProperty js/globalThis
                              "sessionStorage"
                              #js {:value mocked-storage
                                   :configurable true
                                   :writable true})
    (try
      (pending-save/clear-all!)
      (f items)
      (finally
        (pending-save/clear-all!)
        (if had-storage?
          (js/Object.defineProperty js/globalThis
                                    "sessionStorage"
                                    #js {:value old-storage
                                         :configurable true
                                         :writable true})
          (js/Reflect.deleteProperty js/globalThis "sessionStorage"))))))

(deftest persist-survives-reload-via-session-storage-test
  (with-mocked-session-storage
    (fn [items]
      (let [repo "logseq_db_pending"
            block-uuid #uuid "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"]
        (pending-save/persist! repo block-uuid "kept-across-reload")
        (is (some? (get @items pending-save/storage-key))
            "The title is written to sessionStorage before the worker ack")
        (pending-save/reload-memory!)
        (is (= [{:block-uuid block-uuid
                 :title "kept-across-reload"}]
               (pending-save/entries repo))
            "A new page hydrates the in-flight title from sessionStorage")))))
