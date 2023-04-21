(ns ^:bb-compatible frontend.spec.storage
  "Specs for frontend.storage"
  #?(:cljs (:require [cljs.spec.alpha :as s])
     :default (:require [clojure.spec.alpha :as s])))

(s/def ::ls-right-sidebar-state map?)
(s/def ::ls-right-sidebar-width string?)
(s/def ::ls-left-sidebar-open? boolean?)
(s/def :ui/theme string?)
(s/def :ui/system-theme? boolean?)
(s/def ::lsp-core-enabled boolean?)
(s/def ::http-server-enabled boolean?)
(s/def ::instrument-disabled boolean?)
(s/def ::ls-pdf-area-is-dashed boolean?)
(s/def ::ls-pdf-hl-block-is-colored boolean?)
(s/def ::ls-pdf-viewer-theme string?)
(s/def :zotero/api-key-v2 map?)
(s/def :zotero/setting-profile string?)
(s/def ::commands-history (s/coll-of map?))
(s/def :ui/wide-mode boolean?)
(s/def :git/current-repo string?)
(s/def ::preferred-language string?)
(s/def ::developer-mode string?) ;; Funny string boolean
(s/def :document/mode? boolean?)
(s/def :ui/shortcut-tooltip? boolean?)
(s/def :copy/export-block-text-indent-style string?)
(s/def :copy/export-block-text-remove-options set?)
(s/def :copy/export-block-text-other-options map?)
;; Dynamic keys which aren't as easily validated:
;; :ls-pdf-last-page-*
;; :ls-js-allowed-*

;; Validates items that are stored in local storage. The validation is approximate here
;; e.g. we don't validate deeply into maps and collections.
;; The namespacing is inconsistent for this map. Sometimes we use keys without
;; namespaces and sometimes use orphaned namespaces. It would've been better
;; if all keys were namespaced with a unique name like this one
(s/def ::local-storage
  ;; All these keys are optional since we usually only validate one key at a time
  (s/keys
   :opt-un [::ls-right-sidebar-state
            ::ls-right-sidebar-width
            ::ls-left-sidebar-open?
            :ui/theme
            :ui/system-theme?
            ::lsp-core-enabled
            ::instrument-disabled
            ::ls-pdf-area-is-dashed
            ::ls-pdf-hl-block-is-colored
            ::ls-pdf-viewer-theme
            :zotero/api-key-v2
            :zotero/setting-profile
            ::commands-history
            :ui/wide-mode
            :git/current-repo
            ::preferred-language
            ::developer-mode
            :document/mode?
            :ui/shortcut-tooltip?
            :copy/export-block-text-indent-style
            :copy/export-block-text-remove-options
            :copy/export-block-text-other-options
            :file-sync/onboarding-state]))
