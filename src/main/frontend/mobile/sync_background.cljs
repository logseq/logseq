(ns frontend.mobile.sync-background
  "Manages cloud sync while the mobile app is backgrounded"
  (:require [frontend.common.missionary :as c.m]
            [frontend.fs.sync :as fs-sync]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [frontend.util :as util]
            [lambdaisland.glogi :as log]
            [missionary.core :as m]
            [promesa.core :as p]))

(def ^:private background-sync-key :mobile/background-sync-running?)
(def ^:private background-sync-ts-key :mobile/background-sync-ts)

(defonce ^:private *background-task-running?
  (atom false))
(defonce ^:private *app-active?
  (atom true))
(defonce ^:private *network-connected?
  (atom true))

(defn on-app-state-change
  [active?]
  (reset! *app-active? (boolean active?))
  nil)

(defn on-network-change
  [connected?]
  (reset! *network-connected? (boolean connected?))
  nil)

(defn- background-sync-enabled?
  []
  (and (state/enable-sync?)
       (state/get-current-repo)
       (state/get-current-file-sync-graph-uuid)
       (not (state/sub [:graph/importing]))))

(defn- should-trigger?
  []
  (and (background-sync-enabled?)
       (false? @*app-active?)
       (true? @*network-connected?)
       (not @*background-task-running?)))

(defn- mark-running!
  [value]
  (reset! *background-task-running? value)
  (storage/set background-sync-key value)
  value)

(defn- start-sync!
  []
  (when (should-trigger?)
    (mark-running! true)
    (let [start-ts (.now js/Date)]
      (-> (p/let [_ (fs-sync/<sync-start)]
            (storage/set background-sync-ts-key start-ts))
          (p/catch (fn [e]
                     (log/warn :mobile/background-sync :error e)))
          (p/finally (fn []
                       (mark-running! false)))))))

(defn trigger!
  []
  (start-sync!))

(defn- install-global-trigger!
  []
  (when (and (exists? js/window)
             (nil? (.-logseqMobile ^js js/window)))
    (set! (.-logseqMobile ^js js/window) #js {}))
  (when-let [mobile (.-logseqMobile ^js js/window)]
    (when (nil? (.-backgroundSync mobile))
      (set! (.-backgroundSync mobile) #js {}))
    (aset mobile "backgroundSync" "trigger"
          (fn []
            (trigger!)))))

(defn init!
  []
  (when (and (util/mobile?) (not (util/web-platform?)))
    (install-global-trigger!)
    (when-let [running? (storage/get background-sync-key)]
      (reset! *background-task-running? (boolean running?)))
    (c.m/run-background-task
     ::mobile-background-sync-poller
     (m/reduce
      (fn [_ _]
        (start-sync!))
      (m/ap (m/? (m/sleep 300000)) true)))))
