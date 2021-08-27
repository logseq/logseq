(ns frontend.handler.command-palette
  (:require [cljs.spec.alpha :as s]
            [frontend.modules.shortcut.data-helper :as shortcut-helper]
            [frontend.spec :as spec]
            [frontend.state :as state]
            [lambdaisland.glogi :as log]))

(s/def :command/id keyword?)
(s/def :command/desc string?)
(s/def :command/action fn?)
(s/def :command/shortcut string?)

(s/def :command/command
  (s/keys :req-un [:command/id :command/desc :command/action]
          :opt-un [:command/shortcut]))

(defn global-shortcut-commands []
  (->> [:shortcut.handler/editor-global
        :shortcut.handler/global-prevent-default
        :shortcut.handler/global-non-editing-only]
       (mapcat shortcut-helper/shortcuts->commands)))

(defn get-commands []
  (->> (get @state/state :command-palette/commands)
       (sort-by :id)))

(defn register [{:keys [id] :as command}]
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
