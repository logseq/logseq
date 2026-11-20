(ns frontend.handler.command-palette-startup-test
  "The global shortcuts' commands are registered after startup (when the
  renderer is idle), and any read of the commands before that registers them."
  (:require [cljs.test :refer [deftest is use-fixtures]]
            [frontend.handler.command-palette :as cp]
            [frontend.state :as state]))

(def ^:private *registered? @#'cp/*global-shortcut-commands-registered?)

(use-fixtures :each
  (fn [f]
    (let [commands (state/get-state :command-palette/commands)
          registered? @*registered?]
      (state/set-state! :command-palette/commands [])
      (reset! *registered? false)
      (f)
      (state/set-state! :command-palette/commands commands)
      (reset! *registered? registered?))))

(defn- ids [] (map :id (state/get-state :command-palette/commands)))

(deftest reading-the-commands-before-the-idle-registration-registers-the-global-ones
  (let [global-ids (set (map :id (cp/global-shortcut-commands)))]
    (is (seq global-ids))
    (is (empty? (ids)) "nothing is registered at startup itself")
    (is (= global-ids (set (map :id (cp/get-commands)))))
    (is (= global-ids (set (keys (cp/get-commands-unique)))))))

(deftest a-command-registered-first-keeps-its-place-next-to-the-global-ones
  (cp/register {:id :plugin/startup-test :action (fn [])})
  (let [global-ids (set (map :id (cp/global-shortcut-commands)))
        all (ids)]
    (is (= (inc (count global-ids)) (count all)))
    (is (= (count all) (count (distinct all))) "no command twice")
    (is (contains? (set all) :plugin/startup-test))))

(deftest registering-the-global-commands-again-adds-nothing
  (cp/register-global-shortcut-commands)
  (let [n (count (ids))]
    (cp/register-global-shortcut-commands)
    (cp/get-commands)
    (is (= n (count (ids))))
    (is (= n (count (distinct (ids)))))))
