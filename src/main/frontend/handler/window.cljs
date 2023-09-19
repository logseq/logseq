(ns frontend.handler.window
  "Window management ns"
  (:require [electron.ipc :as ipc]))

(defn minimize!
  []
  (ipc/ipc "window-minimize"))

(defn toggle-maximized!
  []
  (ipc/ipc "window-toggle-maximized"))

(defn close!
  []
  (ipc/ipc "window-close"))

(defn toggle-fullscreen!
  []
  (ipc/ipc "window-toggle-fullscreen"))