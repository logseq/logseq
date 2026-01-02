(ns logseq.common.security
  "Security utilities for path validation, input sanitization, and basic encryption"
  (:require [clojure.string :as string]
            [logseq.common.path :as path]))

(defn safe-path?
  "Check if a path is safe from directory traversal attacks.
   Returns true if path doesn't contain .. or absolute path patterns."
  [input-path]
  (and (string? input-path)
       (not (string/includes? input-path ".."))
       (not (string/starts-with? input-path "/"))
       (not (re-find #"^[a-zA-Z]:" input-path)) ; Windows drive letters
       (not (string/includes? input-path "\\")) ; Backslashes
       (<= (count input-path) 4096))) ; Reasonable path length limit

(defn sanitize-path
  "Sanitize a path by removing dangerous patterns and normalizing.
   Throws an exception if path appears malicious."
  [input-path]
  (when-not (safe-path? input-path)
    (throw (ex-info "Potentially dangerous path detected"
                    {:path input-path
                     :reason "Path contains traversal patterns or absolute references"})))
  (path/path-normalize input-path))

(defn validate-file-name
  "Validate a file name for security.
   Returns true if filename is safe to use."
  [file-name]
  (and (string? file-name)
       (path/safe-filename? file-name)
       (<= (count file-name) 255)
       (not (re-find #"[\u0000-\u001f\u0080-\u009f]" file-name)))) ; Control characters

(defn sanitize-file-name
  "Sanitize a filename by ensuring it's safe and within limits.
   Throws an exception if filename is dangerous."
  [file-name]
  (when-not (validate-file-name file-name)
    (throw (ex-info "Invalid or dangerous filename"
                    {:filename file-name
                     :reason "Filename contains invalid characters or exceeds limits"})))
  file-name)

(defn validate-input-string
  "Validate a string input for basic security constraints."
  [input max-length]
  (and (string? input)
       (<= (count input) max-length)
       (not (string/includes? input "\u0000")) ; Null bytes
       (not (re-find #"[\u0000-\u001f\u0080-\u009f]" input)))) ; Control characters

(defn sanitize-input-string
  "Sanitize a string input by trimming and validating."
  [input max-length]
  (when input
    (let [trimmed (string/trim input)]
      (when-not (validate-input-string trimmed max-length)
        (throw (ex-info "Invalid input string"
                        {:input input
                         :max-length max-length
                         :reason "Input exceeds length limit or contains invalid characters"})))
      trimmed)))
