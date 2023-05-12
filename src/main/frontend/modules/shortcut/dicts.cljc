(ns ^:bb-compatible frontend.modules.shortcut.dicts
  "Provides dictionary entries for shortcuts"
  (:require [frontend.dicts.zh-cn :as zh-CN]
            [frontend.dicts.zh-hant :as zh-Hant]
            [frontend.dicts.de :as de]
            [frontend.dicts.nl :as nl]
            [frontend.dicts.fr :as fr]
            [frontend.dicts.af :as af]
            [frontend.dicts.es :as es]
            [frontend.dicts.ru :as ru]
            [frontend.dicts.nb-no :as nb-NO]
            [frontend.dicts.pt-pt :as pt-PT]
            [frontend.dicts.pt-br :as pt-BR]
            [frontend.dicts.ja :as ja]
            [frontend.dicts.it :as it]
            [frontend.dicts.tr :as tr]
            [frontend.dicts.ko :as ko]
            [frontend.dicts.pl :as pl]
            [frontend.dicts.sk :as sk]
            [frontend.dicts.uk :as uk]
            [frontend.dicts.en :as en]))

(defn- decorate-namespace [k]
  (let [n (name k)
        ns (namespace k)]
    (keyword (str "command." ns) n)))

(def category
  {:shortcut.category/basics "Basics"
   :shortcut.category/formatting "Formatting"
   :shortcut.category/navigating "Navigation"
   :shortcut.category/block-editing "Block editing general"
   :shortcut.category/block-command-editing "Block command editing"
   :shortcut.category/block-selection "Block selection (press Esc to quit selection)"
   :shortcut.category/toggle "Toggle"
   :shortcut.category/whiteboard "Whiteboard"
   :shortcut.category/others "Others"})

(def ^:large-vars/data-var dicts
  {:en (merge
         ;; Dynamically add this ns since command descriptions have to
         ;; stay in sync with shortcut.config command ids which do not
         ;; have a namespace
        (update-keys en/shortcuts decorate-namespace)
        category)
   :zh-CN   zh-CN/shortcuts
   :zh-Hant zh-Hant/shortcuts
   :de      de/shortcuts
   :nl      nl/shortcuts
   :fr      fr/shortcuts
   :af      af/shortcuts
   :es      es/shortcuts
   :ru      ru/shortcuts
   :nb-NO   nb-NO/shortcuts
   :pt-PT   pt-PT/shortcuts
   :pt-BR   pt-BR/shortcuts
   :ja      ja/shortcuts
   :it      it/shortcuts
   :tr      tr/shortcuts
   :ko      ko/shortcuts
   :pl      pl/shortcuts
   :sk      sk/shortcuts
   :uk      uk/shortcuts})
