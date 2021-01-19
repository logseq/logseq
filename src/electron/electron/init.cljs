(ns electron.init)

;;; FIXME: real world
(defn init-channel
  "init main process IPC channel wrapper"
  [^js win]
  (js/setInterval
   #(.. win -webContents (send "hello" "msg from Background :)"))
   3000))