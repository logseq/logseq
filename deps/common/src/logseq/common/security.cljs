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

;; Basic encryption utilities for sensitive data
;; Note: This is a basic implementation. For production use, consider using
;; established cryptographic libraries and proper key management.

(defn simple-xor-encrypt
  "Simple XOR encryption for basic obfuscation of sensitive data.
   NOT suitable for high-security requirements."
  [text key-str]
  (when (and text key-str)
    (let [key-bytes (.getBytes key-str "UTF-8")
          text-bytes (.getBytes text "UTF-8")
          encrypted (byte-array (count text-bytes))]
      (dotimes [i (count text-bytes)]
        (aset encrypted i
              (bit-xor (aget text-bytes i)
                      (aget key-bytes (mod i (count key-bytes))))))
      (.encodeToString (java.util.Base64/getEncoder) encrypted))))

(defn simple-xor-decrypt
  "Decrypt data encrypted with simple-xor-encrypt."
  [encrypted-text key-str]
  (when (and encrypted-text key-str)
    (try
      (let [encrypted-bytes (.decode (java.util.Base64/getDecoder) encrypted-text)
            key-bytes (.getBytes key-str "UTF-8")
            decrypted (byte-array (count encrypted-bytes))]
        (dotimes [i (count encrypted-bytes)]
          (aset decrypted i
                (bit-xor (aget encrypted-bytes i)
                        (aget key-bytes (mod i (count key-bytes))))))
        (String. decrypted "UTF-8"))
      (catch Exception _e
        nil))))

(defn hash-sensitive-data
  "Create a hash of sensitive data for comparison purposes.
   Uses SHA-256 for one-way hashing."
  [data]
  (when data
    (let [digest (java.security.MessageDigest/getInstance "SHA-256")
          bytes (.getBytes data "UTF-8")]
      (.update digest bytes)
      (let [hash-bytes (.digest digest)
            encoder (java.util.Base64/getEncoder)]
        (.encodeToString encoder hash-bytes)))))

(defn validate-encryption-key
  "Validate that an encryption key meets basic security requirements."
  [key]
  (and (string? key)
       (>= (count key) 16) ; Minimum 16 characters
       (<= (count key) 256) ; Maximum 256 characters
       (re-find #"[A-Z]" key) ; At least one uppercase
       (re-find #"[a-z]" key) ; At least one lowercase
       (re-find #"[0-9]" key) ; At least one digit
       (not (string/includes? key "password")) ; Avoid common weak keys
       (not (string/includes? key "123456"))))