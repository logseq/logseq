(ns frontend.db.rtc.debug-ui
  "Debug UI for rtc module"
  (:require-macros
   [frontend.db.rtc.macro :refer [with-sub-data-from-ws get-req-id get-result-ch]])
  (:require [cljs.core.async :as async :refer [<! go]]
            [fipp.edn :as fipp]
            [frontend.worker.async-util :include-macros true :refer [<? go-try]]
            [frontend.db :as db]
            [frontend.db.conn :as conn]
            [frontend.db.rtc.core :as rtc-core]
            [frontend.db.rtc.db-listener :as db-listener]
            [frontend.db.rtc.full-upload-download-graph :as full-upload-download-graph]
            [frontend.db.rtc.op-mem-layer :as op-mem-layer]
            [frontend.db.rtc.ws :as ws]
            [frontend.handler.notification :as notification]
            [frontend.handler.user :as user]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]))

(defonce debug-state (atom nil))

(defn- <start-rtc
  ([]
   (go
     (let [state (<! (rtc-core/<init-state))]
       (<! (<start-rtc state)))))
  ([state]
   (go
     (if (= :expired-token (:anom (ex-data state)))
       (prn ::<start-rtc state)
       (let [repo (state/get-current-repo)]
         (<! (<start-rtc state repo))))))
  ([state repo]
   (go
     (if-let [graph-uuid (op-mem-layer/get-graph-uuid repo)]
       (do (reset! debug-state state)
           (<! (rtc-core/<loop-for-rtc state graph-uuid repo (db/get-db repo false)))
           state)
       (do (notification/show! "not a rtc-graph" :error false)
           nil)))))

(defn- stop
  []
  (async/close! @(:*stop-rtc-loop-chan @debug-state))
  (reset! debug-state nil))

(defn- push-pending-ops
  []
  (async/put! (:force-push-client-ops-chan @debug-state) true))

(defn- <download-graph
  [repo graph-uuid]
  (go-try
   (let [state (<! (rtc-core/<init-state))]
     (<? (full-upload-download-graph/<download-graph state repo graph-uuid)))))

(defn- <upload-graph
  []
  (go
    (let [state (<! (rtc-core/<init-state))
          repo (state/get-current-repo)]
      (<! (full-upload-download-graph/<upload-graph state repo))
      (let [conn (conn/get-db repo false)]
        (db-listener/listen-db-to-generate-ops repo conn)))))

(rum/defcs ^:large-vars/cleanup-todo rtc-debug-ui <
  rum/reactive
  (rum/local nil ::graph-uuid)
  (rum/local nil ::local-tx)
  (rum/local nil ::unpushed-block-update-count)
  (rum/local nil ::ws-state)
  (rum/local nil ::download-graph-to-repo)
  (rum/local nil ::remote-graphs)
  (rum/local nil ::graph-uuid-to-download)
  (rum/local nil ::grant-access-to-user)
  (rum/local nil ::auto-push-updates?)
  [state]
  (let [s (rum/react debug-state)
        rtc-state (and s (rum/react (:*rtc-state s)))]
    [:div
     [:div.flex
      (ui/button "local-state"
                 :class "mr-2"
                 :icon "refresh"
                 :on-click (fn [_]
                             (go
                               (let [repo (state/get-current-repo)
                                     local-tx (op-mem-layer/get-local-tx repo)
                                     unpushed-block-update-count (op-mem-layer/get-unpushed-block-update-count repo)
                                     graph-uuid (op-mem-layer/get-graph-uuid repo)]
                                 (reset! (::local-tx state) local-tx)
                                 (reset! (::unpushed-block-update-count state) unpushed-block-update-count)
                                 (reset! (::graph-uuid state) graph-uuid)
                                 (reset! (::ws-state state) (and s (ws/get-state @(:*ws s))))
                                 (reset! (::auto-push-updates? state) (and s @(:*auto-push-client-ops? s)))))))
      (ui/button "graph-list"
                 :icon "refresh"
                 :on-click (fn [_]
                             (go
                               (let [s (or s (<! (rtc-core/<init-state)))
                                     graph-list (with-sub-data-from-ws s
                                                  (<! (ws/<send! s {:req-id (get-req-id)
                                                                    :action "list-graphs"}))
                                                  (:graphs (<! (get-result-ch))))]
                                 (reset! (::remote-graphs state) (map :graph-uuid graph-list))
                                 (reset! debug-state s)))))]

     [:pre.select-text
      (-> {:user-uuid (user/user-uuid)
           :graph @(::graph-uuid state)
           :rtc-state rtc-state
           :ws (and s (ws/get-state @(:*ws s)))
           :local-tx @(::local-tx state)
           :pending-block-update-count @(::unpushed-block-update-count state)
           :remote-graphs @(::remote-graphs state)
           :auto-push-updates? @(::auto-push-updates? state)
           :current-page (state/get-current-page)
           :blocks-count (when-let [page (state/get-current-page)]
                           (count (:block/_page (db/entity [:block/name (util/page-name-sanity-lc page)]))))}
          (fipp/pprint {:width 20})
          with-out-str)]
     (if (or (nil? s)
             (= :closed rtc-state))
       (ui/button "start" {:class "my-2"
                           :on-click (fn []
                                       (prn :start-rtc)
                                       (if s
                                         (<start-rtc s)
                                         (<start-rtc)))})

       [:div.my-2.flex
        [:div.mr-2 (ui/button (str "send pending ops")
                              {:on-click (fn [] (push-pending-ops))})]
        [:div.mr-2 (ui/button (str "Toggle auto push updates("
                                   (if @(:*auto-push-client-ops? s)
                                     "ON" "OFF")
                                   ")")
                              {:on-click
                               (fn []
                                 (go
                                   (<! (rtc-core/<toggle-auto-push-client-ops s))
                                   (reset! (::auto-push-updates? state) @(:*auto-push-client-ops? s))))})]
        [:div (ui/button "stop" {:on-click (fn [] (stop))})]])
     (when (some? s)
       [:hr]
       [:div.flex.flex-row
        (ui/button "grant graph access to"
                   {:class "mr-2"
                    :on-click (fn []
                                (go
                                  (let [user-uuid (some-> @(::grant-access-to-user state) parse-uuid)
                                        user-email (when-not user-uuid @(::grant-access-to-user state))]
                                    (when-let [graph-uuid @(::graph-uuid state)]
                                      (<! (rtc-core/<grant-graph-access-to-others
                                           s graph-uuid
                                           :target-user-uuids (some-> user-uuid vector)
                                           :target-user-emails (some-> user-email vector)))))))})

        [:input.form-input.my-2
         {:on-change (fn [e] (reset! (::grant-access-to-user state) (util/evalue e)))
          :on-focus (fn [e] (let [v (.-value (.-target e))]
                              (when (= v "input email or user-uuid here")
                                (set! (.-value (.-target e)) ""))))
          :default-value "input email or user-uuid here"}]])
     [:hr]
     [:div.flex.flex-row
      (ui/button (str "download graph to")
                 {:class "mr-2"
                  :on-click (fn []
                              (go
                                (when-let [repo @(::download-graph-to-repo state)]
                                  (when-let [graph-uuid @(::graph-uuid-to-download state)]
                                    (prn :download-graph graph-uuid :to repo)
                                    (try
                                      (<? (<download-graph repo graph-uuid))
                                      (notification/show! "download graph successfully")
                                      (catch :default e
                                        (notification/show! "download graph failed" :error)
                                        (prn ::download-graph-failed e)))))))})
      [:div.flex.flex-col
       [:select
        {:on-change (fn [e]
                      (let [value (util/evalue e)]
                        (reset! (::graph-uuid-to-download state) value)))}
        (if (seq @(::remote-graphs state))
          (cons [:option {:key "select a remote graph" :value nil} "select a remote graph"]
                (for [graph-uuid @(::remote-graphs state)]
                  [:option {:key graph-uuid :value graph-uuid} (str (subs graph-uuid 0 14) "...")]))
          (list [:option {:key "refresh-first" :value nil} "refresh remote-graphs first"]))]
       [:input.form-input.my-2
        {:on-change (fn [e] (reset! (::download-graph-to-repo state) (util/evalue e)))
         :on-focus (fn [e] (let [v (.-value (.-target e))]
                             (when (= v "repo name here")
                               (set! (.-value (.-target e)) ""))))
         :default-value "repo name here"}]]]
     [:div.flex.my-2
      (ui/button (str "upload current repo") {:on-click (fn []
                                                          (go
                                                            (<! (<upload-graph))
                                                            (notification/show! "upload graph successfully")))})]]))
