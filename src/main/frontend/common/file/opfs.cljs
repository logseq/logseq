(ns frontend.common.file.opfs
  "OPFS fs api"
  (:require [promesa.core :as p]))

(defn <write-text!
  "Write `text` to `filename` in Origin Private File System.
   Returns a promise."
  [filename text]
  (p/let [;; OPFS root dir
          root        (.. js/navigator -storage (getDirectory))
          ;; get (or create) a file handle
          file-handle (.getFileHandle root filename #js {:create true})
          ;; open a writable stream
          writable    (.createWritable file-handle)]
    ;; write string directly
    (.write writable text)
    ;; always close!
    (.close writable)))

(defn <read-text!
  "Read text content from `filename` in Origin Private File System (OPFS).
   Returns a promise that resolves to the file content string."
  [filename]
  (p/let [root        (.. js/navigator -storage (getDirectory))
          file-handle (.getFileHandle root filename)
          file        (.getFile file-handle)]
    (.text file)))

(comment
  (defn <delete-file!
    "Delete `filename` from Origin Private File System.
   Options:
   - :ignore-not-found? (default true) → don't treat missing file as error.

   Returns a promise that resolves to nil."
    [filename & {:keys [ignore-not-found?]
                 :or {ignore-not-found? true}}]
    (-> (p/let [root (.. js/navigator -storage (getDirectory))]
          (.removeEntry root filename))
        (p/catch (fn [err]
                   (if (and ignore-not-found?
                            (= (.-name err) "NotFoundError"))
                     nil
                     (throw err)))))))
