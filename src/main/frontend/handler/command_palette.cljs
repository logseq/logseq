(ns frontend.handler.command-palette
  "System-component-like ns for command palette's functionality"
  (:require [cljs.spec.alpha :as s]
            [frontend.handler.plugin :as plugin-handler]
            [frontend.modules.shortcut.data-helper :as shortcut-helper]
            [frontend.spec :as spec]
            [frontend.state :as state]
            [frontend.storage :as storage]
            [lambdaisland.glogi :as log]))

(s/def :command/id keyword?)
(s/def :command/desc string?)
(s/def :command/action fn?)
(s/def :command/shortcut (s/or :nil nil? :keybinding string?))
(s/def :command/tag vector?)

(s/def :command/command
  (s/keys :req-un [:command/id :command/action]
          ;; :command/desc is optional for internal commands since view
          ;; checks translation ns first
          :opt-un [:command/desc :command/shortcut :command/tag :command/handler-id]))

(defn global-shortcut-commands []
  (->> [:shortcut.handler/editor-global
        :shortcut.handler/global-prevent-default
        :shortcut.handler/global-non-editing-only]
       (mapcat shortcut-helper/shortcuts->commands)))

(declare ensure-global-shortcut-commands!)

(defn get-commands []
  (ensure-global-shortcut-commands!)
  (->> (state/get-state :command-palette/commands)
       (sort-by :id)))

(defn get-commands-unique []
  (ensure-global-shortcut-commands!)
  (reduce #(assoc %1 (:id %2) %2) {}
          (state/get-state :command-palette/commands)))

(defn history
  ([] (or (try (storage/get "commands-history")
               (catch js/Error e
                 (log/error :commands-history e)))
          []))
  ([vals] (storage/set "commands-history" vals)))

(defn- assoc-invokes [cmds]
  (let [invokes (->> (history)
                     (map :id)
                     (frequencies))]
    (mapv (fn [{:keys [id] :as cmd}]
            (if (contains? invokes id)
              (assoc cmd :invokes-count (get invokes id))
              cmd))
          cmds)))

(defn add-history [{:keys [id]}]
  (storage/set "commands-history" (conj (history) {:id id :timestamp (.getTime (js/Date.))})))

(defn invoke-command [{:keys [id action] :as cmd}]
  (add-history cmd)
  (plugin-handler/hook-lifecycle-fn! id action))

(defn top-commands [limit]
  (->> (get-commands)
       (assoc-invokes)
       (sort-by :invokes-count)
       (reverse)
       (take limit)))

(defn register
  "Register a global command searchable by command palette.
  `id` is defined as a global unique namespaced key :scope/command-name
  `action` must be a zero arity function

  Example:
  ```clojure
  (register
   {:id :document/open-logseq-doc
    :desc \"Document: open Logseq documents\"
    :action (fn [] (js/window.open \"https://docs.logseq.com/\"))})
  ```

  To add i18n support, prefix `id` with command and put that item in dict.
  Example: {:zh-CN {:command.document/open-logseq-doc \"打开文档\"}}"
  [{:keys [id] :as command}]
  (if (:command/shortcut command)
    (log/error :shortcut/missing (str "Shortcut is missing for " (:id command)))
    (try
      (spec/validate :command/command command)
      (let [cmds (get-commands)]
        (if (some (fn [existing-cmd] (= (:id existing-cmd) id)) cmds)
          (log/error :command/register {:msg "Failed to register command. Command with same id already exist"
                                        :id  id})
          (state/set-state! :command-palette/commands
                            (conj (vec (state/get-state :command-palette/commands)) command))))
      ;; Catch unexpected errors so that subsequent register calls pass
      (catch :default e
        (log/error :command/register {:msg "Unexpectedly failed to register command"
                                      :id id
                                      :error (str e)})))))

(defn unregister
  [id]
  (let [id (keyword id)
        cmds (get-commands-unique)]
    (when (contains? cmds id)
      (state/set-state! :command-palette/commands (vec (vals (dissoc cmds id))))
      ;; clear history
      (history (filter #(not= (:id %) id) (history))))))

(defonce ^:private *global-shortcut-commands-registered? (atom false))

(defn- ensure-global-shortcut-commands!
  "Registers the commands of the global shortcuts, once, in one state update.
  Building them reads every shortcut's binding (~50 ms at startup), so app
  startup schedules this for when the renderer is idle, and any read of the
  commands before that (the palette, a plugin registering its own) runs it."
  []
  (when (compare-and-set! *global-shortcut-commands-registered? false true)
    (let [existing (state/get-state :command-palette/commands)
          new-cmds (reduce
                    (fn [acc {:keys [id] :as cmd}]
                      (try
                        (spec/validate :command/command cmd)
                        (if (contains? (:ids acc) id)
                          (do (log/error :command/register {:msg "Failed to register command. Command with same id already exist"
                                                            :id id})
                              acc)
                          (-> acc
                              (update :ids conj id)
                              (update :cmds conj cmd)))
                        (catch :default e
                          (log/error :command/register {:msg "Unexpectedly failed to register command"
                                                        :id id
                                                        :error (str e)})
                          acc)))
                    {:ids (set (map :id existing)) :cmds []}
                    (global-shortcut-commands))]
      (state/set-state! :command-palette/commands (into (vec existing) (:cmds new-cmds))))))

(defn register-global-shortcut-commands
  "Registers the global shortcuts' commands now (when not done yet)."
  []
  (ensure-global-shortcut-commands!))

(defn schedule-global-shortcut-commands!
  "Registers the global shortcuts' commands once the renderer is idle (at the
  latest after 2 s), off the path to the first screen."
  []
  (if (exists? js/requestIdleCallback)
    (js/requestIdleCallback ensure-global-shortcut-commands! #js {:timeout 2000})
    (js/setTimeout ensure-global-shortcut-commands! 0)))

(comment
  ;; register custom command example
  (register
   {:id :document/open-logseq-doc
    :desc "Document: open Logseq documents"
    :action (fn [] (js/window.open "https://docs.logseq.com/"))}))
