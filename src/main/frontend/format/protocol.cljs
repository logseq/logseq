(ns ^:no-doc frontend.format.protocol)

(defprotocol Format
  (toEdn [this content config])
  (toHtml [this content config references])
  (loaded? [this])
  (lazyLoad [this ok-handler])
  (exportMarkdown [this content config references])
  (exportOPML [this content config title references]))
