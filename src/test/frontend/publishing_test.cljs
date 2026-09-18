(ns frontend.publishing-test
  (:require [cljs.test :refer [async deftest is]]
            [frontend.handler.repo :as repo-handler]
            [frontend.handler.ui :as ui-handler]
            [frontend.persist-db :as persist-db]
            [frontend.publishing :as publishing]
            [frontend.state :as state]
            [promesa.core :as p]))

(def ^:private published-repo "logseq_db_published")

(defn- restore-window-db-state! [previous]
  (set! (.-logseq_db js/window) (:logseq-db previous))
  (set! (.-logseq_db_url js/window) (:logseq-db-url previous))
  (set! js/fetch (:fetch previous))
  (state/replace-state! (:state previous)))

(defn- capture-window-db-state []
  {:state (state/get-state)
   :logseq-db (.-logseq_db js/window)
   :logseq-db-url (.-logseq_db_url js/window)
   :fetch js/fetch})

(defn- stub-restore-deps!
  "Replace vars with set! so async restore continuations still see the stubs.
  p/with-redefs restores bindings when the first promise is returned, before
  fetch/open/reset-db run."
  [calls]
  (let [original {:open persist-db/<open-and-fetch-schema
                  :worker state/<invoke-db-worker
                  :restore repo-handler/restore-and-setup-repo!
                  :rerender ui-handler/re-render-root!}]
    (set! persist-db/<open-and-fetch-schema
          (fn [repo _opts]
            (swap! calls conj [:open repo])
            (p/resolved {:schema {}})))
    (set! state/<invoke-db-worker
          (fn [api repo payload]
            (swap! calls conj [:worker api repo payload])
            (p/resolved nil)))
    (set! repo-handler/restore-and-setup-repo!
          (fn [repo]
            (swap! calls conj [:restore repo])
            (p/resolved nil)))
    (set! ui-handler/re-render-root!
          (fn []
            (swap! calls conj [:rerender])))
    original))

(defn- restore-restore-deps! [original]
  (set! persist-db/<open-and-fetch-schema (:open original))
  (set! state/<invoke-db-worker (:worker original))
  (set! repo-handler/restore-and-setup-repo! (:restore original))
  (set! ui-handler/re-render-root! (:rerender original)))

(deftest restore-from-transit-str-loads-external-db-and-restores-once
  (async done
    (let [previous (capture-window-db-state)
          calls (atom [])
          original-deps (stub-restore-deps! calls)]
      (state/swap-state! assoc :config {published-repo {}})
      (set! (.-logseq_db_url js/window) "static/js/db.transit")
      (set! (.-logseq_db js/window) nil)
      (set! js/fetch
            (fn [url]
              (swap! calls conj [:fetch url])
              (p/resolved #js {:ok true
                               :text (fn []
                                       (p/resolved "external-transit-db"))})))
      (-> (publishing/restore-from-transit-str!)
          (p/then
           (fn [_]
             (is (= [[:fetch "static/js/db.transit"]
                     [:open published-repo]
                     [:worker :thread-api/reset-db published-repo "external-transit-db"]
                     [:restore published-repo]
                     [:rerender]]
                    @calls)
                 "Published apps must fetch the external graph, inject it once, then restore UI once.")))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (restore-restore-deps! original-deps)
             (restore-window-db-state! previous)
             (done)))))))

(deftest restore-from-transit-str-unescapes-legacy-inline-db-once
  (async done
    (let [previous (capture-window-db-state)
          calls (atom [])
          original-deps (stub-restore-deps! calls)]
      (state/swap-state! assoc :config {published-repo {}})
      (set! (.-logseq_db_url js/window) nil)
      (set! (.-logseq_db js/window) "inline-logseq____&amp;-db")
      (-> (publishing/restore-from-transit-str!)
          (p/then
           (fn [_]
             (is (= [[:open published-repo]
                     [:worker :thread-api/reset-db published-repo "inline-&-db"]
                     [:restore published-repo]
                     [:rerender]]
                    @calls)
                 "Legacy inline window.logseq_db still works, but restore-and-setup-repo! must run only once.")))
          (p/catch
           (fn [error]
             (is false (str error))))
          (p/finally
           (fn []
             (restore-restore-deps! original-deps)
             (restore-window-db-state! previous)
             (done)))))))
