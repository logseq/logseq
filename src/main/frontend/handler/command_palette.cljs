(ns frontend.handler.command-palette
  (:require [cljs.spec.alpha :as s]
            [frontend.modules.shortcut.data-helper :as shortcut-helper]
            [frontend.spec :as spec]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]
            [frontend.storage :as storage]))

(s/def :command/id keyword?)
(s/def :command/desc string?)
(s/def :command/action (and fn?
                            ;; action fn expects zero number of arities
                            (fn [action] (zero? (.-length action)))))
(s/def :command/shortcut string?)

(s/def :command/command
  (s/keys :req-un [:command/id :command/desc :command/action]
          :opt-un [:command/shortcut]))

(defn global-shortcut-commands []
  (->> [:shortcut.handler/editor-global
        :shortcut.handler/global-prevent-default
        :shortcut.handler/global-non-editing-only]
       (mapcat shortcut-helper/shortcuts->commands)
       ;; some of the shortcut fn takes the shape of (fn [e] xx)
       ;; instead of (fn [] xx)
       ;; remove them for now
       (remove (fn [{:keys [action]}] (not (zero? (.-length action)))))))

(defn get-commands []
  (->> (get @state/state :command-palette/commands)
       (sort-by :id)))

(defn history []
  (or (storage/get "commands-history") []))

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

(defn invoke-command [{:keys [action] :as cmd}]
  (add-history cmd)
  (state/close-modal!)
  (action))

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
    :action (fn [] (js/window.open \"https://logseq.github.io/\"))})
  ```

  To add i18n support, prefix `id` with command and put that item in dict.
  Example: {:zh-CN {:command.document/open-logseq-doc \"打开文档\"}}"
  [{:keys [id] :as command}]
  (spec/validate :command/command command)
  (let [cmds (get-commands)]
    (if (some (fn [existing-cmd] (= (:id existing-cmd) id)) cmds)
      (log/error :command/register {:msg "Failed to register command. Command with same id already exist"
                                    :id  id})
      (state/set-state! :command-palette/commands (conj cmds command)))))

(defn register-global-shortcut-commands []
  (let [cmds (global-shortcut-commands)]
    (doseq [cmd cmds] (register cmd))))

(comment
  ;; register custom command example
  (register
   {:id :document/open-logseq-doc
    :desc "Document: open Logseq documents"
    :action (fn [] (js/window.open "https://logseq.github.io/"))}))
