(ns frontend.db.rtc.debug-ui
  "Debug UI for rtc module"
  (:require [cljs.core.async :as async :refer [go]]
            [fipp.edn :as fipp]
            [frontend.db :as db]
            [frontend.worker.rtc.op-mem-layer :as op-mem-layer]
            [frontend.worker.rtc.ws :as ws]
            [frontend.handler.user :as user]
            [frontend.state :as state]
            [frontend.ui :as ui]
            [frontend.util :as util]
            [rum.core :as rum]
            [frontend.persist-db.browser :as db-browser]
            [promesa.core :as p]
            [cljs-bean.core :as bean]))

(defonce debug-state (atom nil))

(defn- stop
  []
  (let [^object worker @db-browser/*worker]
    (.rtc-stop worker))
  (reset! debug-state nil))

(defn- push-pending-ops
  []
  (let [^object worker @db-browser/*worker]
    (.rtc-push-pending-ops worker)))

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
                             (let [token (state/get-auth-id-token)
                                   ^object worker @db-browser/*worker]
                               (p/let [result (.rtc-get-graphs worker token)
                                       graph-list (bean/->clj result)]
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
                                       (let [token (state/get-auth-id-token)
                                             ^object worker @db-browser/*worker]
                                         (.rtc-start worker (state/get-current-repo) token)))})

       [:div.my-2.flex
        [:div.mr-2 (ui/button (str "send pending ops")
                              {:on-click (fn [] (push-pending-ops))})]
        [:div.mr-2 (ui/button (str "Toggle auto push updates("
                                   (if @(:*auto-push-client-ops? s)
                                     "ON" "OFF")
                                   ")")
                              {:on-click
                               (fn []
                                 (let [^object worker @db-browser/*worker]
                                   (p/let [result (.rtc-toggle-sync worker (state/get-current-repo))]
                                     (reset! (::auto-push-updates? state) result))))})]
        [:div (ui/button "stop" {:on-click (fn [] (stop))})]])
     (when (some? s)
       [:hr]
       [:div.flex.flex-row
        (ui/button "grant graph access to"
                   {:class "mr-2"
                    :on-click (fn []
                                (let [user-uuid (some-> @(::grant-access-to-user state) parse-uuid)
                                      user-email (when-not user-uuid @(::grant-access-to-user state))]
                                  (when-let [graph-uuid @(::graph-uuid state)]
                                    (let [^object worker @db-browser/*worker]
                                      (.rtc-grant-graph-access worker graph-uuid
                                                               (some-> user-uuid vector)
                                                               (some-> user-email vector))))))})

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
                              (when-let [repo @(::download-graph-to-repo state)]
                                (when-let [graph-uuid @(::graph-uuid-to-download state)]
                                  (prn :download-graph graph-uuid :to repo)
                                  (let [token (state/get-auth-id-token)
                                        ^object worker @db-browser/*worker]
                                    (.rtc-download-graph worker repo token graph-uuid)))))})
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
      (ui/button (str "upload current repo")
                 {:on-click (fn []
                              (let [repo (state/get-current-repo)
                                    token (state/get-auth-id-token)
                                    ^js worker @db-browser/*worker]
                                (.rtc-upload-graph worker repo token)))})]]))
