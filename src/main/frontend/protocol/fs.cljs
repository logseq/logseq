(ns frontend.protocol.fs)

(defprotocol Fs
  (load-directory! [this])
  (write-file! [this path content])
  (delete-file! [this path])
  (get-file-stats! [this path]))
