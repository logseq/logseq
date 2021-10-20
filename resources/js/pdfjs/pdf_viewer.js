/**
 * @licstart The following is the entire license notice for the
 * Javascript code in this page
 *
 * Copyright 2021 Mozilla Foundation
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @licend The above is the entire license notice for the
 * Javascript code in this page
 */

(function webpackUniversalModuleDefinition (root, factory) {
  if (typeof exports === 'object' && typeof module === 'object')
    module.exports = factory()
  else if (typeof define === 'function' && define.amd)
    define('pdfjs-dist/web/pdf_viewer', [], factory)
  else if (typeof exports === 'object')
    exports['pdfjs-dist/web/pdf_viewer'] = factory()
  else
    root['pdfjs-dist/web/pdf_viewer'] = root.pdfjsViewer = factory()
})(this, function () {
  return /******/ (() => { // webpackBootstrap
    /******/
    'use strict'
    /******/
    var __webpack_modules__ = ([
      /* 0 */,
      /* 1 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.DefaultAnnotationLayerFactory = exports.AnnotationLayerBuilder = void 0

        var _pdfjsLib = __w_pdfjs_require__(2)

        var _l10n_utils = __w_pdfjs_require__(3)

        var _pdf_link_service = __w_pdfjs_require__(4)

        class AnnotationLayerBuilder {
          constructor ({
            pageDiv,
            pdfPage,
            linkService,
            downloadManager,
            annotationStorage = null,
            imageResourcesPath = '',
            renderInteractiveForms = true,
            l10n = _l10n_utils.NullL10n,
            enableScripting = false,
            hasJSActionsPromise = null,
            mouseState = null
          }) {
            this.pageDiv = pageDiv
            this.pdfPage = pdfPage
            this.linkService = linkService
            this.downloadManager = downloadManager
            this.imageResourcesPath = imageResourcesPath
            this.renderInteractiveForms = renderInteractiveForms
            this.l10n = l10n
            this.annotationStorage = annotationStorage
            this.enableScripting = enableScripting
            this._hasJSActionsPromise = hasJSActionsPromise
            this._mouseState = mouseState
            this.div = null
            this._cancelled = false
          }

          render (viewport, intent = 'display') {
            return Promise.all([this.pdfPage.getAnnotations({
              intent
            }), this._hasJSActionsPromise]).then(([annotations, hasJSActions = false]) => {
              if (this._cancelled) {
                return
              }

              if (annotations.length === 0) {
                return
              }

              const parameters = {
                viewport: viewport.clone({
                  dontFlip: true
                }),
                div: this.div,
                annotations,
                page: this.pdfPage,
                imageResourcesPath: this.imageResourcesPath,
                renderInteractiveForms: this.renderInteractiveForms,
                linkService: this.linkService,
                downloadManager: this.downloadManager,
                annotationStorage: this.annotationStorage,
                enableScripting: this.enableScripting,
                hasJSActions,
                mouseState: this._mouseState
              }

              if (this.div) {
                _pdfjsLib.AnnotationLayer.update(parameters)
              } else {
                this.div = document.createElement('div')
                this.div.className = 'annotationLayer'
                this.pageDiv.appendChild(this.div)
                parameters.div = this.div

                _pdfjsLib.AnnotationLayer.render(parameters)

                this.l10n.translate(this.div)
              }
            })
          }

          cancel () {
            this._cancelled = true
          }

          hide () {
            if (!this.div) {
              return
            }

            this.div.hidden = true
          }

        }

        exports.AnnotationLayerBuilder = AnnotationLayerBuilder

        class DefaultAnnotationLayerFactory {
          createAnnotationLayerBuilder (pageDiv, pdfPage, annotationStorage = null, imageResourcesPath = '', renderInteractiveForms = true, l10n = _l10n_utils.NullL10n, enableScripting = false, hasJSActionsPromise = null, mouseState = null) {
            return new AnnotationLayerBuilder({
              pageDiv,
              pdfPage,
              imageResourcesPath,
              renderInteractiveForms,
              linkService: new _pdf_link_service.SimpleLinkService(),
              l10n,
              annotationStorage,
              enableScripting,
              hasJSActionsPromise,
              mouseState
            })
          }

        }

        exports.DefaultAnnotationLayerFactory = DefaultAnnotationLayerFactory

        /***/
      }),
      /* 2 */
      /***/ ((module) => {

        let pdfjsLib

        if (typeof window !== 'undefined' && window['pdfjs-dist/build/pdf']) {
          pdfjsLib = window['pdfjs-dist/build/pdf']
        } else {
          pdfjsLib = require('../build/pdf.js')
        }

        module.exports = pdfjsLib

        /***/
      }),
      /* 3 */
      /***/ ((__unused_webpack_module, exports) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.getL10nFallback = getL10nFallback
        exports.NullL10n = void 0
        const DEFAULT_L10N_STRINGS = {
          of_pages: 'of {{pagesCount}}',
          page_of_pages: '({{pageNumber}} of {{pagesCount}})',
          document_properties_kb: '{{size_kb}} KB ({{size_b}} bytes)',
          document_properties_mb: '{{size_mb}} MB ({{size_b}} bytes)',
          document_properties_date_string: '{{date}}, {{time}}',
          document_properties_page_size_unit_inches: 'in',
          document_properties_page_size_unit_millimeters: 'mm',
          document_properties_page_size_orientation_portrait: 'portrait',
          document_properties_page_size_orientation_landscape: 'landscape',
          document_properties_page_size_name_a3: 'A3',
          document_properties_page_size_name_a4: 'A4',
          document_properties_page_size_name_letter: 'Letter',
          document_properties_page_size_name_legal: 'Legal',
          document_properties_page_size_dimension_string: '{{width}} × {{height}} {{unit}} ({{orientation}})',
          document_properties_page_size_dimension_name_string: '{{width}} × {{height}} {{unit}} ({{name}}, {{orientation}})',
          document_properties_linearized_yes: 'Yes',
          document_properties_linearized_no: 'No',
          print_progress_percent: '{{progress}}%',
          'toggle_sidebar.title': 'Toggle Sidebar',
          'toggle_sidebar_notification2.title': 'Toggle Sidebar (document contains outline/attachments/layers)',
          additional_layers: 'Additional Layers',
          page_landmark: 'Page {{page}}',
          thumb_page_title: 'Page {{page}}',
          thumb_page_canvas: 'Thumbnail of Page {{page}}',
          find_reached_top: 'Reached top of document, continued from bottom',
          find_reached_bottom: 'Reached end of document, continued from top',
          'find_match_count[one]': '{{current}} of {{total}} match',
          'find_match_count[other]': '{{current}} of {{total}} matches',
          'find_match_count_limit[one]': 'More than {{limit}} match',
          'find_match_count_limit[other]': 'More than {{limit}} matches',
          find_not_found: 'Phrase not found',
          error_version_info: 'PDF.js v{{version}} (build: {{build}})',
          error_message: 'Message: {{message}}',
          error_stack: 'Stack: {{stack}}',
          error_file: 'File: {{file}}',
          error_line: 'Line: {{line}}',
          rendering_error: 'An error occurred while rendering the page.',
          page_scale_width: 'Page Width',
          page_scale_fit: 'Page Fit',
          page_scale_auto: 'Automatic Zoom',
          page_scale_actual: 'Actual Size',
          page_scale_percent: '{{scale}}%',
          loading: 'Loading…',
          loading_error: 'An error occurred while loading the PDF.',
          invalid_file_error: 'Invalid or corrupted PDF file.',
          missing_file_error: 'Missing PDF file.',
          unexpected_response_error: 'Unexpected server response.',
          printing_not_supported: 'Warning: Printing is not fully supported by this browser.',
          printing_not_ready: 'Warning: The PDF is not fully loaded for printing.',
          web_fonts_disabled: 'Web fonts are disabled: unable to use embedded PDF fonts.'
        }

        function getL10nFallback (key, args) {
          switch (key) {
            case 'find_match_count':
              key = `find_match_count[${args.total === 1 ? 'one' : 'other'}]`
              break

            case 'find_match_count_limit':
              key = `find_match_count_limit[${args.limit === 1 ? 'one' : 'other'}]`
              break
          }

          return DEFAULT_L10N_STRINGS[key] || ''
        }

        function formatL10nValue (text, args) {
          if (!args) {
            return text
          }

          return text.replace(/\{\{\s*(\w+)\s*\}\}/g, (all, name) => {
            return name in args ? args[name] : '{{' + name + '}}'
          })
        }

        const NullL10n = {
          async getLanguage () {
            return 'en-us'
          },

          async getDirection () {
            return 'ltr'
          },

          async get (key, args = null, fallback = getL10nFallback(key, args)) {
            return formatL10nValue(fallback, args)
          },

          async translate (element) {}

        }
        exports.NullL10n = NullL10n

        /***/
      }),
      /* 4 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.SimpleLinkService = exports.PDFLinkService = void 0

        var _ui_utils = __w_pdfjs_require__(5)

        class PDFLinkService {
          constructor ({
            eventBus,
            externalLinkTarget = null,
            externalLinkRel = null,
            externalLinkEnabled = true,
            ignoreDestinationZoom = false
          } = {}) {
            this.eventBus = eventBus
            this.externalLinkTarget = externalLinkTarget
            this.externalLinkRel = externalLinkRel
            this.externalLinkEnabled = externalLinkEnabled
            this._ignoreDestinationZoom = ignoreDestinationZoom
            this.baseUrl = null
            this.pdfDocument = null
            this.pdfViewer = null
            this.pdfHistory = null
            this._pagesRefCache = null
          }

          setDocument (pdfDocument, baseUrl = null) {
            this.baseUrl = baseUrl
            this.pdfDocument = pdfDocument
            this._pagesRefCache = Object.create(null)
          }

          setViewer (pdfViewer) {
            this.pdfViewer = pdfViewer
          }

          setHistory (pdfHistory) {
            this.pdfHistory = pdfHistory
          }

          get pagesCount () {
            return this.pdfDocument ? this.pdfDocument.numPages : 0
          }

          get page () {
            return this.pdfViewer.currentPageNumber
          }

          set page (value) {
            this.pdfViewer.currentPageNumber = value
          }

          get rotation () {
            return this.pdfViewer.pagesRotation
          }

          set rotation (value) {
            this.pdfViewer.pagesRotation = value
          }

          navigateTo (dest) {
            console.error('Deprecated method: `navigateTo`, use `goToDestination` instead.')
            this.goToDestination(dest)
          }

          _goToDestinationHelper (rawDest, namedDest = null, explicitDest) {
            const destRef = explicitDest[0]
            let pageNumber

            if (destRef instanceof Object) {
              pageNumber = this._cachedPageNumber(destRef)

              if (pageNumber === null) {
                this.pdfDocument.getPageIndex(destRef).then(pageIndex => {
                  this.cachePageRef(pageIndex + 1, destRef)

                  this._goToDestinationHelper(rawDest, namedDest, explicitDest)
                }).catch(() => {
                  console.error(`PDFLinkService._goToDestinationHelper: "${destRef}" is not ` + `a valid page reference, for dest="${rawDest}".`)
                })
                return
              }
            } else if (Number.isInteger(destRef)) {
              pageNumber = destRef + 1
            } else {
              console.error(`PDFLinkService._goToDestinationHelper: "${destRef}" is not ` + `a valid destination reference, for dest="${rawDest}".`)
              return
            }

            if (!pageNumber || pageNumber < 1 || pageNumber > this.pagesCount) {
              console.error(`PDFLinkService._goToDestinationHelper: "${pageNumber}" is not ` + `a valid page number, for dest="${rawDest}".`)
              return
            }

            if (this.pdfHistory) {
              this.pdfHistory.pushCurrentPosition()
              this.pdfHistory.push({
                namedDest,
                explicitDest,
                pageNumber
              })
            }

            this.pdfViewer.scrollPageIntoView({
              pageNumber,
              destArray: explicitDest,
              ignoreDestinationZoom: this._ignoreDestinationZoom
            })
          }

          async goToDestination (dest) {
            if (!this.pdfDocument) {
              return
            }

            let namedDest, explicitDest

            if (typeof dest === 'string') {
              namedDest = dest
              explicitDest = await this.pdfDocument.getDestination(dest)
            } else {
              namedDest = null
              explicitDest = await dest
            }

            if (!Array.isArray(explicitDest)) {
              console.error(`PDFLinkService.goToDestination: "${explicitDest}" is not ` + `a valid destination array, for dest="${dest}".`)
              return
            }

            this._goToDestinationHelper(dest, namedDest, explicitDest)
          }

          goToPage (val) {
            if (!this.pdfDocument) {
              return
            }

            const pageNumber = typeof val === 'string' && this.pdfViewer.pageLabelToPageNumber(val) || val | 0

            if (!(Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber <= this.pagesCount)) {
              console.error(`PDFLinkService.goToPage: "${val}" is not a valid page.`)
              return
            }

            if (this.pdfHistory) {
              this.pdfHistory.pushCurrentPosition()
              this.pdfHistory.pushPage(pageNumber)
            }

            this.pdfViewer.scrollPageIntoView({
              pageNumber
            })
          }

          getDestinationHash (dest) {
            if (typeof dest === 'string') {
              if (dest.length > 0) {
                return this.getAnchorUrl('#' + escape(dest))
              }
            } else if (Array.isArray(dest)) {
              const str = JSON.stringify(dest)

              if (str.length > 0) {
                return this.getAnchorUrl('#' + escape(str))
              }
            }

            return this.getAnchorUrl('')
          }

          getAnchorUrl (anchor) {
            return (this.baseUrl || '') + anchor
          }

          setHash (hash) {
            if (!this.pdfDocument) {
              return
            }

            let pageNumber, dest

            if (hash.includes('=')) {
              const params = (0, _ui_utils.parseQueryString)(hash)

              if ('search' in params) {
                this.eventBus.dispatch('findfromurlhash', {
                  source: this,
                  query: params.search.replace(/"/g, ''),
                  phraseSearch: params.phrase === 'true'
                })
              }

              if ('page' in params) {
                pageNumber = params.page | 0 || 1
              }

              if ('zoom' in params) {
                const zoomArgs = params.zoom.split(',')
                const zoomArg = zoomArgs[0]
                const zoomArgNumber = parseFloat(zoomArg)

                if (!zoomArg.includes('Fit')) {
                  dest = [null, {
                    name: 'XYZ'
                  }, zoomArgs.length > 1 ? zoomArgs[1] | 0 : null, zoomArgs.length > 2 ? zoomArgs[2] | 0 : null, zoomArgNumber ? zoomArgNumber / 100 : zoomArg]
                } else {
                  if (zoomArg === 'Fit' || zoomArg === 'FitB') {
                    dest = [null, {
                      name: zoomArg
                    }]
                  } else if (zoomArg === 'FitH' || zoomArg === 'FitBH' || zoomArg === 'FitV' || zoomArg === 'FitBV') {
                    dest = [null, {
                      name: zoomArg
                    }, zoomArgs.length > 1 ? zoomArgs[1] | 0 : null]
                  } else if (zoomArg === 'FitR') {
                    if (zoomArgs.length !== 5) {
                      console.error('PDFLinkService.setHash: Not enough parameters for "FitR".')
                    } else {
                      dest = [null, {
                        name: zoomArg
                      }, zoomArgs[1] | 0, zoomArgs[2] | 0, zoomArgs[3] | 0, zoomArgs[4] | 0]
                    }
                  } else {
                    console.error(`PDFLinkService.setHash: "${zoomArg}" is not ` + 'a valid zoom value.')
                  }
                }
              }

              if (dest) {
                this.pdfViewer.scrollPageIntoView({
                  pageNumber: pageNumber || this.page,
                  destArray: dest,
                  allowNegativeOffset: true
                })
              } else if (pageNumber) {
                this.page = pageNumber
              }

              if ('pagemode' in params) {
                this.eventBus.dispatch('pagemode', {
                  source: this,
                  mode: params.pagemode
                })
              }

              if ('nameddest' in params) {
                this.goToDestination(params.nameddest)
              }
            } else {
              dest = unescape(hash)

              try {
                dest = JSON.parse(dest)

                if (!Array.isArray(dest)) {
                  dest = dest.toString()
                }
              } catch (ex) {}

              if (typeof dest === 'string' || isValidExplicitDestination(dest)) {
                this.goToDestination(dest)
                return
              }

              console.error(`PDFLinkService.setHash: "${unescape(hash)}" is not ` + 'a valid destination.')
            }
          }

          executeNamedAction (action) {
            switch (action) {
              case 'GoBack':
                if (this.pdfHistory) {
                  this.pdfHistory.back()
                }

                break

              case 'GoForward':
                if (this.pdfHistory) {
                  this.pdfHistory.forward()
                }

                break

              case 'NextPage':
                this.pdfViewer.nextPage()
                break

              case 'PrevPage':
                this.pdfViewer.previousPage()
                break

              case 'LastPage':
                this.page = this.pagesCount
                break

              case 'FirstPage':
                this.page = 1
                break

              default:
                break
            }

            this.eventBus.dispatch('namedaction', {
              source: this,
              action
            })
          }

          cachePageRef (pageNum, pageRef) {
            if (!pageRef) {
              return
            }

            const refStr = pageRef.gen === 0 ? `${pageRef.num}R` : `${pageRef.num}R${pageRef.gen}`
            this._pagesRefCache[refStr] = pageNum
          }

          _cachedPageNumber (pageRef) {
            const refStr = pageRef.gen === 0 ? `${pageRef.num}R` : `${pageRef.num}R${pageRef.gen}`
            return this._pagesRefCache?.[refStr] || null
          }

          isPageVisible (pageNumber) {
            return this.pdfViewer.isPageVisible(pageNumber)
          }

          isPageCached (pageNumber) {
            return this.pdfViewer.isPageCached(pageNumber)
          }

        }

        exports.PDFLinkService = PDFLinkService

        function isValidExplicitDestination (dest) {
          if (!Array.isArray(dest)) {
            return false
          }

          const destLength = dest.length

          if (destLength < 2) {
            return false
          }

          const page = dest[0]

          if (!(typeof page === 'object' && Number.isInteger(page.num) && Number.isInteger(page.gen)) && !(Number.isInteger(page) && page >= 0)) {
            return false
          }

          const zoom = dest[1]

          if (!(typeof zoom === 'object' && typeof zoom.name === 'string')) {
            return false
          }

          let allowNull = true

          switch (zoom.name) {
            case 'XYZ':
              if (destLength !== 5) {
                return false
              }

              break

            case 'Fit':
            case 'FitB':
              return destLength === 2

            case 'FitH':
            case 'FitBH':
            case 'FitV':
            case 'FitBV':
              if (destLength !== 3) {
                return false
              }

              break

            case 'FitR':
              if (destLength !== 6) {
                return false
              }

              allowNull = false
              break

            default:
              return false
          }

          for (let i = 2; i < destLength; i++) {
            const param = dest[i]

            if (!(typeof param === 'number' || allowNull && param === null)) {
              return false
            }
          }

          return true
        }

        class SimpleLinkService {
          constructor () {
            this.externalLinkTarget = null
            this.externalLinkRel = null
            this.externalLinkEnabled = true
            this._ignoreDestinationZoom = false
          }

          get pagesCount () {
            return 0
          }

          get page () {
            return 0
          }

          set page (value) {}

          get rotation () {
            return 0
          }

          set rotation (value) {}

          async goToDestination (dest) {}

          goToPage (val) {}

          getDestinationHash (dest) {
            return '#'
          }

          getAnchorUrl (hash) {
            return '#'
          }

          setHash (hash) {}

          executeNamedAction (action) {}

          cachePageRef (pageNum, pageRef) {}

          isPageVisible (pageNumber) {
            return true
          }

          isPageCached (pageNumber) {
            return true
          }

        }

        exports.SimpleLinkService = SimpleLinkService

        /***/
      }),
      /* 5 */
      /***/ ((__unused_webpack_module, exports) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.apiPageLayoutToSpreadMode = apiPageLayoutToSpreadMode
        exports.apiPageModeToSidebarView = apiPageModeToSidebarView
        exports.approximateFraction = approximateFraction
        exports.backtrackBeforeAllVisibleElements = backtrackBeforeAllVisibleElements
        exports.binarySearchFirstItem = binarySearchFirstItem
        exports.getActiveOrFocusedElement = getActiveOrFocusedElement
        exports.getOutputScale = getOutputScale
        exports.getPageSizeInches = getPageSizeInches
        exports.getVisibleElements = getVisibleElements
        exports.isPortraitOrientation = isPortraitOrientation
        exports.isValidRotation = isValidRotation
        exports.isValidScrollMode = isValidScrollMode
        exports.isValidSpreadMode = isValidSpreadMode
        exports.moveToEndOfArray = moveToEndOfArray
        exports.noContextMenuHandler = noContextMenuHandler
        exports.normalizeWheelEventDelta = normalizeWheelEventDelta
        exports.normalizeWheelEventDirection = normalizeWheelEventDirection
        exports.parseQueryString = parseQueryString
        exports.roundToDivide = roundToDivide
        exports.scrollIntoView = scrollIntoView
        exports.waitOnEventOrTimeout = waitOnEventOrTimeout
        exports.watchScroll = watchScroll
        exports.WaitOnType = exports.VERTICAL_PADDING = exports.UNKNOWN_SCALE = exports.TextLayerMode = exports.SpreadMode = exports.SidebarView = exports.ScrollMode = exports.SCROLLBAR_PADDING = exports.RendererType = exports.ProgressBar = exports.PresentationModeState = exports.MIN_SCALE = exports.MAX_SCALE = exports.MAX_AUTO_SCALE = exports.EventBus = exports.DEFAULT_SCALE_VALUE = exports.DEFAULT_SCALE = exports.CSS_UNITS = exports.AutoPrintRegExp = exports.animationStarted = void 0
        const CSS_UNITS = 96.0 / 72.0
        exports.CSS_UNITS = CSS_UNITS
        const DEFAULT_SCALE_VALUE = 'auto'
        exports.DEFAULT_SCALE_VALUE = DEFAULT_SCALE_VALUE
        const DEFAULT_SCALE = 1.0
        exports.DEFAULT_SCALE = DEFAULT_SCALE
        const MIN_SCALE = 0.1
        exports.MIN_SCALE = MIN_SCALE
        const MAX_SCALE = 10.0
        exports.MAX_SCALE = MAX_SCALE
        const UNKNOWN_SCALE = 0
        exports.UNKNOWN_SCALE = UNKNOWN_SCALE
        const MAX_AUTO_SCALE = 1.25
        exports.MAX_AUTO_SCALE = MAX_AUTO_SCALE
        const SCROLLBAR_PADDING = 40
        exports.SCROLLBAR_PADDING = SCROLLBAR_PADDING
        const VERTICAL_PADDING = 5
        exports.VERTICAL_PADDING = VERTICAL_PADDING
        const LOADINGBAR_END_OFFSET_VAR = '--loadingBar-end-offset'
        const PresentationModeState = {
          UNKNOWN: 0,
          NORMAL: 1,
          CHANGING: 2,
          FULLSCREEN: 3
        }
        exports.PresentationModeState = PresentationModeState
        const SidebarView = {
          UNKNOWN: -1,
          NONE: 0,
          THUMBS: 1,
          OUTLINE: 2,
          ATTACHMENTS: 3,
          LAYERS: 4
        }
        exports.SidebarView = SidebarView
        const RendererType = {
          CANVAS: 'canvas',
          SVG: 'svg'
        }
        exports.RendererType = RendererType
        const TextLayerMode = {
          DISABLE: 0,
          ENABLE: 1,
          ENABLE_ENHANCE: 2
        }
        exports.TextLayerMode = TextLayerMode
        const ScrollMode = {
          UNKNOWN: -1,
          VERTICAL: 0,
          HORIZONTAL: 1,
          WRAPPED: 2
        }
        exports.ScrollMode = ScrollMode
        const SpreadMode = {
          UNKNOWN: -1,
          NONE: 0,
          ODD: 1,
          EVEN: 2
        }
        exports.SpreadMode = SpreadMode
        const AutoPrintRegExp = /\bprint\s*\(/
        exports.AutoPrintRegExp = AutoPrintRegExp

        function getOutputScale (ctx) {
          const devicePixelRatio = window.devicePixelRatio || 1
          const backingStoreRatio = ctx.webkitBackingStorePixelRatio || ctx.mozBackingStorePixelRatio || ctx.backingStorePixelRatio || 1
          const pixelRatio = devicePixelRatio / backingStoreRatio
          return {
            sx: pixelRatio,
            sy: pixelRatio,
            scaled: pixelRatio !== 1
          }
        }

        function scrollIntoView (element, spot, skipOverflowHiddenElements = true) {
          let parent = element.offsetParent

          if (!parent) {
            console.error('offsetParent is not set -- cannot scroll')
            return
          }

          let offsetY = element.offsetTop + element.clientTop
          let offsetX = element.offsetLeft + element.clientLeft

          while (parent.clientHeight === parent.scrollHeight &&
                 parent.clientWidth === parent.scrollWidth ||
                 skipOverflowHiddenElements &&
                 getComputedStyle(parent).overflow === 'hidden') {
            if (parent.dataset._scaleY) {
              offsetY /= parent.dataset._scaleY
              offsetX /= parent.dataset._scaleX
            }

            offsetY += parent.offsetTop
            offsetX += parent.offsetLeft
            parent = parent.offsetParent

            if (!parent) {
              return
            }
          }

          if (spot) {
            if (spot.top !== undefined) {
              offsetY += spot.top
            }

            if (spot.left !== undefined) {
              offsetX += spot.left
              parent.scrollLeft = offsetX
            }
          }

          if (parent && parent.classList.contains('pdfViewer')) {
            parent = parent.parentElement
          }

          parent.scrollTop = offsetY
        }

        function watchScroll (viewAreaElement, callback) {
          const debounceScroll = function (evt) {
            if (rAF) {
              return
            }

            rAF = window.requestAnimationFrame(function viewAreaElementScrolled () {
              rAF = null
              const currentX = viewAreaElement.scrollLeft
              const lastX = state.lastX

              if (currentX !== lastX) {
                state.right = currentX > lastX
              }

              state.lastX = currentX
              const currentY = viewAreaElement.scrollTop
              const lastY = state.lastY

              if (currentY !== lastY) {
                state.down = currentY > lastY
              }

              state.lastY = currentY
              callback(state)
            })
          }

          const state = {
            right: true,
            down: true,
            lastX: viewAreaElement.scrollLeft,
            lastY: viewAreaElement.scrollTop,
            _eventHandler: debounceScroll
          }
          let rAF = null
          viewAreaElement.addEventListener('scroll', debounceScroll, true)
          return state
        }

        function parseQueryString (query) {
          const parts = query.split('&')
          const params = Object.create(null)

          for (let i = 0, ii = parts.length; i < ii; ++i) {
            const param = parts[i].split('=')
            const key = param[0].toLowerCase()
            const value = param.length > 1 ? param[1] : null
            params[decodeURIComponent(key)] = decodeURIComponent(value)
          }

          return params
        }

        function binarySearchFirstItem (items, condition) {
          let minIndex = 0
          let maxIndex = items.length - 1

          if (maxIndex < 0 || !condition(items[maxIndex])) {
            return items.length
          }

          if (condition(items[minIndex])) {
            return minIndex
          }

          while (minIndex < maxIndex) {
            const currentIndex = minIndex + maxIndex >> 1
            const currentItem = items[currentIndex]

            if (condition(currentItem)) {
              maxIndex = currentIndex
            } else {
              minIndex = currentIndex + 1
            }
          }

          return minIndex
        }

        function approximateFraction (x) {
          if (Math.floor(x) === x) {
            return [x, 1]
          }

          const xinv = 1 / x
          const limit = 8

          if (xinv > limit) {
            return [1, limit]
          } else if (Math.floor(xinv) === xinv) {
            return [1, xinv]
          }

          const x_ = x > 1 ? xinv : x
          let a = 0,
            b = 1,
            c = 1,
            d = 1

          while (true) {
            const p = a + c,
              q = b + d

            if (q > limit) {
              break
            }

            if (x_ <= p / q) {
              c = p
              d = q
            } else {
              a = p
              b = q
            }
          }

          let result

          if (x_ - a / b < c / d - x_) {
            result = x_ === x ? [a, b] : [b, a]
          } else {
            result = x_ === x ? [c, d] : [d, c]
          }

          return result
        }

        function roundToDivide (x, div) {
          const r = x % div
          return r === 0 ? x : Math.round(x - r + div)
        }

        function getPageSizeInches ({
          view,
          userUnit,
          rotate
        }) {
          const [x1, y1, x2, y2] = view
          const changeOrientation = rotate % 180 !== 0
          const width = (x2 - x1) / 72 * userUnit
          const height = (y2 - y1) / 72 * userUnit
          return {
            width: changeOrientation ? height : width,
            height: changeOrientation ? width : height
          }
        }

        function backtrackBeforeAllVisibleElements (index, views, top) {
          if (index < 2) {
            return index
          }

          let elt = views[index].div
          let pageTop = elt.offsetTop + elt.clientTop

          if (pageTop >= top) {
            elt = views[index - 1].div
            pageTop = elt.offsetTop + elt.clientTop
          }

          for (let i = index - 2; i >= 0; --i) {
            elt = views[i].div

            if (elt.offsetTop + elt.clientTop + elt.clientHeight <= pageTop) {
              break
            }

            index = i
          }

          return index
        }

        function getVisibleElements ({
          scrollEl,
          views,
          sortByVisibility = false,
          horizontal = false,
          rtl = false
        }) {
          const top = scrollEl.scrollTop,
            bottom = top + scrollEl.clientHeight
          const left = scrollEl.scrollLeft,
            right = left + scrollEl.clientWidth

          function isElementBottomAfterViewTop (view) {
            const element = view.div
            const elementBottom = element.offsetTop + element.clientTop + element.clientHeight
            return elementBottom > top
          }

          function isElementNextAfterViewHorizontally (view) {
            const element = view.div
            const elementLeft = element.offsetLeft + element.clientLeft
            const elementRight = elementLeft + element.clientWidth
            return rtl ? elementLeft < right : elementRight > left
          }

          const visible = [],
            numViews = views.length
          let firstVisibleElementInd = binarySearchFirstItem(views, horizontal ? isElementNextAfterViewHorizontally : isElementBottomAfterViewTop)

          if (firstVisibleElementInd > 0 && firstVisibleElementInd < numViews && !horizontal) {
            firstVisibleElementInd = backtrackBeforeAllVisibleElements(firstVisibleElementInd, views, top)
          }

          let lastEdge = horizontal ? right : -1

          for (let i = firstVisibleElementInd; i < numViews; i++) {
            const view = views[i],
              element = view.div
            const currentWidth = element.offsetLeft + element.clientLeft
            const currentHeight = element.offsetTop + element.clientTop
            const viewWidth = element.clientWidth,
              viewHeight = element.clientHeight
            const viewRight = currentWidth + viewWidth
            const viewBottom = currentHeight + viewHeight

            if (lastEdge === -1) {
              if (viewBottom >= bottom) {
                lastEdge = viewBottom
              }
            } else if ((horizontal ? currentWidth : currentHeight) > lastEdge) {
              break
            }

            if (viewBottom <= top || currentHeight >= bottom || viewRight <= left || currentWidth >= right) {
              continue
            }

            const hiddenHeight = Math.max(0, top - currentHeight) + Math.max(0, viewBottom - bottom)
            const hiddenWidth = Math.max(0, left - currentWidth) + Math.max(0, viewRight - right)
            const fractionHeight = (viewHeight - hiddenHeight) / viewHeight,
              fractionWidth = (viewWidth - hiddenWidth) / viewWidth
            const percent = fractionHeight * fractionWidth * 100 | 0
            visible.push({
              id: view.id,
              x: currentWidth,
              y: currentHeight,
              view,
              percent,
              widthPercent: fractionWidth * 100 | 0
            })
          }

          const first = visible[0],
            last = visible[visible.length - 1]

          if (sortByVisibility) {
            visible.sort(function (a, b) {
              const pc = a.percent - b.percent

              if (Math.abs(pc) > 0.001) {
                return -pc
              }

              return a.id - b.id
            })
          }

          return {
            first,
            last,
            views: visible
          }
        }

        function noContextMenuHandler (evt) {
          evt.preventDefault()
        }

        function normalizeWheelEventDirection (evt) {
          let delta = Math.hypot(evt.deltaX, evt.deltaY)
          const angle = Math.atan2(evt.deltaY, evt.deltaX)

          if (-0.25 * Math.PI < angle && angle < 0.75 * Math.PI) {
            delta = -delta
          }

          return delta
        }

        function normalizeWheelEventDelta (evt) {
          let delta = normalizeWheelEventDirection(evt)
          const MOUSE_DOM_DELTA_PIXEL_MODE = 0
          const MOUSE_DOM_DELTA_LINE_MODE = 1
          const MOUSE_PIXELS_PER_LINE = 30
          const MOUSE_LINES_PER_PAGE = 30

          if (evt.deltaMode === MOUSE_DOM_DELTA_PIXEL_MODE) {
            delta /= MOUSE_PIXELS_PER_LINE * MOUSE_LINES_PER_PAGE
          } else if (evt.deltaMode === MOUSE_DOM_DELTA_LINE_MODE) {
            delta /= MOUSE_LINES_PER_PAGE
          }

          return delta
        }

        function isValidRotation (angle) {
          return Number.isInteger(angle) && angle % 90 === 0
        }

        function isValidScrollMode (mode) {
          return Number.isInteger(mode) && Object.values(ScrollMode).includes(mode) && mode !== ScrollMode.UNKNOWN
        }

        function isValidSpreadMode (mode) {
          return Number.isInteger(mode) && Object.values(SpreadMode).includes(mode) && mode !== SpreadMode.UNKNOWN
        }

        function isPortraitOrientation (size) {
          return size.width <= size.height
        }

        const WaitOnType = {
          EVENT: 'event',
          TIMEOUT: 'timeout'
        }
        exports.WaitOnType = WaitOnType

        function waitOnEventOrTimeout ({
          target,
          name,
          delay = 0
        }) {
          return new Promise(function (resolve, reject) {
            if (typeof target !== 'object' || !(name && typeof name === 'string') || !(Number.isInteger(delay) && delay >= 0)) {
              throw new Error('waitOnEventOrTimeout - invalid parameters.')
            }

            function handler (type) {
              if (target instanceof EventBus) {
                target._off(name, eventHandler)
              } else {
                target.removeEventListener(name, eventHandler)
              }

              if (timeout) {
                clearTimeout(timeout)
              }

              resolve(type)
            }

            const eventHandler = handler.bind(null, WaitOnType.EVENT)

            if (target instanceof EventBus) {
              target._on(name, eventHandler)
            } else {
              target.addEventListener(name, eventHandler)
            }

            const timeoutHandler = handler.bind(null, WaitOnType.TIMEOUT)
            const timeout = setTimeout(timeoutHandler, delay)
          })
        }

        const animationStarted = new Promise(function (resolve) {
          window.requestAnimationFrame(resolve)
        })
        exports.animationStarted = animationStarted

        function dispatchDOMEvent (eventName, args = null) {
          throw new Error('Not implemented: dispatchDOMEvent')
        }

        class EventBus {
          constructor (options) {
            this._listeners = Object.create(null)
          }

          on (eventName, listener, options = null) {
            this._on(eventName, listener, {
              external: true,
              once: options?.once
            })
          }

          off (eventName, listener, options = null) {
            this._off(eventName, listener, {
              external: true,
              once: options?.once
            })
          }

          dispatch (eventName) {
            const eventListeners = this._listeners[eventName]

            if (!eventListeners || eventListeners.length === 0) {
              return
            }

            const args = Array.prototype.slice.call(arguments, 1)
            let externalListeners
            eventListeners.slice(0).forEach(({
              listener,
              external,
              once
            }) => {
              if (once) {
                this._off(eventName, listener)
              }

              if (external) {
                (externalListeners || (externalListeners = [])).push(listener)
                return
              }

              listener.apply(null, args)
            })

            if (externalListeners) {
              externalListeners.forEach(listener => {
                listener.apply(null, args)
              })
              externalListeners = null
            }
          }

          _on (eventName, listener, options = null) {
            var _this$_listeners

            const eventListeners = (_this$_listeners = this._listeners)[eventName] || (_this$_listeners[eventName] = [])
            eventListeners.push({
              listener,
              external: options?.external === true,
              once: options?.once === true
            })
          }

          _off (eventName, listener, options = null) {
            const eventListeners = this._listeners[eventName]

            if (!eventListeners) {
              return
            }

            for (let i = 0, ii = eventListeners.length; i < ii; i++) {
              if (eventListeners[i].listener === listener) {
                eventListeners.splice(i, 1)
                return
              }
            }
          }

        }

        exports.EventBus = EventBus

        function clamp (v, min, max) {
          return Math.min(Math.max(v, min), max)
        }

        class ProgressBar {
          constructor (id, {
            height,
            width,
            units
          } = {}) {
            this.visible = true
            this.div = document.querySelector(id + ' .progress')
            this.bar = this.div.parentNode
            this.height = height || 100
            this.width = width || 100
            this.units = units || '%'
            this.div.style.height = this.height + this.units
            this.percent = 0
          }

          _updateBar () {
            if (this._indeterminate) {
              this.div.classList.add('indeterminate')
              this.div.style.width = this.width + this.units
              return
            }

            this.div.classList.remove('indeterminate')
            const progressSize = this.width * this._percent / 100
            this.div.style.width = progressSize + this.units
          }

          get percent () {
            return this._percent
          }

          set percent (val) {
            this._indeterminate = isNaN(val)
            this._percent = clamp(val, 0, 100)

            this._updateBar()
          }

          setWidth (viewer) {
            if (!viewer) {
              return
            }

            const container = viewer.parentNode
            const scrollbarWidth = container.offsetWidth - viewer.offsetWidth

            if (scrollbarWidth > 0) {
              const doc = document.documentElement
              doc.style.setProperty(LOADINGBAR_END_OFFSET_VAR, `${scrollbarWidth}px`)
            }
          }

          hide () {
            if (!this.visible) {
              return
            }

            this.visible = false
            this.bar.classList.add('hidden')
          }

          show () {
            if (this.visible) {
              return
            }

            this.visible = true
            this.bar.classList.remove('hidden')
          }

        }

        exports.ProgressBar = ProgressBar

        function moveToEndOfArray (arr, condition) {
          const moved = [],
            len = arr.length
          let write = 0

          for (let read = 0; read < len; ++read) {
            if (condition(arr[read])) {
              moved.push(arr[read])
            } else {
              arr[write] = arr[read]
              ++write
            }
          }

          for (let read = 0; write < len; ++read, ++write) {
            arr[write] = moved[read]
          }
        }

        function getActiveOrFocusedElement () {
          let curRoot = document
          let curActiveOrFocused = curRoot.activeElement || curRoot.querySelector(':focus')

          while (curActiveOrFocused?.shadowRoot) {
            curRoot = curActiveOrFocused.shadowRoot
            curActiveOrFocused = curRoot.activeElement || curRoot.querySelector(':focus')
          }

          return curActiveOrFocused
        }

        function apiPageLayoutToSpreadMode (layout) {
          switch (layout) {
            case 'SinglePage':
            case 'OneColumn':
              return SpreadMode.NONE

            case 'TwoColumnLeft':
            case 'TwoPageLeft':
              return SpreadMode.ODD

            case 'TwoColumnRight':
            case 'TwoPageRight':
              return SpreadMode.EVEN
          }

          return SpreadMode.NONE
        }

        function apiPageModeToSidebarView (mode) {
          switch (mode) {
            case 'UseNone':
              return SidebarView.NONE

            case 'UseThumbs':
              return SidebarView.THUMBS

            case 'UseOutlines':
              return SidebarView.OUTLINE

            case 'UseAttachments':
              return SidebarView.ATTACHMENTS

            case 'UseOC':
              return SidebarView.LAYERS
          }

          return SidebarView.NONE
        }

        /***/
      }),
      /* 6 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.TextLayerBuilder = exports.DefaultTextLayerFactory = void 0

        var _pdfjsLib = __w_pdfjs_require__(2)

        const EXPAND_DIVS_TIMEOUT = 300

        class TextLayerBuilder {
          constructor ({
            textLayerDiv,
            eventBus,
            pageIndex,
            viewport,
            findController = null,
            enhanceTextSelection = false
          }) {
            this.textLayerDiv = textLayerDiv
            this.eventBus = eventBus
            this.textContent = null
            this.textContentItemsStr = []
            this.textContentStream = null
            this.renderingDone = false
            this.pageIdx = pageIndex
            this.pageNumber = this.pageIdx + 1
            this.matches = []
            this.viewport = viewport
            this.textDivs = []
            this.findController = findController
            this.textLayerRenderTask = null
            this.enhanceTextSelection = enhanceTextSelection
            this._onUpdateTextLayerMatches = null

            this._bindMouse()
          }

          _finishRendering () {
            this.renderingDone = true

            if (!this.enhanceTextSelection) {
              const endOfContent = document.createElement('div')
              endOfContent.className = 'endOfContent'
              this.textLayerDiv.appendChild(endOfContent)
            }

            this.eventBus.dispatch('textlayerrendered', {
              source: this,
              pageNumber: this.pageNumber,
              numTextDivs: this.textDivs.length
            })
          }

          render (timeout = 0) {
            if (!(this.textContent || this.textContentStream) || this.renderingDone) {
              return
            }

            this.cancel()
            this.textDivs = []
            const textLayerFrag = document.createDocumentFragment()
            this.textLayerRenderTask = (0, _pdfjsLib.renderTextLayer)({
              textContent: this.textContent,
              textContentStream: this.textContentStream,
              container: textLayerFrag,
              viewport: this.viewport,
              textDivs: this.textDivs,
              textContentItemsStr: this.textContentItemsStr,
              timeout,
              enhanceTextSelection: this.enhanceTextSelection
            })
            this.textLayerRenderTask.promise.then(() => {
              this.textLayerDiv.appendChild(textLayerFrag)

              this._finishRendering()

              this._updateMatches()
            }, function (reason) {})

            if (!this._onUpdateTextLayerMatches) {
              this._onUpdateTextLayerMatches = evt => {
                if (evt.pageIndex === this.pageIdx || evt.pageIndex === -1) {
                  this._updateMatches()
                }
              }

              this.eventBus._on('updatetextlayermatches', this._onUpdateTextLayerMatches)
            }
          }

          cancel () {
            if (this.textLayerRenderTask) {
              this.textLayerRenderTask.cancel()
              this.textLayerRenderTask = null
            }

            if (this._onUpdateTextLayerMatches) {
              this.eventBus._off('updatetextlayermatches', this._onUpdateTextLayerMatches)

              this._onUpdateTextLayerMatches = null
            }
          }

          setTextContentStream (readableStream) {
            this.cancel()
            this.textContentStream = readableStream
          }

          setTextContent (textContent) {
            this.cancel()
            this.textContent = textContent
          }

          _convertMatches (matches, matchesLength) {
            if (!matches) {
              return []
            }

            const {
              textContentItemsStr
            } = this
            let i = 0,
              iIndex = 0
            const end = textContentItemsStr.length - 1
            const result = []

            for (let m = 0, mm = matches.length; m < mm; m++) {
              let matchIdx = matches[m]

              while (i !== end && matchIdx >= iIndex + textContentItemsStr[i].length) {
                iIndex += textContentItemsStr[i].length
                i++
              }

              if (i === textContentItemsStr.length) {
                console.error('Could not find a matching mapping')
              }

              const match = {
                begin: {
                  divIdx: i,
                  offset: matchIdx - iIndex
                }
              }
              matchIdx += matchesLength[m]

              while (i !== end && matchIdx > iIndex + textContentItemsStr[i].length) {
                iIndex += textContentItemsStr[i].length
                i++
              }

              match.end = {
                divIdx: i,
                offset: matchIdx - iIndex
              }
              result.push(match)
            }

            return result
          }

          _renderMatches (matches) {
            if (matches.length === 0) {
              return
            }

            const {
              findController,
              pageIdx,
              textContentItemsStr,
              textDivs
            } = this
            const isSelectedPage = pageIdx === findController.selected.pageIdx
            const selectedMatchIdx = findController.selected.matchIdx
            const highlightAll = findController.state.highlightAll
            let prevEnd = null
            const infinity = {
              divIdx: -1,
              offset: undefined
            }

            function beginText (begin, className) {
              const divIdx = begin.divIdx
              textDivs[divIdx].textContent = ''
              appendTextToDiv(divIdx, 0, begin.offset, className)
            }

            function appendTextToDiv (divIdx, fromOffset, toOffset, className) {
              const div = textDivs[divIdx]
              const content = textContentItemsStr[divIdx].substring(fromOffset, toOffset)
              const node = document.createTextNode(content)

              if (className) {
                const span = document.createElement('span')
                span.className = className
                span.appendChild(node)
                div.appendChild(span)
                return
              }

              div.appendChild(node)
            }

            let i0 = selectedMatchIdx,
              i1 = i0 + 1

            if (highlightAll) {
              i0 = 0
              i1 = matches.length
            } else if (!isSelectedPage) {
              return
            }

            for (let i = i0; i < i1; i++) {
              const match = matches[i]
              const begin = match.begin
              const end = match.end
              const isSelected = isSelectedPage && i === selectedMatchIdx
              const highlightSuffix = isSelected ? ' selected' : ''

              if (isSelected) {
                findController.scrollMatchIntoView({
                  element: textDivs[begin.divIdx],
                  pageIndex: pageIdx,
                  matchIndex: selectedMatchIdx
                })
              }

              if (!prevEnd || begin.divIdx !== prevEnd.divIdx) {
                if (prevEnd !== null) {
                  appendTextToDiv(prevEnd.divIdx, prevEnd.offset, infinity.offset)
                }

                beginText(begin)
              } else {
                appendTextToDiv(prevEnd.divIdx, prevEnd.offset, begin.offset)
              }

              if (begin.divIdx === end.divIdx) {
                appendTextToDiv(begin.divIdx, begin.offset, end.offset, 'highlight' + highlightSuffix)
              } else {
                appendTextToDiv(begin.divIdx, begin.offset, infinity.offset, 'highlight begin' + highlightSuffix)

                for (let n0 = begin.divIdx + 1, n1 = end.divIdx; n0 < n1; n0++) {
                  textDivs[n0].className = 'highlight middle' + highlightSuffix
                }

                beginText(end, 'highlight end' + highlightSuffix)
              }

              prevEnd = end
            }

            if (prevEnd) {
              appendTextToDiv(prevEnd.divIdx, prevEnd.offset, infinity.offset)
            }
          }

          _updateMatches () {
            if (!this.renderingDone) {
              return
            }

            const {
              findController,
              matches,
              pageIdx,
              textContentItemsStr,
              textDivs
            } = this
            let clearedUntilDivIdx = -1

            for (let i = 0, ii = matches.length; i < ii; i++) {
              const match = matches[i]
              const begin = Math.max(clearedUntilDivIdx, match.begin.divIdx)

              for (let n = begin, end = match.end.divIdx; n <= end; n++) {
                const div = textDivs[n]
                div.textContent = textContentItemsStr[n]
                div.className = ''
              }

              clearedUntilDivIdx = match.end.divIdx + 1
            }

            if (!findController?.highlightMatches) {
              return
            }

            const pageMatches = findController.pageMatches[pageIdx] || null
            const pageMatchesLength = findController.pageMatchesLength[pageIdx] || null
            this.matches = this._convertMatches(pageMatches, pageMatchesLength)

            this._renderMatches(this.matches)
          }

          _bindMouse () {
            const div = this.textLayerDiv
            let expandDivsTimer = null
            div.addEventListener('mousedown', evt => {
              if (this.enhanceTextSelection && this.textLayerRenderTask) {
                this.textLayerRenderTask.expandTextDivs(true)

                if (expandDivsTimer) {
                  clearTimeout(expandDivsTimer)
                  expandDivsTimer = null
                }

                return
              }

              const end = div.querySelector('.endOfContent')

              if (!end) {
                return
              }

              let adjustTop = evt.target !== div
              adjustTop = adjustTop && window.getComputedStyle(end).getPropertyValue('-moz-user-select') !== 'none'

              if (adjustTop) {
                const divBounds = div.getBoundingClientRect()
                const r = Math.max(0, (evt.pageY - divBounds.top) / divBounds.height)
                end.style.top = (r * 100).toFixed(2) + '%'
              }

              end.classList.add('active')
            })
            div.addEventListener('mouseup', () => {
              if (this.enhanceTextSelection && this.textLayerRenderTask) {
                expandDivsTimer = setTimeout(() => {
                  if (this.textLayerRenderTask) {
                    this.textLayerRenderTask.expandTextDivs(false)
                  }

                  expandDivsTimer = null
                }, EXPAND_DIVS_TIMEOUT)
                return
              }

              const end = div.querySelector('.endOfContent')

              if (!end) {
                return
              }

              end.style.top = ''
              end.classList.remove('active')
            })
          }

        }

        exports.TextLayerBuilder = TextLayerBuilder

        class DefaultTextLayerFactory {
          createTextLayerBuilder (textLayerDiv, pageIndex, viewport, enhanceTextSelection = false, eventBus) {
            return new TextLayerBuilder({
              textLayerDiv,
              pageIndex,
              viewport,
              enhanceTextSelection,
              eventBus
            })
          }

        }

        exports.DefaultTextLayerFactory = DefaultTextLayerFactory

        /***/
      }),
      /* 7 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.DownloadManager = void 0

        var _pdfjsLib = __w_pdfjs_require__(2)

        var _viewer_compatibility = __w_pdfjs_require__(8)



        function download (blobUrl, filename) {
          const a = document.createElement('a')

          if (!a.click) {
            throw new Error('DownloadManager: "a.click()" is not supported.')
          }

          a.href = blobUrl
          a.target = '_parent'

          if ('download' in a) {
            a.download = filename
          }

          (document.body || document.documentElement).appendChild(a)
          a.click()
          a.remove()
        }

        class DownloadManager {
          constructor () {
            this._openBlobUrls = new WeakMap()
          }

          downloadUrl (url, filename) {
            if (!(0, _pdfjsLib.createValidAbsoluteUrl)(url, 'http://example.com')) {
              return
            }

            download(url + '#pdfjs.action=download', filename)
          }

          downloadData (data, filename, contentType) {
            const blobUrl = (0, _pdfjsLib.createObjectURL)(data, contentType, _viewer_compatibility.viewerCompatibilityParams.disableCreateObjectURL)
            download(blobUrl, filename)
          }

          openOrDownloadData (element, data, filename) {
            const isPdfData = (0, _pdfjsLib.isPdfFile)(filename)
            const contentType = isPdfData ? 'application/pdf' : ''

            if (isPdfData && !_viewer_compatibility.viewerCompatibilityParams.disableCreateObjectURL) {
              let blobUrl = this._openBlobUrls.get(element)

              if (!blobUrl) {
                blobUrl = URL.createObjectURL(new Blob([data], {
                  type: contentType
                }))

                this._openBlobUrls.set(element, blobUrl)
              }

              let viewerUrl
              viewerUrl = '?file=' + encodeURIComponent(blobUrl + '#' + filename)

              try {
                window.open(viewerUrl)
                return true
              } catch (ex) {
                console.error(`openOrDownloadData: ${ex}`)
                URL.revokeObjectURL(blobUrl)

                this._openBlobUrls.delete(element)
              }
            }

            this.downloadData(data, filename, contentType)
            return false
          }

          download (blob, url, filename, sourceEventType = 'download') {
            if (_viewer_compatibility.viewerCompatibilityParams.disableCreateObjectURL) {
              this.downloadUrl(url, filename)
              return
            }

            const blobUrl = URL.createObjectURL(blob)
            download(blobUrl, filename)
          }

        }

        exports.DownloadManager = DownloadManager

        /***/
      }),
      /* 8 */
      /***/ ((__unused_webpack_module, exports) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.viewerCompatibilityParams = void 0
        const compatibilityParams = Object.create(null)
        {
          const userAgent = typeof navigator !== 'undefined' && navigator.userAgent || ''
          const platform = typeof navigator !== 'undefined' && navigator.platform || ''
          const maxTouchPoints = typeof navigator !== 'undefined' && navigator.maxTouchPoints || 1
          const isAndroid = /Android/.test(userAgent)
          const isIOS = /\b(iPad|iPhone|iPod)(?=;)/.test(userAgent) || platform === 'MacIntel' && maxTouchPoints > 1
          const isIOSChrome = /CriOS/.test(userAgent);

          (function checkOnBlobSupport () {
            if (isIOSChrome) {
              compatibilityParams.disableCreateObjectURL = true
            }
          })();

          (function checkCanvasSizeLimitation () {
            if (isIOS || isAndroid) {
              compatibilityParams.maxCanvasPixels = 5242880
            }
          })()
        }
        const viewerCompatibilityParams = Object.freeze(compatibilityParams)
        exports.viewerCompatibilityParams = viewerCompatibilityParams

        /***/
      }),
      /* 9 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.GenericL10n = void 0

        __w_pdfjs_require__(10)

        var _l10n_utils = __w_pdfjs_require__(3)

        const webL10n = document.webL10n

        class GenericL10n {
          constructor (lang) {
            this._lang = lang
            this._ready = new Promise((resolve, reject) => {
              webL10n.setLanguage(lang, () => {
                resolve(webL10n)
              })
            })
          }

          async getLanguage () {
            const l10n = await this._ready
            return l10n.getLanguage()
          }

          async getDirection () {
            const l10n = await this._ready
            return l10n.getDirection()
          }

          async get (key, args = null, fallback = (0, _l10n_utils.getL10nFallback)(key, args)) {
            const l10n = await this._ready
            return l10n.get(key, args, fallback)
          }

          async translate (element) {
            const l10n = await this._ready
            return l10n.translate(element)
          }

        }

        exports.GenericL10n = GenericL10n

        /***/
      }),
      /* 10 */
      /***/ (() => {

        document.webL10n = function (window, document, undefined) {
          var gL10nData = {}
          var gTextData = ''
          var gTextProp = 'textContent'
          var gLanguage = ''
          var gMacros = {}
          var gReadyState = 'loading'
          var gAsyncResourceLoading = true

          function getL10nResourceLinks () {
            return document.querySelectorAll('link[type="application/l10n"]')
          }

          function getL10nDictionary () {
            var script = document.querySelector('script[type="application/l10n"]')
            return script ? JSON.parse(script.innerHTML) : null
          }

          function getTranslatableChildren (element) {
            return element ? element.querySelectorAll('*[data-l10n-id]') : []
          }

          function getL10nAttributes (element) {
            if (!element) return {}
            var l10nId = element.getAttribute('data-l10n-id')
            var l10nArgs = element.getAttribute('data-l10n-args')
            var args = {}

            if (l10nArgs) {
              try {
                args = JSON.parse(l10nArgs)
              } catch (e) {
                console.warn('could not parse arguments for #' + l10nId)
              }
            }

            return {
              id: l10nId,
              args: args
            }
          }

          function xhrLoadText (url, onSuccess, onFailure) {
            onSuccess = onSuccess || function _onSuccess (data) {}

            onFailure = onFailure || function _onFailure () {}

            var xhr = new XMLHttpRequest()
            xhr.open('GET', url, gAsyncResourceLoading)

            if (xhr.overrideMimeType) {
              xhr.overrideMimeType('text/plain; charset=utf-8')
            }

            xhr.onreadystatechange = function () {
              if (xhr.readyState == 4) {
                if (xhr.status == 200 || xhr.status === 0) {
                  onSuccess(xhr.responseText)
                } else {
                  onFailure()
                }
              }
            }

            xhr.onerror = onFailure
            xhr.ontimeout = onFailure

            try {
              xhr.send(null)
            } catch (e) {
              onFailure()
            }
          }

          function parseResource (href, lang, successCallback, failureCallback) {
            var baseURL = href.replace(/[^\/]*$/, '') || './'

            function evalString (text) {
              if (text.lastIndexOf('\\') < 0) return text
              return text.replace(/\\\\/g, '\\').replace(/\\n/g, '\n').replace(/\\r/g, '\r').replace(/\\t/g, '\t').replace(/\\b/g, '\b').replace(/\\f/g, '\f').replace(/\\{/g, '{').replace(/\\}/g, '}').replace(/\\"/g, '"').replace(/\\'/g, '\'')
            }

            function parseProperties (text, parsedPropertiesCallback) {
              var dictionary = {}
              var reBlank = /^\s*|\s*$/
              var reComment = /^\s*#|^\s*$/
              var reSection = /^\s*\[(.*)\]\s*$/
              var reImport = /^\s*@import\s+url\((.*)\)\s*$/i
              var reSplit = /^([^=\s]*)\s*=\s*(.+)$/

              function parseRawLines (rawText, extendedSyntax, parsedRawLinesCallback) {
                var entries = rawText.replace(reBlank, '').split(/[\r\n]+/)
                var currentLang = '*'
                var genericLang = lang.split('-', 1)[0]
                var skipLang = false
                var match = ''

                function nextEntry () {
                  while (true) {
                    if (!entries.length) {
                      parsedRawLinesCallback()
                      return
                    }

                    var line = entries.shift()
                    if (reComment.test(line)) continue

                    if (extendedSyntax) {
                      match = reSection.exec(line)

                      if (match) {
                        currentLang = match[1].toLowerCase()
                        skipLang = currentLang !== '*' && currentLang !== lang && currentLang !== genericLang
                        continue
                      } else if (skipLang) {
                        continue
                      }

                      match = reImport.exec(line)

                      if (match) {
                        loadImport(baseURL + match[1], nextEntry)
                        return
                      }
                    }

                    var tmp = line.match(reSplit)

                    if (tmp && tmp.length == 3) {
                      dictionary[tmp[1]] = evalString(tmp[2])
                    }
                  }
                }

                nextEntry()
              }

              function loadImport (url, callback) {
                xhrLoadText(url, function (content) {
                  parseRawLines(content, false, callback)
                }, function () {
                  console.warn(url + ' not found.')
                  callback()
                })
              }

              parseRawLines(text, true, function () {
                parsedPropertiesCallback(dictionary)
              })
            }

            xhrLoadText(href, function (response) {
              gTextData += response
              parseProperties(response, function (data) {
                for (var key in data) {
                  var id,
                    prop,
                    index = key.lastIndexOf('.')

                  if (index > 0) {
                    id = key.substring(0, index)
                    prop = key.substring(index + 1)
                  } else {
                    id = key
                    prop = gTextProp
                  }

                  if (!gL10nData[id]) {
                    gL10nData[id] = {}
                  }

                  gL10nData[id][prop] = data[key]
                }

                if (successCallback) {
                  successCallback()
                }
              })
            }, failureCallback)
          }

          function loadLocale (lang, callback) {
            if (lang) {
              lang = lang.toLowerCase()
            }

            callback = callback || function _callback () {}

            clear()
            gLanguage = lang
            var langLinks = getL10nResourceLinks()
            var langCount = langLinks.length

            if (langCount === 0) {
              var dict = getL10nDictionary()

              if (dict && dict.locales && dict.default_locale) {
                console.log('using the embedded JSON directory, early way out')
                gL10nData = dict.locales[lang]

                if (!gL10nData) {
                  var defaultLocale = dict.default_locale.toLowerCase()

                  for (var anyCaseLang in dict.locales) {
                    anyCaseLang = anyCaseLang.toLowerCase()

                    if (anyCaseLang === lang) {
                      gL10nData = dict.locales[lang]
                      break
                    } else if (anyCaseLang === defaultLocale) {
                      gL10nData = dict.locales[defaultLocale]
                    }
                  }
                }

                callback()
              } else {
                console.log('no resource to load, early way out')
              }

              gReadyState = 'complete'
              return
            }

            var onResourceLoaded = null
            var gResourceCount = 0

            onResourceLoaded = function () {
              gResourceCount++

              if (gResourceCount >= langCount) {
                callback()
                gReadyState = 'complete'
              }
            }

            function L10nResourceLink (link) {
              var href = link.href

              this.load = function (lang, callback) {
                parseResource(href, lang, callback, function () {
                  console.warn(href + ' not found.')
                  console.warn('"' + lang + '" resource not found')
                  gLanguage = ''
                  callback()
                })
              }
            }

            for (var i = 0; i < langCount; i++) {
              var resource = new L10nResourceLink(langLinks[i])
              resource.load(lang, onResourceLoaded)
            }
          }

          function clear () {
            gL10nData = {}
            gTextData = ''
            gLanguage = ''
          }

          function getPluralRules (lang) {
            var locales2rules = {
              'af': 3,
              'ak': 4,
              'am': 4,
              'ar': 1,
              'asa': 3,
              'az': 0,
              'be': 11,
              'bem': 3,
              'bez': 3,
              'bg': 3,
              'bh': 4,
              'bm': 0,
              'bn': 3,
              'bo': 0,
              'br': 20,
              'brx': 3,
              'bs': 11,
              'ca': 3,
              'cgg': 3,
              'chr': 3,
              'cs': 12,
              'cy': 17,
              'da': 3,
              'de': 3,
              'dv': 3,
              'dz': 0,
              'ee': 3,
              'el': 3,
              'en': 3,
              'eo': 3,
              'es': 3,
              'et': 3,
              'eu': 3,
              'fa': 0,
              'ff': 5,
              'fi': 3,
              'fil': 4,
              'fo': 3,
              'fr': 5,
              'fur': 3,
              'fy': 3,
              'ga': 8,
              'gd': 24,
              'gl': 3,
              'gsw': 3,
              'gu': 3,
              'guw': 4,
              'gv': 23,
              'ha': 3,
              'haw': 3,
              'he': 2,
              'hi': 4,
              'hr': 11,
              'hu': 0,
              'id': 0,
              'ig': 0,
              'ii': 0,
              'is': 3,
              'it': 3,
              'iu': 7,
              'ja': 0,
              'jmc': 3,
              'jv': 0,
              'ka': 0,
              'kab': 5,
              'kaj': 3,
              'kcg': 3,
              'kde': 0,
              'kea': 0,
              'kk': 3,
              'kl': 3,
              'km': 0,
              'kn': 0,
              'ko': 0,
              'ksb': 3,
              'ksh': 21,
              'ku': 3,
              'kw': 7,
              'lag': 18,
              'lb': 3,
              'lg': 3,
              'ln': 4,
              'lo': 0,
              'lt': 10,
              'lv': 6,
              'mas': 3,
              'mg': 4,
              'mk': 16,
              'ml': 3,
              'mn': 3,
              'mo': 9,
              'mr': 3,
              'ms': 0,
              'mt': 15,
              'my': 0,
              'nah': 3,
              'naq': 7,
              'nb': 3,
              'nd': 3,
              'ne': 3,
              'nl': 3,
              'nn': 3,
              'no': 3,
              'nr': 3,
              'nso': 4,
              'ny': 3,
              'nyn': 3,
              'om': 3,
              'or': 3,
              'pa': 3,
              'pap': 3,
              'pl': 13,
              'ps': 3,
              'pt': 3,
              'rm': 3,
              'ro': 9,
              'rof': 3,
              'ru': 11,
              'rwk': 3,
              'sah': 0,
              'saq': 3,
              'se': 7,
              'seh': 3,
              'ses': 0,
              'sg': 0,
              'sh': 11,
              'shi': 19,
              'sk': 12,
              'sl': 14,
              'sma': 7,
              'smi': 7,
              'smj': 7,
              'smn': 7,
              'sms': 7,
              'sn': 3,
              'so': 3,
              'sq': 3,
              'sr': 11,
              'ss': 3,
              'ssy': 3,
              'st': 3,
              'sv': 3,
              'sw': 3,
              'syr': 3,
              'ta': 3,
              'te': 3,
              'teo': 3,
              'th': 0,
              'ti': 4,
              'tig': 3,
              'tk': 3,
              'tl': 4,
              'tn': 3,
              'to': 0,
              'tr': 0,
              'ts': 3,
              'tzm': 22,
              'uk': 11,
              'ur': 3,
              've': 3,
              'vi': 0,
              'vun': 3,
              'wa': 4,
              'wae': 3,
              'wo': 0,
              'xh': 3,
              'xog': 3,
              'yo': 0,
              'zh': 0,
              'zu': 3
            }

            function isIn (n, list) {
              return list.indexOf(n) !== -1
            }

            function isBetween (n, start, end) {
              return start <= n && n <= end
            }

            var pluralRules = {
              '0': function (n) {
                return 'other'
              },
              '1': function (n) {
                if (isBetween(n % 100, 3, 10)) return 'few'
                if (n === 0) return 'zero'
                if (isBetween(n % 100, 11, 99)) return 'many'
                if (n == 2) return 'two'
                if (n == 1) return 'one'
                return 'other'
              },
              '2': function (n) {
                if (n !== 0 && n % 10 === 0) return 'many'
                if (n == 2) return 'two'
                if (n == 1) return 'one'
                return 'other'
              },
              '3': function (n) {
                if (n == 1) return 'one'
                return 'other'
              },
              '4': function (n) {
                if (isBetween(n, 0, 1)) return 'one'
                return 'other'
              },
              '5': function (n) {
                if (isBetween(n, 0, 2) && n != 2) return 'one'
                return 'other'
              },
              '6': function (n) {
                if (n === 0) return 'zero'
                if (n % 10 == 1 && n % 100 != 11) return 'one'
                return 'other'
              },
              '7': function (n) {
                if (n == 2) return 'two'
                if (n == 1) return 'one'
                return 'other'
              },
              '8': function (n) {
                if (isBetween(n, 3, 6)) return 'few'
                if (isBetween(n, 7, 10)) return 'many'
                if (n == 2) return 'two'
                if (n == 1) return 'one'
                return 'other'
              },
              '9': function (n) {
                if (n === 0 || n != 1 && isBetween(n % 100, 1, 19)) return 'few'
                if (n == 1) return 'one'
                return 'other'
              },
              '10': function (n) {
                if (isBetween(n % 10, 2, 9) && !isBetween(n % 100, 11, 19)) return 'few'
                if (n % 10 == 1 && !isBetween(n % 100, 11, 19)) return 'one'
                return 'other'
              },
              '11': function (n) {
                if (isBetween(n % 10, 2, 4) && !isBetween(n % 100, 12, 14)) return 'few'
                if (n % 10 === 0 || isBetween(n % 10, 5, 9) || isBetween(n % 100, 11, 14)) return 'many'
                if (n % 10 == 1 && n % 100 != 11) return 'one'
                return 'other'
              },
              '12': function (n) {
                if (isBetween(n, 2, 4)) return 'few'
                if (n == 1) return 'one'
                return 'other'
              },
              '13': function (n) {
                if (isBetween(n % 10, 2, 4) && !isBetween(n % 100, 12, 14)) return 'few'
                if (n != 1 && isBetween(n % 10, 0, 1) || isBetween(n % 10, 5, 9) || isBetween(n % 100, 12, 14)) return 'many'
                if (n == 1) return 'one'
                return 'other'
              },
              '14': function (n) {
                if (isBetween(n % 100, 3, 4)) return 'few'
                if (n % 100 == 2) return 'two'
                if (n % 100 == 1) return 'one'
                return 'other'
              },
              '15': function (n) {
                if (n === 0 || isBetween(n % 100, 2, 10)) return 'few'
                if (isBetween(n % 100, 11, 19)) return 'many'
                if (n == 1) return 'one'
                return 'other'
              },
              '16': function (n) {
                if (n % 10 == 1 && n != 11) return 'one'
                return 'other'
              },
              '17': function (n) {
                if (n == 3) return 'few'
                if (n === 0) return 'zero'
                if (n == 6) return 'many'
                if (n == 2) return 'two'
                if (n == 1) return 'one'
                return 'other'
              },
              '18': function (n) {
                if (n === 0) return 'zero'
                if (isBetween(n, 0, 2) && n !== 0 && n != 2) return 'one'
                return 'other'
              },
              '19': function (n) {
                if (isBetween(n, 2, 10)) return 'few'
                if (isBetween(n, 0, 1)) return 'one'
                return 'other'
              },
              '20': function (n) {
                if ((isBetween(n % 10, 3, 4) || n % 10 == 9) && !(isBetween(n % 100, 10, 19) || isBetween(n % 100, 70, 79) || isBetween(n % 100, 90, 99))) return 'few'
                if (n % 1000000 === 0 && n !== 0) return 'many'
                if (n % 10 == 2 && !isIn(n % 100, [12, 72, 92])) return 'two'
                if (n % 10 == 1 && !isIn(n % 100, [11, 71, 91])) return 'one'
                return 'other'
              },
              '21': function (n) {
                if (n === 0) return 'zero'
                if (n == 1) return 'one'
                return 'other'
              },
              '22': function (n) {
                if (isBetween(n, 0, 1) || isBetween(n, 11, 99)) return 'one'
                return 'other'
              },
              '23': function (n) {
                if (isBetween(n % 10, 1, 2) || n % 20 === 0) return 'one'
                return 'other'
              },
              '24': function (n) {
                if (isBetween(n, 3, 10) || isBetween(n, 13, 19)) return 'few'
                if (isIn(n, [2, 12])) return 'two'
                if (isIn(n, [1, 11])) return 'one'
                return 'other'
              }
            }
            var index = locales2rules[lang.replace(/-.*$/, '')]

            if (!(index in pluralRules)) {
              console.warn('plural form unknown for [' + lang + ']')
              return function () {
                return 'other'
              }
            }

            return pluralRules[index]
          }

          gMacros.plural = function (str, param, key, prop) {
            var n = parseFloat(param)
            if (isNaN(n)) return str
            if (prop != gTextProp) return str

            if (!gMacros._pluralRules) {
              gMacros._pluralRules = getPluralRules(gLanguage)
            }

            var index = '[' + gMacros._pluralRules(n) + ']'

            if (n === 0 && key + '[zero]' in gL10nData) {
              str = gL10nData[key + '[zero]'][prop]
            } else if (n == 1 && key + '[one]' in gL10nData) {
              str = gL10nData[key + '[one]'][prop]
            } else if (n == 2 && key + '[two]' in gL10nData) {
              str = gL10nData[key + '[two]'][prop]
            } else if (key + index in gL10nData) {
              str = gL10nData[key + index][prop]
            } else if (key + '[other]' in gL10nData) {
              str = gL10nData[key + '[other]'][prop]
            }

            return str
          }

          function getL10nData (key, args, fallback) {
            var data = gL10nData[key]

            if (!data) {
              console.warn('#' + key + ' is undefined.')

              if (!fallback) {
                return null
              }

              data = fallback
            }

            var rv = {}

            for (var prop in data) {
              var str = data[prop]
              str = substIndexes(str, args, key, prop)
              str = substArguments(str, args, key)
              rv[prop] = str
            }

            return rv
          }

          function substIndexes (str, args, key, prop) {
            var reIndex = /\{\[\s*([a-zA-Z]+)\(([a-zA-Z]+)\)\s*\]\}/
            var reMatch = reIndex.exec(str)
            if (!reMatch || !reMatch.length) return str
            var macroName = reMatch[1]
            var paramName = reMatch[2]
            var param

            if (args && paramName in args) {
              param = args[paramName]
            } else if (paramName in gL10nData) {
              param = gL10nData[paramName]
            }

            if (macroName in gMacros) {
              var macro = gMacros[macroName]
              str = macro(str, param, key, prop)
            }

            return str
          }

          function substArguments (str, args, key) {
            var reArgs = /\{\{\s*(.+?)\s*\}\}/g
            return str.replace(reArgs, function (matched_text, arg) {
              if (args && arg in args) {
                return args[arg]
              }

              if (arg in gL10nData) {
                return gL10nData[arg]
              }

              console.log('argument {{' + arg + '}} for #' + key + ' is undefined.')
              return matched_text
            })
          }

          function translateElement (element) {
            var l10n = getL10nAttributes(element)
            if (!l10n.id) return
            var data = getL10nData(l10n.id, l10n.args)

            if (!data) {
              console.warn('#' + l10n.id + ' is undefined.')
              return
            }

            if (data[gTextProp]) {
              if (getChildElementCount(element) === 0) {
                element[gTextProp] = data[gTextProp]
              } else {
                var children = element.childNodes
                var found = false

                for (var i = 0, l = children.length; i < l; i++) {
                  if (children[i].nodeType === 3 && /\S/.test(children[i].nodeValue)) {
                    if (found) {
                      children[i].nodeValue = ''
                    } else {
                      children[i].nodeValue = data[gTextProp]
                      found = true
                    }
                  }
                }

                if (!found) {
                  var textNode = document.createTextNode(data[gTextProp])
                  element.insertBefore(textNode, element.firstChild)
                }
              }

              delete data[gTextProp]
            }

            for (var k in data) {
              element[k] = data[k]
            }
          }

          function getChildElementCount (element) {
            if (element.children) {
              return element.children.length
            }

            if (typeof element.childElementCount !== 'undefined') {
              return element.childElementCount
            }

            var count = 0

            for (var i = 0; i < element.childNodes.length; i++) {
              count += element.nodeType === 1 ? 1 : 0
            }

            return count
          }

          function translateFragment (element) {
            element = element || document.documentElement
            var children = getTranslatableChildren(element)
            var elementCount = children.length

            for (var i = 0; i < elementCount; i++) {
              translateElement(children[i])
            }

            translateElement(element)
          }

          return {
            get: function (key, args, fallbackString) {
              var index = key.lastIndexOf('.')
              var prop = gTextProp

              if (index > 0) {
                prop = key.substring(index + 1)
                key = key.substring(0, index)
              }

              var fallback

              if (fallbackString) {
                fallback = {}
                fallback[prop] = fallbackString
              }

              var data = getL10nData(key, args, fallback)

              if (data && prop in data) {
                return data[prop]
              }

              return '{{' + key + '}}'
            },
            getData: function () {
              return gL10nData
            },
            getText: function () {
              return gTextData
            },
            getLanguage: function () {
              return gLanguage
            },
            setLanguage: function (lang, callback) {
              loadLocale(lang, function () {
                if (callback) callback()
              })
            },
            getDirection: function () {
              var rtlList = ['ar', 'he', 'fa', 'ps', 'ur']
              var shortCode = gLanguage.split('-', 1)[0]
              return rtlList.indexOf(shortCode) >= 0 ? 'rtl' : 'ltr'
            },
            translate: translateFragment,
            getReadyState: function () {
              return gReadyState
            },
            ready: function (callback) {
              if (!callback) {
                return
              } else if (gReadyState == 'complete' || gReadyState == 'interactive') {
                window.setTimeout(function () {
                  callback()
                })
              } else if (document.addEventListener) {
                document.addEventListener('localized', function once () {
                  document.removeEventListener('localized', once)
                  callback()
                })
              }
            }
          }
        }(window, document)

        /***/
      }),
      /* 11 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.PDFFindController = exports.FindState = void 0

        var _pdfjsLib = __w_pdfjs_require__(2)

        var _pdf_find_utils = __w_pdfjs_require__(12)

        var _ui_utils = __w_pdfjs_require__(5)

        const FindState = {
          FOUND: 0,
          NOT_FOUND: 1,
          WRAPPED: 2,
          PENDING: 3
        }
        exports.FindState = FindState
        const FIND_TIMEOUT = 250
        const MATCH_SCROLL_OFFSET_TOP = -50
        const MATCH_SCROLL_OFFSET_LEFT = -400
        const CHARACTERS_TO_NORMALIZE = {
          '\u2018': '\'',
          '\u2019': '\'',
          '\u201A': '\'',
          '\u201B': '\'',
          '\u201C': '"',
          '\u201D': '"',
          '\u201E': '"',
          '\u201F': '"',
          '\u00BC': '1/4',
          '\u00BD': '1/2',
          '\u00BE': '3/4'
        }
        let normalizationRegex = null

        function normalize (text) {
          if (!normalizationRegex) {
            const replace = Object.keys(CHARACTERS_TO_NORMALIZE).join('')
            normalizationRegex = new RegExp(`[${replace}]`, 'g')
          }

          let diffs = null
          const normalizedText = text.replace(normalizationRegex, function (ch, index) {
            const normalizedCh = CHARACTERS_TO_NORMALIZE[ch],
              diff = normalizedCh.length - ch.length

            if (diff !== 0) {
              (diffs || (diffs = [])).push([index, diff])
            }

            return normalizedCh
          })
          return [normalizedText, diffs]
        }

        function getOriginalIndex (matchIndex, diffs = null) {
          if (!diffs) {
            return matchIndex
          }

          let totalDiff = 0

          for (const [index, diff] of diffs) {
            const currentIndex = index + totalDiff

            if (currentIndex >= matchIndex) {
              break
            }

            if (currentIndex + diff > matchIndex) {
              totalDiff += matchIndex - currentIndex
              break
            }

            totalDiff += diff
          }

          return matchIndex - totalDiff
        }

        class PDFFindController {
          constructor ({
            linkService,
            eventBus
          }) {
            this._linkService = linkService
            this._eventBus = eventBus

            this._reset()

            eventBus._on('findbarclose', this._onFindBarClose.bind(this))
          }

          get highlightMatches () {
            return this._highlightMatches
          }

          get pageMatches () {
            return this._pageMatches
          }

          get pageMatchesLength () {
            return this._pageMatchesLength
          }

          get selected () {
            return this._selected
          }

          get state () {
            return this._state
          }

          setDocument (pdfDocument) {
            if (this._pdfDocument) {
              this._reset()
            }

            if (!pdfDocument) {
              return
            }

            this._pdfDocument = pdfDocument

            this._firstPageCapability.resolve()
          }

          executeCommand (cmd, state) {
            if (!state) {
              return
            }

            const pdfDocument = this._pdfDocument

            if (this._state === null || this._shouldDirtyMatch(cmd, state)) {
              this._dirtyMatch = true
            }

            this._state = state

            if (cmd !== 'findhighlightallchange') {
              this._updateUIState(FindState.PENDING)
            }

            this._firstPageCapability.promise.then(() => {
              if (!this._pdfDocument || pdfDocument && this._pdfDocument !== pdfDocument) {
                return
              }

              this._extractText()

              const findbarClosed = !this._highlightMatches
              const pendingTimeout = !!this._findTimeout

              if (this._findTimeout) {
                clearTimeout(this._findTimeout)
                this._findTimeout = null
              }

              if (cmd === 'find') {
                this._findTimeout = setTimeout(() => {
                  this._nextMatch()

                  this._findTimeout = null
                }, FIND_TIMEOUT)
              } else if (this._dirtyMatch) {
                this._nextMatch()
              } else if (cmd === 'findagain') {
                this._nextMatch()

                if (findbarClosed && this._state.highlightAll) {
                  this._updateAllPages()
                }
              } else if (cmd === 'findhighlightallchange') {
                if (pendingTimeout) {
                  this._nextMatch()
                } else {
                  this._highlightMatches = true
                }

                this._updateAllPages()
              } else {
                this._nextMatch()
              }
            })
          }

          scrollMatchIntoView ({
            element = null,
            pageIndex = -1,
            matchIndex = -1
          }) {
            if (!this._scrollMatches || !element) {
              return
            } else if (matchIndex === -1 || matchIndex !== this._selected.matchIdx) {
              return
            } else if (pageIndex === -1 || pageIndex !== this._selected.pageIdx) {
              return
            }

            this._scrollMatches = false
            const spot = {
              top: MATCH_SCROLL_OFFSET_TOP,
              left: MATCH_SCROLL_OFFSET_LEFT
            };
            (0, _ui_utils.scrollIntoView)(element, spot, true)
          }

          _reset () {
            this._highlightMatches = false
            this._scrollMatches = false
            this._pdfDocument = null
            this._pageMatches = []
            this._pageMatchesLength = []
            this._state = null
            this._selected = {
              pageIdx: -1,
              matchIdx: -1
            }
            this._offset = {
              pageIdx: null,
              matchIdx: null,
              wrapped: false
            }
            this._extractTextPromises = []
            this._pageContents = []
            this._pageDiffs = []
            this._matchesCountTotal = 0
            this._pagesToSearch = null
            this._pendingFindMatches = Object.create(null)
            this._resumePageIdx = null
            this._dirtyMatch = false
            clearTimeout(this._findTimeout)
            this._findTimeout = null
            this._firstPageCapability = (0, _pdfjsLib.createPromiseCapability)()
          }

          get _query () {
            if (this._state.query !== this._rawQuery) {
              this._rawQuery = this._state.query;
              [this._normalizedQuery] = normalize(this._state.query)
            }

            return this._normalizedQuery
          }

          _shouldDirtyMatch (cmd, state) {
            if (state.query !== this._state.query) {
              return true
            }

            switch (cmd) {
              case 'findagain':
                const pageNumber = this._selected.pageIdx + 1
                const linkService = this._linkService

                if (pageNumber >= 1 && pageNumber <= linkService.pagesCount && pageNumber !== linkService.page && !linkService.isPageVisible(pageNumber)) {
                  return true
                }

                return false

              case 'findhighlightallchange':
                return false
            }

            return true
          }

          _prepareMatches (matchesWithLength, matches, matchesLength) {
            function isSubTerm (currentIndex) {
              const currentElem = matchesWithLength[currentIndex]
              const nextElem = matchesWithLength[currentIndex + 1]

              if (currentIndex < matchesWithLength.length - 1 && currentElem.match === nextElem.match) {
                currentElem.skipped = true
                return true
              }

              for (let i = currentIndex - 1; i >= 0; i--) {
                const prevElem = matchesWithLength[i]

                if (prevElem.skipped) {
                  continue
                }

                if (prevElem.match + prevElem.matchLength < currentElem.match) {
                  break
                }

                if (prevElem.match + prevElem.matchLength >= currentElem.match + currentElem.matchLength) {
                  currentElem.skipped = true
                  return true
                }
              }

              return false
            }

            matchesWithLength.sort(function (a, b) {
              return a.match === b.match ? a.matchLength - b.matchLength : a.match - b.match
            })

            for (let i = 0, len = matchesWithLength.length; i < len; i++) {
              if (isSubTerm(i)) {
                continue
              }

              matches.push(matchesWithLength[i].match)
              matchesLength.push(matchesWithLength[i].matchLength)
            }
          }

          _isEntireWord (content, startIdx, length) {
            if (startIdx > 0) {
              const first = content.charCodeAt(startIdx)
              const limit = content.charCodeAt(startIdx - 1)

              if ((0, _pdf_find_utils.getCharacterType)(first) === (0, _pdf_find_utils.getCharacterType)(limit)) {
                return false
              }
            }

            const endIdx = startIdx + length - 1

            if (endIdx < content.length - 1) {
              const last = content.charCodeAt(endIdx)
              const limit = content.charCodeAt(endIdx + 1)

              if ((0, _pdf_find_utils.getCharacterType)(last) === (0, _pdf_find_utils.getCharacterType)(limit)) {
                return false
              }
            }

            return true
          }

          _calculatePhraseMatch (query, pageIndex, pageContent, pageDiffs, entireWord) {
            const matches = [],
              matchesLength = []
            const queryLen = query.length
            let matchIdx = -queryLen

            while (true) {
              matchIdx = pageContent.indexOf(query, matchIdx + queryLen)

              if (matchIdx === -1) {
                break
              }

              if (entireWord && !this._isEntireWord(pageContent, matchIdx, queryLen)) {
                continue
              }

              const originalMatchIdx = getOriginalIndex(matchIdx, pageDiffs),
                matchEnd = matchIdx + queryLen - 1,
                originalQueryLen = getOriginalIndex(matchEnd, pageDiffs) - originalMatchIdx + 1
              matches.push(originalMatchIdx)
              matchesLength.push(originalQueryLen)
            }

            this._pageMatches[pageIndex] = matches
            this._pageMatchesLength[pageIndex] = matchesLength
          }

          _calculateWordMatch (query, pageIndex, pageContent, pageDiffs, entireWord) {
            const matchesWithLength = []
            const queryArray = query.match(/\S+/g)

            for (let i = 0, len = queryArray.length; i < len; i++) {
              const subquery = queryArray[i]
              const subqueryLen = subquery.length
              let matchIdx = -subqueryLen

              while (true) {
                matchIdx = pageContent.indexOf(subquery, matchIdx + subqueryLen)

                if (matchIdx === -1) {
                  break
                }

                if (entireWord && !this._isEntireWord(pageContent, matchIdx, subqueryLen)) {
                  continue
                }

                const originalMatchIdx = getOriginalIndex(matchIdx, pageDiffs),
                  matchEnd = matchIdx + subqueryLen - 1,
                  originalQueryLen = getOriginalIndex(matchEnd, pageDiffs) - originalMatchIdx + 1
                matchesWithLength.push({
                  match: originalMatchIdx,
                  matchLength: originalQueryLen,
                  skipped: false
                })
              }
            }

            this._pageMatchesLength[pageIndex] = []
            this._pageMatches[pageIndex] = []

            this._prepareMatches(matchesWithLength, this._pageMatches[pageIndex], this._pageMatchesLength[pageIndex])
          }

          _calculateMatch (pageIndex) {
            let pageContent = this._pageContents[pageIndex]
            const pageDiffs = this._pageDiffs[pageIndex]
            let query = this._query
            const {
              caseSensitive,
              entireWord,
              phraseSearch
            } = this._state

            if (query.length === 0) {
              return
            }

            if (!caseSensitive) {
              pageContent = pageContent.toLowerCase()
              query = query.toLowerCase()
            }

            if (phraseSearch) {
              this._calculatePhraseMatch(query, pageIndex, pageContent, pageDiffs, entireWord)
            } else {
              this._calculateWordMatch(query, pageIndex, pageContent, pageDiffs, entireWord)
            }

            if (this._state.highlightAll) {
              this._updatePage(pageIndex)
            }

            if (this._resumePageIdx === pageIndex) {
              this._resumePageIdx = null

              this._nextPageMatch()
            }

            const pageMatchesCount = this._pageMatches[pageIndex].length

            if (pageMatchesCount > 0) {
              this._matchesCountTotal += pageMatchesCount

              this._updateUIResultsCount()
            }
          }

          _extractText () {
            if (this._extractTextPromises.length > 0) {
              return
            }

            let promise = Promise.resolve()

            for (let i = 0, ii = this._linkService.pagesCount; i < ii; i++) {
              const extractTextCapability = (0, _pdfjsLib.createPromiseCapability)()
              this._extractTextPromises[i] = extractTextCapability.promise
              promise = promise.then(() => {
                return this._pdfDocument.getPage(i + 1).then(pdfPage => {
                  return pdfPage.getTextContent({
                    normalizeWhitespace: true
                  })
                }).then(textContent => {
                  const textItems = textContent.items
                  const strBuf = []

                  for (let j = 0, jj = textItems.length; j < jj; j++) {
                    strBuf.push(textItems[j].str)
                  }

                  [this._pageContents[i], this._pageDiffs[i]] = normalize(strBuf.join(''))
                  extractTextCapability.resolve(i)
                }, reason => {
                  console.error(`Unable to get text content for page ${i + 1}`, reason)
                  this._pageContents[i] = ''
                  this._pageDiffs[i] = null
                  extractTextCapability.resolve(i)
                })
              })
            }
          }

          _updatePage (index) {
            if (this._scrollMatches && this._selected.pageIdx === index) {
              this._linkService.page = index + 1
            }

            this._eventBus.dispatch('updatetextlayermatches', {
              source: this,
              pageIndex: index
            })
          }

          _updateAllPages () {
            this._eventBus.dispatch('updatetextlayermatches', {
              source: this,
              pageIndex: -1
            })
          }

          _nextMatch () {
            const previous = this._state.findPrevious
            const currentPageIndex = this._linkService.page - 1
            const numPages = this._linkService.pagesCount
            this._highlightMatches = true

            if (this._dirtyMatch) {
              this._dirtyMatch = false
              this._selected.pageIdx = this._selected.matchIdx = -1
              this._offset.pageIdx = currentPageIndex
              this._offset.matchIdx = null
              this._offset.wrapped = false
              this._resumePageIdx = null
              this._pageMatches.length = 0
              this._pageMatchesLength.length = 0
              this._matchesCountTotal = 0

              this._updateAllPages()

              for (let i = 0; i < numPages; i++) {
                if (this._pendingFindMatches[i] === true) {
                  continue
                }

                this._pendingFindMatches[i] = true

                this._extractTextPromises[i].then(pageIdx => {
                  delete this._pendingFindMatches[pageIdx]

                  this._calculateMatch(pageIdx)
                })
              }
            }

            if (this._query === '') {
              this._updateUIState(FindState.FOUND)

              return
            }

            if (this._resumePageIdx) {
              return
            }

            const offset = this._offset
            this._pagesToSearch = numPages

            if (offset.matchIdx !== null) {
              const numPageMatches = this._pageMatches[offset.pageIdx].length

              if (!previous && offset.matchIdx + 1 < numPageMatches || previous && offset.matchIdx > 0) {
                offset.matchIdx = previous ? offset.matchIdx - 1 : offset.matchIdx + 1

                this._updateMatch(true)

                return
              }

              this._advanceOffsetPage(previous)
            }

            this._nextPageMatch()
          }

          _matchesReady (matches) {
            const offset = this._offset
            const numMatches = matches.length
            const previous = this._state.findPrevious

            if (numMatches) {
              offset.matchIdx = previous ? numMatches - 1 : 0

              this._updateMatch(true)

              return true
            }

            this._advanceOffsetPage(previous)

            if (offset.wrapped) {
              offset.matchIdx = null

              if (this._pagesToSearch < 0) {
                this._updateMatch(false)

                return true
              }
            }

            return false
          }

          _nextPageMatch () {
            if (this._resumePageIdx !== null) {
              console.error('There can only be one pending page.')
            }

            let matches = null

            do {
              const pageIdx = this._offset.pageIdx
              matches = this._pageMatches[pageIdx]

              if (!matches) {
                this._resumePageIdx = pageIdx
                break
              }
            } while (!this._matchesReady(matches))
          }

          _advanceOffsetPage (previous) {
            const offset = this._offset
            const numPages = this._linkService.pagesCount
            offset.pageIdx = previous ? offset.pageIdx - 1 : offset.pageIdx + 1
            offset.matchIdx = null
            this._pagesToSearch--

            if (offset.pageIdx >= numPages || offset.pageIdx < 0) {
              offset.pageIdx = previous ? numPages - 1 : 0
              offset.wrapped = true
            }
          }

          _updateMatch (found = false) {
            let state = FindState.NOT_FOUND
            const wrapped = this._offset.wrapped
            this._offset.wrapped = false

            if (found) {
              const previousPage = this._selected.pageIdx
              this._selected.pageIdx = this._offset.pageIdx
              this._selected.matchIdx = this._offset.matchIdx
              state = wrapped ? FindState.WRAPPED : FindState.FOUND

              if (previousPage !== -1 && previousPage !== this._selected.pageIdx) {
                this._updatePage(previousPage)
              }
            }

            this._updateUIState(state, this._state.findPrevious)

            if (this._selected.pageIdx !== -1) {
              this._scrollMatches = true

              this._updatePage(this._selected.pageIdx)
            }
          }

          _onFindBarClose (evt) {
            const pdfDocument = this._pdfDocument

            this._firstPageCapability.promise.then(() => {
              if (!this._pdfDocument || pdfDocument && this._pdfDocument !== pdfDocument) {
                return
              }

              if (this._findTimeout) {
                clearTimeout(this._findTimeout)
                this._findTimeout = null
              }

              if (this._resumePageIdx) {
                this._resumePageIdx = null
                this._dirtyMatch = true
              }

              this._updateUIState(FindState.FOUND)

              this._highlightMatches = false

              this._updateAllPages()
            })
          }

          _requestMatchesCount () {
            const {
              pageIdx,
              matchIdx
            } = this._selected
            let current = 0,
              total = this._matchesCountTotal

            if (matchIdx !== -1) {
              for (let i = 0; i < pageIdx; i++) {
                current += this._pageMatches[i]?.length || 0
              }

              current += matchIdx + 1
            }

            if (current < 1 || current > total) {
              current = total = 0
            }

            return {
              current,
              total
            }
          }

          _updateUIResultsCount () {
            this._eventBus.dispatch('updatefindmatchescount', {
              source: this,
              matchesCount: this._requestMatchesCount()
            })
          }

          _updateUIState (state, previous) {
            this._eventBus.dispatch('updatefindcontrolstate', {
              source: this,
              state,
              previous,
              matchesCount: this._requestMatchesCount(),
              rawQuery: this._state?.query ?? null
            })
          }

        }

        exports.PDFFindController = PDFFindController

        /***/
      }),
      /* 12 */
      /***/ ((__unused_webpack_module, exports) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.getCharacterType = getCharacterType
        exports.CharacterType = void 0
        const CharacterType = {
          SPACE: 0,
          ALPHA_LETTER: 1,
          PUNCT: 2,
          HAN_LETTER: 3,
          KATAKANA_LETTER: 4,
          HIRAGANA_LETTER: 5,
          HALFWIDTH_KATAKANA_LETTER: 6,
          THAI_LETTER: 7
        }
        exports.CharacterType = CharacterType

        function isAlphabeticalScript (charCode) {
          return charCode < 0x2e80
        }

        function isAscii (charCode) {
          return (charCode & 0xff80) === 0
        }

        function isAsciiAlpha (charCode) {
          return charCode >= 0x61 && charCode <= 0x7a || charCode >= 0x41 && charCode <= 0x5a
        }

        function isAsciiDigit (charCode) {
          return charCode >= 0x30 && charCode <= 0x39
        }

        function isAsciiSpace (charCode) {
          return charCode === 0x20 || charCode === 0x09 || charCode === 0x0d || charCode === 0x0a
        }

        function isHan (charCode) {
          return charCode >= 0x3400 && charCode <= 0x9fff || charCode >= 0xf900 && charCode <= 0xfaff
        }

        function isKatakana (charCode) {
          return charCode >= 0x30a0 && charCode <= 0x30ff
        }

        function isHiragana (charCode) {
          return charCode >= 0x3040 && charCode <= 0x309f
        }

        function isHalfwidthKatakana (charCode) {
          return charCode >= 0xff60 && charCode <= 0xff9f
        }

        function isThai (charCode) {
          return (charCode & 0xff80) === 0x0e00
        }

        function getCharacterType (charCode) {
          if (isAlphabeticalScript(charCode)) {
            if (isAscii(charCode)) {
              if (isAsciiSpace(charCode)) {
                return CharacterType.SPACE
              } else if (isAsciiAlpha(charCode) || isAsciiDigit(charCode) || charCode === 0x5f) {
                return CharacterType.ALPHA_LETTER
              }

              return CharacterType.PUNCT
            } else if (isThai(charCode)) {
              return CharacterType.THAI_LETTER
            } else if (charCode === 0xa0) {
              return CharacterType.SPACE
            }

            return CharacterType.ALPHA_LETTER
          }

          if (isHan(charCode)) {
            return CharacterType.HAN_LETTER
          } else if (isKatakana(charCode)) {
            return CharacterType.KATAKANA_LETTER
          } else if (isHiragana(charCode)) {
            return CharacterType.HIRAGANA_LETTER
          } else if (isHalfwidthKatakana(charCode)) {
            return CharacterType.HALFWIDTH_KATAKANA_LETTER
          }

          return CharacterType.ALPHA_LETTER
        }

        /***/
      }),
      /* 13 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.isDestArraysEqual = isDestArraysEqual
        exports.isDestHashesEqual = isDestHashesEqual
        exports.PDFHistory = void 0

        var _ui_utils = __w_pdfjs_require__(5)

        const HASH_CHANGE_TIMEOUT = 1000
        const POSITION_UPDATED_THRESHOLD = 50
        const UPDATE_VIEWAREA_TIMEOUT = 1000

        function getCurrentHash () {
          return document.location.hash
        }

        class PDFHistory {
          constructor ({
            linkService,
            eventBus
          }) {
            this.linkService = linkService
            this.eventBus = eventBus
            this._initialized = false
            this._fingerprint = ''
            this.reset()
            this._boundEvents = null
            this._isViewerInPresentationMode = false

            this.eventBus._on('presentationmodechanged', evt => {
              this._isViewerInPresentationMode = evt.state !== _ui_utils.PresentationModeState.NORMAL
            })

            this.eventBus._on('pagesinit', () => {
              this._isPagesLoaded = false

              this.eventBus._on('pagesloaded', evt => {
                this._isPagesLoaded = !!evt.pagesCount
              }, {
                once: true
              })
            })
          }

          initialize ({
            fingerprint,
            resetHistory = false,
            updateUrl = false
          }) {
            if (!fingerprint || typeof fingerprint !== 'string') {
              console.error('PDFHistory.initialize: The "fingerprint" must be a non-empty string.')
              return
            }

            if (this._initialized) {
              this.reset()
            }

            const reInitialized = this._fingerprint !== '' && this._fingerprint !== fingerprint
            this._fingerprint = fingerprint
            this._updateUrl = updateUrl === true
            this._initialized = true

            this._bindEvents()

            const state = window.history.state
            this._popStateInProgress = false
            this._blockHashChange = 0
            this._currentHash = getCurrentHash()
            this._numPositionUpdates = 0
            this._uid = this._maxUid = 0
            this._destination = null
            this._position = null

            if (!this._isValidState(state, true) || resetHistory) {
              const {
                hash,
                page,
                rotation
              } = this._parseCurrentHash(true)

              if (!hash || reInitialized || resetHistory) {
                this._pushOrReplaceState(null, true)

                return
              }

              this._pushOrReplaceState({
                hash,
                page,
                rotation
              }, true)

              return
            }

            const destination = state.destination

            this._updateInternalState(destination, state.uid, true)

            if (destination.rotation !== undefined) {
              this._initialRotation = destination.rotation
            }

            if (destination.dest) {
              this._initialBookmark = JSON.stringify(destination.dest)
              this._destination.page = null
            } else if (destination.hash) {
              this._initialBookmark = destination.hash
            } else if (destination.page) {
              this._initialBookmark = `page=${destination.page}`
            }
          }

          reset () {
            if (this._initialized) {
              this._pageHide()

              this._initialized = false

              this._unbindEvents()
            }

            if (this._updateViewareaTimeout) {
              clearTimeout(this._updateViewareaTimeout)
              this._updateViewareaTimeout = null
            }

            this._initialBookmark = null
            this._initialRotation = null
          }

          push ({
            namedDest = null,
            explicitDest,
            pageNumber
          }) {
            if (!this._initialized) {
              return
            }

            if (namedDest && typeof namedDest !== 'string') {
              console.error('PDFHistory.push: ' + `"${namedDest}" is not a valid namedDest parameter.`)
              return
            } else if (!Array.isArray(explicitDest)) {
              console.error('PDFHistory.push: ' + `"${explicitDest}" is not a valid explicitDest parameter.`)
              return
            } else if (!this._isValidPage(pageNumber)) {
              if (pageNumber !== null || this._destination) {
                console.error('PDFHistory.push: ' + `"${pageNumber}" is not a valid pageNumber parameter.`)
                return
              }
            }

            const hash = namedDest || JSON.stringify(explicitDest)

            if (!hash) {
              return
            }

            let forceReplace = false

            if (this._destination && (isDestHashesEqual(this._destination.hash, hash) || isDestArraysEqual(this._destination.dest, explicitDest))) {
              if (this._destination.page) {
                return
              }

              forceReplace = true
            }

            if (this._popStateInProgress && !forceReplace) {
              return
            }

            this._pushOrReplaceState({
              dest: explicitDest,
              hash,
              page: pageNumber,
              rotation: this.linkService.rotation
            }, forceReplace)

            if (!this._popStateInProgress) {
              this._popStateInProgress = true
              Promise.resolve().then(() => {
                this._popStateInProgress = false
              })
            }
          }

          pushPage (pageNumber) {
            if (!this._initialized) {
              return
            }

            if (!this._isValidPage(pageNumber)) {
              console.error(`PDFHistory.pushPage: "${pageNumber}" is not a valid page number.`)
              return
            }

            if (this._destination?.page === pageNumber) {
              return
            }

            if (this._popStateInProgress) {
              return
            }

            this._pushOrReplaceState({
              dest: null,
              hash: `page=${pageNumber}`,
              page: pageNumber,
              rotation: this.linkService.rotation
            })

            if (!this._popStateInProgress) {
              this._popStateInProgress = true
              Promise.resolve().then(() => {
                this._popStateInProgress = false
              })
            }
          }

          pushCurrentPosition () {
            if (!this._initialized || this._popStateInProgress) {
              return
            }

            this._tryPushCurrentPosition()
          }

          back () {
            if (!this._initialized || this._popStateInProgress) {
              return
            }

            const state = window.history.state

            if (this._isValidState(state) && state.uid > 0) {
              window.history.back()
            }
          }

          forward () {
            if (!this._initialized || this._popStateInProgress) {
              return
            }

            const state = window.history.state

            if (this._isValidState(state) && state.uid < this._maxUid) {
              window.history.forward()
            }
          }

          get popStateInProgress () {
            return this._initialized && (this._popStateInProgress || this._blockHashChange > 0)
          }

          get initialBookmark () {
            return this._initialized ? this._initialBookmark : null
          }

          get initialRotation () {
            return this._initialized ? this._initialRotation : null
          }

          _pushOrReplaceState (destination, forceReplace = false) {
            const shouldReplace = forceReplace || !this._destination
            const newState = {
              fingerprint: this._fingerprint,
              uid: shouldReplace ? this._uid : this._uid + 1,
              destination
            }

            this._updateInternalState(destination, newState.uid)

            let newUrl

            if (this._updateUrl && destination?.hash) {
              const baseUrl = document.location.href.split('#')[0]

              if (!baseUrl.startsWith('file://')) {
                newUrl = `${baseUrl}#${destination.hash}`
              }
            }

            if (shouldReplace) {
              window.history.replaceState(newState, '', newUrl)
            } else {
              window.history.pushState(newState, '', newUrl)
            }
          }

          _tryPushCurrentPosition (temporary = false) {
            if (!this._position) {
              return
            }

            let position = this._position

            if (temporary) {
              position = Object.assign(Object.create(null), this._position)
              position.temporary = true
            }

            if (!this._destination) {
              this._pushOrReplaceState(position)

              return
            }

            if (this._destination.temporary) {
              this._pushOrReplaceState(position, true)

              return
            }

            if (this._destination.hash === position.hash) {
              return
            }

            if (!this._destination.page && (POSITION_UPDATED_THRESHOLD <= 0 || this._numPositionUpdates <= POSITION_UPDATED_THRESHOLD)) {
              return
            }

            let forceReplace = false

            if (this._destination.page >= position.first && this._destination.page <= position.page) {
              if (this._destination.dest !== undefined || !this._destination.first) {
                return
              }

              forceReplace = true
            }

            this._pushOrReplaceState(position, forceReplace)
          }

          _isValidPage (val) {
            return Number.isInteger(val) && val > 0 && val <= this.linkService.pagesCount
          }

          _isValidState (state, checkReload = false) {
            if (!state) {
              return false
            }

            if (state.fingerprint !== this._fingerprint) {
              if (checkReload) {
                if (typeof state.fingerprint !== 'string' || state.fingerprint.length !== this._fingerprint.length) {
                  return false
                }

                const [perfEntry] = performance.getEntriesByType('navigation')

                if (perfEntry?.type !== 'reload') {
                  return false
                }
              } else {
                return false
              }
            }

            if (!Number.isInteger(state.uid) || state.uid < 0) {
              return false
            }

            if (state.destination === null || typeof state.destination !== 'object') {
              return false
            }

            return true
          }

          _updateInternalState (destination, uid, removeTemporary = false) {
            if (this._updateViewareaTimeout) {
              clearTimeout(this._updateViewareaTimeout)
              this._updateViewareaTimeout = null
            }

            if (removeTemporary && destination?.temporary) {
              delete destination.temporary
            }

            this._destination = destination
            this._uid = uid
            this._maxUid = Math.max(this._maxUid, uid)
            this._numPositionUpdates = 0
          }

          _parseCurrentHash (checkNameddest = false) {
            const hash = unescape(getCurrentHash()).substring(1)
            const params = (0, _ui_utils.parseQueryString)(hash)
            const nameddest = params.nameddest || ''
            let page = params.page | 0

            if (!this._isValidPage(page) || checkNameddest && nameddest.length > 0) {
              page = null
            }

            return {
              hash,
              page,
              rotation: this.linkService.rotation
            }
          }

          _updateViewarea ({
            location
          }) {
            if (this._updateViewareaTimeout) {
              clearTimeout(this._updateViewareaTimeout)
              this._updateViewareaTimeout = null
            }

            this._position = {
              hash: this._isViewerInPresentationMode ? `page=${location.pageNumber}` : location.pdfOpenParams.substring(1),
              page: this.linkService.page,
              first: location.pageNumber,
              rotation: location.rotation
            }

            if (this._popStateInProgress) {
              return
            }

            if (POSITION_UPDATED_THRESHOLD > 0 && this._isPagesLoaded && this._destination && !this._destination.page) {
              this._numPositionUpdates++
            }

            if (UPDATE_VIEWAREA_TIMEOUT > 0) {
              this._updateViewareaTimeout = setTimeout(() => {
                if (!this._popStateInProgress) {
                  this._tryPushCurrentPosition(true)
                }

                this._updateViewareaTimeout = null
              }, UPDATE_VIEWAREA_TIMEOUT)
            }
          }

          _popState ({
            state
          }) {
            const newHash = getCurrentHash(),
              hashChanged = this._currentHash !== newHash
            this._currentHash = newHash

            if (!state) {
              this._uid++

              const {
                hash,
                page,
                rotation
              } = this._parseCurrentHash()

              this._pushOrReplaceState({
                hash,
                page,
                rotation
              }, true)

              return
            }

            if (!this._isValidState(state)) {
              return
            }

            this._popStateInProgress = true

            if (hashChanged) {
              this._blockHashChange++;
              (0, _ui_utils.waitOnEventOrTimeout)({
                target: window,
                name: 'hashchange',
                delay: HASH_CHANGE_TIMEOUT
              }).then(() => {
                this._blockHashChange--
              })
            }

            const destination = state.destination

            this._updateInternalState(destination, state.uid, true)

            if ((0, _ui_utils.isValidRotation)(destination.rotation)) {
              this.linkService.rotation = destination.rotation
            }

            if (destination.dest) {
              this.linkService.goToDestination(destination.dest)
            } else if (destination.hash) {
              this.linkService.setHash(destination.hash)
            } else if (destination.page) {
              this.linkService.page = destination.page
            }

            Promise.resolve().then(() => {
              this._popStateInProgress = false
            })
          }

          _pageHide () {
            if (!this._destination || this._destination.temporary) {
              this._tryPushCurrentPosition()
            }
          }

          _bindEvents () {
            if (this._boundEvents) {
              return
            }

            this._boundEvents = {
              updateViewarea: this._updateViewarea.bind(this),
              popState: this._popState.bind(this),
              pageHide: this._pageHide.bind(this)
            }

            this.eventBus._on('updateviewarea', this._boundEvents.updateViewarea)

            window.addEventListener('popstate', this._boundEvents.popState)
            window.addEventListener('pagehide', this._boundEvents.pageHide)
          }

          _unbindEvents () {
            if (!this._boundEvents) {
              return
            }

            this.eventBus._off('updateviewarea', this._boundEvents.updateViewarea)

            window.removeEventListener('popstate', this._boundEvents.popState)
            window.removeEventListener('pagehide', this._boundEvents.pageHide)
            this._boundEvents = null
          }

        }

        exports.PDFHistory = PDFHistory

        function isDestHashesEqual (destHash, pushHash) {
          if (typeof destHash !== 'string' || typeof pushHash !== 'string') {
            return false
          }

          if (destHash === pushHash) {
            return true
          }

          const {
            nameddest
          } = (0, _ui_utils.parseQueryString)(destHash)

          if (nameddest === pushHash) {
            return true
          }

          return false
        }

        function isDestArraysEqual (firstDest, secondDest) {
          function isEntryEqual (first, second) {
            if (typeof first !== typeof second) {
              return false
            }

            if (Array.isArray(first) || Array.isArray(second)) {
              return false
            }

            if (first !== null && typeof first === 'object' && second !== null) {
              if (Object.keys(first).length !== Object.keys(second).length) {
                return false
              }

              for (const key in first) {
                if (!isEntryEqual(first[key], second[key])) {
                  return false
                }
              }

              return true
            }

            return first === second || Number.isNaN(first) && Number.isNaN(second)
          }

          if (!(Array.isArray(firstDest) && Array.isArray(secondDest))) {
            return false
          }

          if (firstDest.length !== secondDest.length) {
            return false
          }

          for (let i = 0, ii = firstDest.length; i < ii; i++) {
            if (!isEntryEqual(firstDest[i], secondDest[i])) {
              return false
            }
          }

          return true
        }

        /***/
      }),
      /* 14 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.PDFPageView = void 0

        var _ui_utils = __w_pdfjs_require__(5)

        var _pdfjsLib = __w_pdfjs_require__(2)

        var _l10n_utils = __w_pdfjs_require__(3)

        var _pdf_rendering_queue = __w_pdfjs_require__(15)

        var _viewer_compatibility = __w_pdfjs_require__(8)

        const MAX_CANVAS_PIXELS = _viewer_compatibility.viewerCompatibilityParams.maxCanvasPixels || 16777216

        class PDFPageView {
          constructor (options) {
            const container = options.container
            const defaultViewport = options.defaultViewport
            this.id = options.id
            this.renderingId = 'page' + this.id
            this.pdfPage = null
            this.pageLabel = null
            this.rotation = 0
            this.scale = options.scale || _ui_utils.DEFAULT_SCALE
            this.viewport = defaultViewport
            this.pdfPageRotate = defaultViewport.rotation
            this._optionalContentConfigPromise = options.optionalContentConfigPromise || null
            this.hasRestrictedScaling = false
            this.textLayerMode = Number.isInteger(options.textLayerMode) ? options.textLayerMode : _ui_utils.TextLayerMode.ENABLE
            this.imageResourcesPath = options.imageResourcesPath || ''
            this.renderInteractiveForms = options.renderInteractiveForms !== false
            this.useOnlyCssZoom = options.useOnlyCssZoom || false
            this.maxCanvasPixels = options.maxCanvasPixels || MAX_CANVAS_PIXELS
            this.eventBus = options.eventBus
            this.renderingQueue = options.renderingQueue
            this.textLayerFactory = options.textLayerFactory
            this.annotationLayerFactory = options.annotationLayerFactory
            this.xfaLayerFactory = options.xfaLayerFactory
            this.renderer = options.renderer || _ui_utils.RendererType.CANVAS
            this.enableWebGL = options.enableWebGL || false
            this.l10n = options.l10n || _l10n_utils.NullL10n
            this.enableScripting = options.enableScripting === true
            this.paintTask = null
            this.paintedViewportMap = new WeakMap()
            this.renderingState = _pdf_rendering_queue.RenderingStates.INITIAL
            this.resume = null
            this._renderError = null
            this.annotationLayer = null
            this.textLayer = null
            this.zoomLayer = null
            this.xfaLayer = null
            const div = document.createElement('div')
            div.className = 'page'
            div.style.width = Math.floor(this.viewport.width) + 'px'
            div.style.height = Math.floor(this.viewport.height) + 'px'
            div.setAttribute('data-page-number', this.id)
            div.setAttribute('role', 'region')
            this.l10n.get('page_landmark', {
              page: this.id
            }).then(msg => {
              div.setAttribute('aria-label', msg)
            })
            this.div = div
            container.appendChild(div)
          }

          setPdfPage (pdfPage) {
            this.pdfPage = pdfPage
            this.pdfPageRotate = pdfPage.rotate
            const totalRotation = (this.rotation + this.pdfPageRotate) % 360
            this.viewport = pdfPage.getViewport({
              scale: this.scale * _ui_utils.CSS_UNITS,
              rotation: totalRotation
            })
            this.reset()
          }

          destroy () {
            this.reset()

            if (this.pdfPage) {
              this.pdfPage.cleanup()
            }
          }

          async _renderAnnotationLayer () {
            let error = null

            try {
              await this.annotationLayer.render(this.viewport, 'display')
            } catch (ex) {
              error = ex
            } finally {
              this.eventBus.dispatch('annotationlayerrendered', {
                source: this,
                pageNumber: this.id,
                error
              })
            }
          }

          async _renderXfaLayer () {
            let error = null

            try {
              await this.xfaLayer.render(this.viewport, 'display')
            } catch (ex) {
              error = ex
            } finally {
              this.eventBus.dispatch('xfalayerrendered', {
                source: this,
                pageNumber: this.id,
                error
              })
            }
          }

          _resetZoomLayer (removeFromDOM = false) {
            if (!this.zoomLayer) {
              return
            }

            const zoomLayerCanvas = this.zoomLayer.firstChild
            this.paintedViewportMap.delete(zoomLayerCanvas)
            zoomLayerCanvas.width = 0
            zoomLayerCanvas.height = 0

            if (removeFromDOM) {
              this.zoomLayer.remove()
            }

            this.zoomLayer = null
          }

          reset (keepZoomLayer = false, keepAnnotations = false) {
            this.cancelRendering(keepAnnotations)
            this.renderingState = _pdf_rendering_queue.RenderingStates.INITIAL
            const div = this.div
            div.style.width = Math.floor(this.viewport.width) + 'px'
            div.style.height = Math.floor(this.viewport.height) + 'px'
            const childNodes = div.childNodes
            const currentZoomLayerNode = keepZoomLayer && this.zoomLayer || null
            const currentAnnotationNode = keepAnnotations && this.annotationLayer?.div || null
            const currentXfaLayerNode = this.xfaLayer?.div || null

            for (let i = childNodes.length - 1; i >= 0; i--) {
              const node = childNodes[i]

              if (currentZoomLayerNode === node || currentAnnotationNode === node || currentXfaLayerNode === node) {
                continue
              }

              div.removeChild(node)
            }

            div.removeAttribute('data-loaded')

            if (currentAnnotationNode) {
              this.annotationLayer.hide()
            } else if (this.annotationLayer) {
              this.annotationLayer.cancel()
              this.annotationLayer = null
            }

            if (!currentZoomLayerNode) {
              if (this.canvas) {
                this.paintedViewportMap.delete(this.canvas)
                this.canvas.width = 0
                this.canvas.height = 0
                delete this.canvas
              }

              this._resetZoomLayer()
            }

            if (this.svg) {
              this.paintedViewportMap.delete(this.svg)
              delete this.svg
            }

            this.loadingIconDiv = document.createElement('div')
            this.loadingIconDiv.className = 'loadingIcon'
            this.loadingIconDiv.setAttribute('role', 'img')
            this.l10n.get('loading').then(msg => {
              this.loadingIconDiv?.setAttribute('aria-label', msg)
            })
            div.appendChild(this.loadingIconDiv)
          }

          update (scale, rotation, optionalContentConfigPromise = null) {
            this.scale = scale || this.scale

            if (typeof rotation !== 'undefined') {
              this.rotation = rotation
            }

            if (optionalContentConfigPromise instanceof Promise) {
              this._optionalContentConfigPromise = optionalContentConfigPromise
            }

            const totalRotation = (this.rotation + this.pdfPageRotate) % 360
            this.viewport = this.viewport.clone({
              scale: this.scale * _ui_utils.CSS_UNITS,
              rotation: totalRotation
            })

            if (this.svg) {
              this.cssTransform(this.svg, true)
              this.eventBus.dispatch('pagerendered', {
                source: this,
                pageNumber: this.id,
                cssTransform: true,
                timestamp: performance.now(),
                error: this._renderError
              })
              return
            }

            let isScalingRestricted = false

            if (this.canvas && this.maxCanvasPixels > 0) {
              const outputScale = this.outputScale

              if ((Math.floor(this.viewport.width) * outputScale.sx | 0) * (Math.floor(this.viewport.height) * outputScale.sy | 0) > this.maxCanvasPixels) {
                isScalingRestricted = true
              }
            }

            if (this.canvas) {
              if (this.useOnlyCssZoom || this.hasRestrictedScaling && isScalingRestricted) {
                this.cssTransform(this.canvas, true)
                this.eventBus.dispatch('pagerendered', {
                  source: this,
                  pageNumber: this.id,
                  cssTransform: true,
                  timestamp: performance.now(),
                  error: this._renderError
                })
                return
              }

              if (!this.zoomLayer && !this.canvas.hidden) {
                this.zoomLayer = this.canvas.parentNode
                this.zoomLayer.style.position = 'absolute'
              }
            }

            if (this.zoomLayer) {
              this.cssTransform(this.zoomLayer.firstChild)
            }

            this.reset(true, true)
          }

          cancelRendering (keepAnnotations = false) {
            if (this.paintTask) {
              this.paintTask.cancel()
              this.paintTask = null
            }

            this.resume = null

            if (this.textLayer) {
              this.textLayer.cancel()
              this.textLayer = null
            }

            if (!keepAnnotations && this.annotationLayer) {
              this.annotationLayer.cancel()
              this.annotationLayer = null
            }
          }

          cssTransform (target, redrawAnnotations = false) {
            const width = this.viewport.width
            const height = this.viewport.height
            const div = this.div
            target.style.width = target.parentNode.style.width = div.style.width = Math.floor(width) + 'px'
            target.style.height = target.parentNode.style.height = div.style.height = Math.floor(height) + 'px'
            const relativeRotation = this.viewport.rotation - this.paintedViewportMap.get(target).rotation
            const absRotation = Math.abs(relativeRotation)
            let scaleX = 1,
              scaleY = 1

            if (absRotation === 90 || absRotation === 270) {
              scaleX = height / width
              scaleY = width / height
            }

            target.style.transform = `rotate(${relativeRotation}deg) scale(${scaleX}, ${scaleY})`

            if (this.textLayer) {
              const textLayerViewport = this.textLayer.viewport
              const textRelativeRotation = this.viewport.rotation - textLayerViewport.rotation
              const textAbsRotation = Math.abs(textRelativeRotation)
              let scale = width / textLayerViewport.width

              if (textAbsRotation === 90 || textAbsRotation === 270) {
                scale = width / textLayerViewport.height
              }

              const textLayerDiv = this.textLayer.textLayerDiv
              let transX, transY

              switch (textAbsRotation) {
                case 0:
                  transX = transY = 0
                  break

                case 90:
                  transX = 0
                  transY = '-' + textLayerDiv.style.height
                  break

                case 180:
                  transX = '-' + textLayerDiv.style.width
                  transY = '-' + textLayerDiv.style.height
                  break

                case 270:
                  transX = '-' + textLayerDiv.style.width
                  transY = 0
                  break

                default:
                  console.error('Bad rotation value.')
                  break
              }

              textLayerDiv.style.transform = `rotate(${textAbsRotation}deg) ` + `scale(${scale}) ` + `translate(${transX}, ${transY})`
              textLayerDiv.style.transformOrigin = '0% 0%'
            }

            if (redrawAnnotations && this.annotationLayer) {
              this._renderAnnotationLayer()
            }

            if (this.xfaLayer) {
              this._renderXfaLayer()
            }
          }

          get width () {
            return this.viewport.width
          }

          get height () {
            return this.viewport.height
          }

          getPagePoint (x, y) {
            return this.viewport.convertToPdfPoint(x, y)
          }

          draw () {
            if (this.renderingState !== _pdf_rendering_queue.RenderingStates.INITIAL) {
              console.error('Must be in new state before drawing')
              this.reset()
            }

            const {
              div,
              pdfPage
            } = this

            if (!pdfPage) {
              this.renderingState = _pdf_rendering_queue.RenderingStates.FINISHED

              if (this.loadingIconDiv) {
                div.removeChild(this.loadingIconDiv)
                delete this.loadingIconDiv
              }

              return Promise.reject(new Error('pdfPage is not loaded'))
            }

            this.renderingState = _pdf_rendering_queue.RenderingStates.RUNNING
            const canvasWrapper = document.createElement('div')
            canvasWrapper.style.width = div.style.width
            canvasWrapper.style.height = div.style.height
            canvasWrapper.classList.add('canvasWrapper')

            if (this.annotationLayer?.div) {
              div.insertBefore(canvasWrapper, this.annotationLayer.div)
            } else {
              div.appendChild(canvasWrapper)
            }

            let textLayer = null

            if (this.textLayerMode !== _ui_utils.TextLayerMode.DISABLE && this.textLayerFactory) {
              const textLayerDiv = document.createElement('div')
              textLayerDiv.className = 'textLayer'
              textLayerDiv.style.width = canvasWrapper.style.width
              textLayerDiv.style.height = canvasWrapper.style.height

              if (this.annotationLayer?.div) {
                div.insertBefore(textLayerDiv, this.annotationLayer.div)
              } else {
                div.appendChild(textLayerDiv)
              }

              textLayer = this.textLayerFactory.createTextLayerBuilder(textLayerDiv, this.id - 1, this.viewport, this.textLayerMode === _ui_utils.TextLayerMode.ENABLE_ENHANCE, this.eventBus)
            }

            this.textLayer = textLayer
            let renderContinueCallback = null

            if (this.renderingQueue) {
              renderContinueCallback = cont => {
                if (!this.renderingQueue.isHighestPriority(this)) {
                  this.renderingState = _pdf_rendering_queue.RenderingStates.PAUSED

                  this.resume = () => {
                    this.renderingState = _pdf_rendering_queue.RenderingStates.RUNNING
                    cont()
                  }

                  return
                }

                cont()
              }
            }

            const finishPaintTask = async (error = null) => {
              if (paintTask === this.paintTask) {
                this.paintTask = null
              }

              if (error instanceof _pdfjsLib.RenderingCancelledException) {
                this._renderError = null
                return
              }

              this._renderError = error
              this.renderingState = _pdf_rendering_queue.RenderingStates.FINISHED

              if (this.loadingIconDiv) {
                div.removeChild(this.loadingIconDiv)
                delete this.loadingIconDiv
              }

              this._resetZoomLayer(true)

              this.eventBus.dispatch('pagerendered', {
                source: this,
                pageNumber: this.id,
                cssTransform: false,
                timestamp: performance.now(),
                error: this._renderError
              })

              if (error) {
                throw error
              }
            }

            const paintTask = this.renderer === _ui_utils.RendererType.SVG ? this.paintOnSvg(canvasWrapper) : this.paintOnCanvas(canvasWrapper)
            paintTask.onRenderContinue = renderContinueCallback
            this.paintTask = paintTask
            const resultPromise = paintTask.promise.then(function () {
              return finishPaintTask(null).then(function () {
                if (textLayer) {
                  const readableStream = pdfPage.streamTextContent({
                    normalizeWhitespace: true
                  })
                  textLayer.setTextContentStream(readableStream)
                  textLayer.render()
                }
              })
            }, function (reason) {
              return finishPaintTask(reason)
            })

            if (this.annotationLayerFactory) {
              if (!this.annotationLayer) {
                this.annotationLayer = this.annotationLayerFactory.createAnnotationLayerBuilder(div, pdfPage, null, this.imageResourcesPath, this.renderInteractiveForms, this.l10n, this.enableScripting, null, null)
              }

              this._renderAnnotationLayer()
            }

            if (this.xfaLayerFactory) {
              if (!this.xfaLayer) {
                this.xfaLayer = this.xfaLayerFactory.createXfaLayerBuilder(div, pdfPage)
              }

              this._renderXfaLayer()
            }

            div.setAttribute('data-loaded', true)
            this.eventBus.dispatch('pagerender', {
              source: this,
              pageNumber: this.id
            })
            return resultPromise
          }

          paintOnCanvas (canvasWrapper) {
            const renderCapability = (0, _pdfjsLib.createPromiseCapability)()
            const result = {
              promise: renderCapability.promise,

              onRenderContinue (cont) {
                cont()
              },

              cancel () {
                renderTask.cancel()
              }

            }
            const viewport = this.viewport
            const canvas = document.createElement('canvas')
            canvas.hidden = true
            let isCanvasHidden = true

            const showCanvas = function () {
              if (isCanvasHidden) {
                canvas.hidden = false
                isCanvasHidden = false
              }
            }

            canvasWrapper.appendChild(canvas)
            this.canvas = canvas
            canvas.mozOpaque = true
            const ctx = canvas.getContext('2d', {
              alpha: false,
            })
            const outputScale = (0, _ui_utils.getOutputScale)(ctx)
            this.outputScale = outputScale

            if (this.useOnlyCssZoom) {
              const actualSizeViewport = viewport.clone({
                scale: _ui_utils.CSS_UNITS
              })
              outputScale.sx *= actualSizeViewport.width / viewport.width
              outputScale.sy *= actualSizeViewport.height / viewport.height
              outputScale.scaled = true
            }

            if (this.maxCanvasPixels > 0) {
              const pixelsInViewport = viewport.width * viewport.height
              const maxScale = Math.sqrt(this.maxCanvasPixels / pixelsInViewport)

              if (outputScale.sx > maxScale || outputScale.sy > maxScale) {
                outputScale.sx = maxScale
                outputScale.sy = maxScale
                outputScale.scaled = true
                this.hasRestrictedScaling = true
              } else {
                this.hasRestrictedScaling = false
              }
            }

            const sfx = (0, _ui_utils.approximateFraction)(outputScale.sx)
            const sfy = (0, _ui_utils.approximateFraction)(outputScale.sy)
            canvas.width = (0, _ui_utils.roundToDivide)(viewport.width * outputScale.sx, sfx[0])
            canvas.height = (0, _ui_utils.roundToDivide)(viewport.height * outputScale.sy, sfy[0])
            canvas.style.width = (0, _ui_utils.roundToDivide)(viewport.width, sfx[1]) + 'px'
            canvas.style.height = (0, _ui_utils.roundToDivide)(viewport.height, sfy[1]) + 'px'
            this.paintedViewportMap.set(canvas, viewport)
            const transform = !outputScale.scaled ? null : [outputScale.sx, 0, 0, outputScale.sy, 0, 0]
            const renderContext = {
              canvasContext: ctx,
              transform,
              viewport: this.viewport,
              enableWebGL: this.enableWebGL,
              renderInteractiveForms: this.renderInteractiveForms,
              optionalContentConfigPromise: this._optionalContentConfigPromise,
              // background: 'transparent',
            }
            const renderTask = this.pdfPage.render(renderContext)

            renderTask.onContinue = function (cont) {
              showCanvas()

              if (result.onRenderContinue) {
                result.onRenderContinue(cont)
              } else {
                cont()
              }
            }

            renderTask.promise.then(function () {
              showCanvas()
              renderCapability.resolve(undefined)
            }, function (error) {
              showCanvas()
              renderCapability.reject(error)
            })
            return result
          }

          paintOnSvg (wrapper) {
            let cancelled = false

            const ensureNotCancelled = () => {
              if (cancelled) {
                throw new _pdfjsLib.RenderingCancelledException(`Rendering cancelled, page ${this.id}`, 'svg')
              }
            }

            const pdfPage = this.pdfPage
            const actualSizeViewport = this.viewport.clone({
              scale: _ui_utils.CSS_UNITS
            })
            const promise = pdfPage.getOperatorList().then(opList => {
              ensureNotCancelled()
              const svgGfx = new _pdfjsLib.SVGGraphics(pdfPage.commonObjs, pdfPage.objs, _viewer_compatibility.viewerCompatibilityParams.disableCreateObjectURL)
              return svgGfx.getSVG(opList, actualSizeViewport).then(svg => {
                ensureNotCancelled()
                this.svg = svg
                this.paintedViewportMap.set(svg, actualSizeViewport)
                svg.style.width = wrapper.style.width
                svg.style.height = wrapper.style.height
                this.renderingState = _pdf_rendering_queue.RenderingStates.FINISHED
                wrapper.appendChild(svg)
              })
            })
            return {
              promise,

              onRenderContinue (cont) {
                cont()
              },

              cancel () {
                cancelled = true
              }

            }
          }

          setPageLabel (label) {
            this.pageLabel = typeof label === 'string' ? label : null

            if (this.pageLabel !== null) {
              this.div.setAttribute('data-page-label', this.pageLabel)
            } else {
              this.div.removeAttribute('data-page-label')
            }
          }

        }

        exports.PDFPageView = PDFPageView

        /***/
      }),
      /* 15 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.RenderingStates = exports.PDFRenderingQueue = void 0

        var _pdfjsLib = __w_pdfjs_require__(2)

        const CLEANUP_TIMEOUT = 30000
        const RenderingStates = {
          INITIAL: 0,
          RUNNING: 1,
          PAUSED: 2,
          FINISHED: 3
        }
        exports.RenderingStates = RenderingStates

        class PDFRenderingQueue {
          constructor () {
            this.pdfViewer = null
            this.pdfThumbnailViewer = null
            this.onIdle = null
            this.highestPriorityPage = null
            this.idleTimeout = null
            this.printing = false
            this.isThumbnailViewEnabled = false
          }

          setViewer (pdfViewer) {
            this.pdfViewer = pdfViewer
          }

          setThumbnailViewer (pdfThumbnailViewer) {
            this.pdfThumbnailViewer = pdfThumbnailViewer
          }

          isHighestPriority (view) {
            return this.highestPriorityPage === view.renderingId
          }

          renderHighestPriority (currentlyVisiblePages) {
            if (this.idleTimeout) {
              clearTimeout(this.idleTimeout)
              this.idleTimeout = null
            }

            if (this.pdfViewer.forceRendering(currentlyVisiblePages)) {
              return
            }

            if (this.pdfThumbnailViewer && this.isThumbnailViewEnabled) {
              if (this.pdfThumbnailViewer.forceRendering()) {
                return
              }
            }

            if (this.printing) {
              return
            }

            if (this.onIdle) {
              this.idleTimeout = setTimeout(this.onIdle.bind(this), CLEANUP_TIMEOUT)
            }
          }

          getHighestPriority (visible, views, scrolledDown) {
            const visibleViews = visible.views
            const numVisible = visibleViews.length

            if (numVisible === 0) {
              return null
            }

            for (let i = 0; i < numVisible; ++i) {
              const view = visibleViews[i].view

              if (!this.isViewFinished(view)) {
                return view
              }
            }

            if (scrolledDown) {
              const nextPageIndex = visible.last.id

              if (views[nextPageIndex] && !this.isViewFinished(views[nextPageIndex])) {
                return views[nextPageIndex]
              }
            } else {
              const previousPageIndex = visible.first.id - 2

              if (views[previousPageIndex] && !this.isViewFinished(views[previousPageIndex])) {
                return views[previousPageIndex]
              }
            }

            return null
          }

          isViewFinished (view) {
            return view.renderingState === RenderingStates.FINISHED
          }

          renderView (view) {
            switch (view.renderingState) {
              case RenderingStates.FINISHED:
                return false

              case RenderingStates.PAUSED:
                this.highestPriorityPage = view.renderingId
                view.resume()
                break

              case RenderingStates.RUNNING:
                this.highestPriorityPage = view.renderingId
                break

              case RenderingStates.INITIAL:
                this.highestPriorityPage = view.renderingId
                view.draw().finally(() => {
                  this.renderHighestPriority()
                }).catch(reason => {
                  if (reason instanceof _pdfjsLib.RenderingCancelledException) {
                    return
                  }

                  console.error(`renderView: "${reason}"`)
                })
                break
            }

            return true
          }

        }

        exports.PDFRenderingQueue = PDFRenderingQueue

        /***/
      }),
      /* 16 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.PDFScriptingManager = void 0

        var _pdfjsLib = __w_pdfjs_require__(2)

        var _ui_utils = __w_pdfjs_require__(5)

        var _pdf_rendering_queue = __w_pdfjs_require__(15)

        class PDFScriptingManager {
          constructor ({
            eventBus,
            sandboxBundleSrc = null,
            scriptingFactory = null,
            docPropertiesLookup = null
          }) {
            this._pdfDocument = null
            this._pdfViewer = null
            this._closeCapability = null
            this._destroyCapability = null
            this._scripting = null
            this._mouseState = Object.create(null)
            this._pageEventsReady = false
            this._ready = false
            this._eventBus = eventBus
            this._sandboxBundleSrc = sandboxBundleSrc
            this._scriptingFactory = scriptingFactory
            this._docPropertiesLookup = docPropertiesLookup

            if (!this._scriptingFactory) {
              window.addEventListener('updatefromsandbox', event => {
                this._eventBus.dispatch('updatefromsandbox', {
                  source: window,
                  detail: event.detail
                })
              })
            }
          }

          setViewer (pdfViewer) {
            this._pdfViewer = pdfViewer
          }

          async setDocument (pdfDocument) {
            if (this._pdfDocument) {
              await this._destroyScripting()
            }

            this._pdfDocument = pdfDocument

            if (!pdfDocument) {
              return
            }

            const [objects, calculationOrder, docActions] = await Promise.all([pdfDocument.getFieldObjects(), pdfDocument.getCalculationOrderIds(), pdfDocument.getJSActions()])

            if (!objects && !docActions) {
              await this._destroyScripting()
              return
            }

            if (pdfDocument !== this._pdfDocument) {
              return
            }

            this._scripting = this._createScripting()

            this._internalEvents.set('updatefromsandbox', event => {
              if (event?.source !== window) {
                return
              }

              this._updateFromSandbox(event.detail)
            })

            this._internalEvents.set('dispatcheventinsandbox', event => {
              this._scripting?.dispatchEventInSandbox(event.detail)
            })

            this._internalEvents.set('pagechanging', ({
              pageNumber,
              previous
            }) => {
              if (pageNumber === previous) {
                return
              }

              this._dispatchPageClose(previous)

              this._dispatchPageOpen(pageNumber)
            })

            this._internalEvents.set('pagerendered', ({
              pageNumber
            }) => {
              if (!this._pageOpenPending.has(pageNumber)) {
                return
              }

              if (pageNumber !== this._pdfViewer.currentPageNumber) {
                return
              }

              this._dispatchPageOpen(pageNumber)
            })

            this._internalEvents.set('pagesdestroy', async event => {
              await this._dispatchPageClose(this._pdfViewer.currentPageNumber)
              await this._scripting?.dispatchEventInSandbox({
                id: 'doc',
                name: 'WillClose'
              })
              this._closeCapability?.resolve()
            })

            this._domEvents.set('mousedown', event => {
              this._mouseState.isDown = true
            })

            this._domEvents.set('mouseup', event => {
              this._mouseState.isDown = false
            })

            for (const [name, listener] of this._internalEvents) {
              this._eventBus._on(name, listener)
            }

            for (const [name, listener] of this._domEvents) {
              window.addEventListener(name, listener)
            }

            try {
              const docProperties = await this._getDocProperties()

              if (pdfDocument !== this._pdfDocument) {
                return
              }

              await this._scripting.createSandbox({
                objects,
                calculationOrder,
                appInfo: {
                  platform: navigator.platform,
                  language: navigator.language
                },
                docInfo: {
                  ...docProperties,
                  actions: docActions
                }
              })

              this._eventBus.dispatch('sandboxcreated', {
                source: this
              })
            } catch (error) {
              console.error(`PDFScriptingManager.setDocument: "${error?.message}".`)
              await this._destroyScripting()
              return
            }

            await this._scripting?.dispatchEventInSandbox({
              id: 'doc',
              name: 'Open'
            })
            await this._dispatchPageOpen(this._pdfViewer.currentPageNumber, true)
            Promise.resolve().then(() => {
              if (pdfDocument === this._pdfDocument) {
                this._ready = true
              }
            })
          }

          async dispatchWillSave (detail) {
            return this._scripting?.dispatchEventInSandbox({
              id: 'doc',
              name: 'WillSave'
            })
          }

          async dispatchDidSave (detail) {
            return this._scripting?.dispatchEventInSandbox({
              id: 'doc',
              name: 'DidSave'
            })
          }

          async dispatchWillPrint (detail) {
            return this._scripting?.dispatchEventInSandbox({
              id: 'doc',
              name: 'WillPrint'
            })
          }

          async dispatchDidPrint (detail) {
            return this._scripting?.dispatchEventInSandbox({
              id: 'doc',
              name: 'DidPrint'
            })
          }

          get mouseState () {
            return this._mouseState
          }

          get destroyPromise () {
            return this._destroyCapability?.promise || null
          }

          get ready () {
            return this._ready
          }

          get _internalEvents () {
            return (0, _pdfjsLib.shadow)(this, '_internalEvents', new Map())
          }

          get _domEvents () {
            return (0, _pdfjsLib.shadow)(this, '_domEvents', new Map())
          }

          get _pageOpenPending () {
            return (0, _pdfjsLib.shadow)(this, '_pageOpenPending', new Set())
          }

          get _visitedPages () {
            return (0, _pdfjsLib.shadow)(this, '_visitedPages', new Map())
          }

          async _updateFromSandbox (detail) {
            const isInPresentationMode = this._pdfViewer.isInPresentationMode || this._pdfViewer.isChangingPresentationMode
            const {
              id,
              command,
              value
            } = detail

            if (!id) {
              switch (command) {
                case 'clear':
                  console.clear()
                  break

                case 'error':
                  console.error(value)
                  break

                case 'layout':
                  this._pdfViewer.spreadMode = (0, _ui_utils.apiPageLayoutToSpreadMode)(value)
                  break

                case 'page-num':
                  this._pdfViewer.currentPageNumber = value + 1
                  break

                case 'print':
                  await this._pdfViewer.pagesPromise

                  this._eventBus.dispatch('print', {
                    source: this
                  })

                  break

                case 'println':
                  console.log(value)
                  break

                case 'zoom':
                  if (isInPresentationMode) {
                    return
                  }

                  this._pdfViewer.currentScaleValue = value
                  break
              }

              return
            }

            if (isInPresentationMode) {
              if (detail.focus) {
                return
              }
            }

            const element = document.getElementById(id)

            if (element) {
              element.dispatchEvent(new CustomEvent('updatefromsandbox', {
                detail
              }))
            } else {
              delete detail.id
              this._pdfDocument?.annotationStorage.setValue(id, detail)
            }
          }

          async _dispatchPageOpen (pageNumber, initialize = false) {
            const pdfDocument = this._pdfDocument,
              visitedPages = this._visitedPages

            if (initialize) {
              this._closeCapability = (0, _pdfjsLib.createPromiseCapability)()
              this._pageEventsReady = true
            }

            if (!this._pageEventsReady) {
              return
            }

            const pageView = this._pdfViewer.getPageView(pageNumber - 1)

            if (pageView?.renderingState !== _pdf_rendering_queue.RenderingStates.FINISHED) {
              this._pageOpenPending.add(pageNumber)

              return
            }

            this._pageOpenPending.delete(pageNumber)

            const actionsPromise = (async () => {
              const actions = await (!visitedPages.has(pageNumber) ? pageView.pdfPage?.getJSActions() : null)

              if (pdfDocument !== this._pdfDocument) {
                return
              }

              await this._scripting?.dispatchEventInSandbox({
                id: 'page',
                name: 'PageOpen',
                pageNumber,
                actions
              })
            })()

            visitedPages.set(pageNumber, actionsPromise)
          }

          async _dispatchPageClose (pageNumber) {
            const pdfDocument = this._pdfDocument,
              visitedPages = this._visitedPages

            if (!this._pageEventsReady) {
              return
            }

            if (this._pageOpenPending.has(pageNumber)) {
              return
            }

            const actionsPromise = visitedPages.get(pageNumber)

            if (!actionsPromise) {
              return
            }

            visitedPages.set(pageNumber, null)
            await actionsPromise

            if (pdfDocument !== this._pdfDocument) {
              return
            }

            await this._scripting?.dispatchEventInSandbox({
              id: 'page',
              name: 'PageClose',
              pageNumber
            })
          }

          async _getDocProperties () {
            if (this._docPropertiesLookup) {
              return this._docPropertiesLookup(this._pdfDocument)
            }

            const {
              docPropertiesLookup
            } = __w_pdfjs_require__(17)

            return docPropertiesLookup(this._pdfDocument)
          }

          _createScripting () {
            this._destroyCapability = (0, _pdfjsLib.createPromiseCapability)()

            if (this._scripting) {
              throw new Error('_createScripting: Scripting already exists.')
            }

            if (this._scriptingFactory) {
              return this._scriptingFactory.createScripting({
                sandboxBundleSrc: this._sandboxBundleSrc
              })
            }

            const {
              GenericScripting
            } = __w_pdfjs_require__(17)

            return new GenericScripting(this._sandboxBundleSrc)
          }

          async _destroyScripting () {
            if (!this._scripting) {
              this._pdfDocument = null
              this._destroyCapability?.resolve()
              return
            }

            if (this._closeCapability) {
              await Promise.race([this._closeCapability.promise, new Promise(resolve => {
                setTimeout(resolve, 1000)
              })]).catch(reason => {})
              this._closeCapability = null
            }

            this._pdfDocument = null

            try {
              await this._scripting.destroySandbox()
            } catch (ex) {}

            for (const [name, listener] of this._internalEvents) {
              this._eventBus._off(name, listener)
            }

            this._internalEvents.clear()

            for (const [name, listener] of this._domEvents) {
              window.removeEventListener(name, listener)
            }

            this._domEvents.clear()

            this._pageOpenPending.clear()

            this._visitedPages.clear()

            this._scripting = null
            delete this._mouseState.isDown
            this._pageEventsReady = false
            this._ready = false
            this._destroyCapability?.resolve()
          }

        }

        exports.PDFScriptingManager = PDFScriptingManager

        /***/
      }),
      /* 17 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.docPropertiesLookup = docPropertiesLookup
        exports.GenericScripting = void 0

        var _pdfjsLib = __w_pdfjs_require__(2)

        async function docPropertiesLookup (pdfDocument) {
          const url = '',
            baseUrl = url.split('#')[0]
          let {
            info,
            metadata,
            contentDispositionFilename,
            contentLength
          } = await pdfDocument.getMetadata()

          if (!contentLength) {
            const {
              length
            } = await pdfDocument.getDownloadInfo()
            contentLength = length
          }

          return {
            ...info,
            baseURL: baseUrl,
            filesize: contentLength,
            filename: contentDispositionFilename || (0, _pdfjsLib.getPdfFilenameFromUrl)(url),
            metadata: metadata?.getRaw(),
            authors: metadata?.get('dc:creator'),
            numPages: pdfDocument.numPages,
            URL: url
          }
        }

        class GenericScripting {
          constructor (sandboxBundleSrc) {
            this._ready = (0, _pdfjsLib.loadScript)(sandboxBundleSrc, true).then(() => {
              return window.pdfjsSandbox.QuickJSSandbox()
            })
          }

          async createSandbox (data) {
            const sandbox = await this._ready
            sandbox.create(data)
          }

          async dispatchEventInSandbox (event) {
            const sandbox = await this._ready
            sandbox.dispatchEvent(event)
          }

          async destroySandbox () {
            const sandbox = await this._ready
            sandbox.nukeSandbox()
          }

        }

        exports.GenericScripting = GenericScripting

        /***/
      }),
      /* 18 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.PDFSinglePageViewer = void 0

        var _base_viewer = __w_pdfjs_require__(19)

        var _pdfjsLib = __w_pdfjs_require__(2)

        class PDFSinglePageViewer extends _base_viewer.BaseViewer {
          constructor (options) {
            super(options)

            this.eventBus._on('pagesinit', evt => {
              this._ensurePageViewVisible()
            })
          }

          get _viewerElement () {
            return (0, _pdfjsLib.shadow)(this, '_viewerElement', this._shadowViewer)
          }

          get _pageWidthScaleFactor () {
            return 1
          }

          _resetView () {
            super._resetView()

            this._previousPageNumber = 1
            this._shadowViewer = document.createDocumentFragment()
            this._updateScrollDown = null
          }

          _ensurePageViewVisible () {
            const pageView = this._pages[this._currentPageNumber - 1]
            const previousPageView = this._pages[this._previousPageNumber - 1]
            const viewerNodes = this.viewer.childNodes

            switch (viewerNodes.length) {
              case 0:
                this.viewer.appendChild(pageView.div)
                break

              case 1:
                if (viewerNodes[0] !== previousPageView.div) {
                  throw new Error('_ensurePageViewVisible: Unexpected previously visible page.')
                }

                if (pageView === previousPageView) {
                  break
                }

                this._shadowViewer.appendChild(previousPageView.div)

                this.viewer.appendChild(pageView.div)
                this.container.scrollTop = 0
                break

              default:
                throw new Error('_ensurePageViewVisible: Only one page should be visible at a time.')
            }

            this._previousPageNumber = this._currentPageNumber
          }

          _scrollUpdate () {
            if (this._updateScrollDown) {
              this._updateScrollDown()
            }

            super._scrollUpdate()
          }

          _scrollIntoView ({
            pageDiv,
            pageSpot = null,
            pageNumber = null
          }) {
            if (pageNumber) {
              this._setCurrentPageNumber(pageNumber)
            }

            const scrolledDown = this._currentPageNumber >= this._previousPageNumber

            this._ensurePageViewVisible()

            this.update()

            super._scrollIntoView({
              pageDiv,
              pageSpot,
              pageNumber
            })

            this._updateScrollDown = () => {
              this.scroll.down = scrolledDown
              this._updateScrollDown = null
            }
          }

          _getVisiblePages () {
            return this._getCurrentVisiblePage()
          }

          _updateHelper (visiblePages) {}

          get _isScrollModeHorizontal () {
            return (0, _pdfjsLib.shadow)(this, '_isScrollModeHorizontal', false)
          }

          _updateScrollMode () {}

          _updateSpreadMode () {}

          _getPageAdvance () {
            return 1
          }

        }

        exports.PDFSinglePageViewer = PDFSinglePageViewer

        /***/
      }),
      /* 19 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.BaseViewer = void 0

        var _pdfjsLib = __w_pdfjs_require__(2)

        var _ui_utils = __w_pdfjs_require__(5)

        var _pdf_rendering_queue = __w_pdfjs_require__(15)

        var _annotation_layer_builder = __w_pdfjs_require__(1)

        var _l10n_utils = __w_pdfjs_require__(3)

        var _pdf_page_view = __w_pdfjs_require__(14)

        var _pdf_link_service = __w_pdfjs_require__(4)

        var _text_layer_builder = __w_pdfjs_require__(6)

        var _xfa_layer_builder = __w_pdfjs_require__(20)

        const DEFAULT_CACHE_SIZE = 10

        function PDFPageViewBuffer (size) {
          const data = []

          this.push = function (view) {
            const i = data.indexOf(view)

            if (i >= 0) {
              data.splice(i, 1)
            }

            data.push(view)

            if (data.length > size) {
              data.shift().destroy()
            }
          }

          this.resize = function (newSize, pagesToKeep) {
            size = newSize

            if (pagesToKeep) {
              const pageIdsToKeep = new Set()

              for (let i = 0, iMax = pagesToKeep.length; i < iMax; ++i) {
                pageIdsToKeep.add(pagesToKeep[i].id)
              }

              (0, _ui_utils.moveToEndOfArray)(data, function (page) {
                return pageIdsToKeep.has(page.id)
              })
            }

            while (data.length > size) {
              data.shift().destroy()
            }
          }

          this.has = function (view) {
            return data.includes(view)
          }
        }

        function isSameScale (oldScale, newScale) {
          if (newScale === oldScale) {
            return true
          }

          if (Math.abs(newScale - oldScale) < 1e-15) {
            return true
          }

          return false
        }

        class BaseViewer {
          constructor (options) {
            if (this.constructor === BaseViewer) {
              throw new Error('Cannot initialize BaseViewer.')
            }

            const viewerVersion = '2.8.335'

            if (_pdfjsLib.version !== viewerVersion) {
              throw new Error(`The API version "${_pdfjsLib.version}" does not match the Viewer version "${viewerVersion}".`)
            }

            this._name = this.constructor.name
            this.container = options.container
            this.viewer = options.viewer || options.container.firstElementChild

            if (!(this.container?.tagName.toUpperCase() === 'DIV' && this.viewer?.tagName.toUpperCase() === 'DIV')) {
              throw new Error('Invalid `container` and/or `viewer` option.')
            }

            if (this.container.offsetParent && getComputedStyle(this.container).position !== 'absolute') {
              throw new Error('The `container` must be absolutely positioned.')
            }

            this.eventBus = options.eventBus
            this.linkService = options.linkService || new _pdf_link_service.SimpleLinkService()
            this.downloadManager = options.downloadManager || null
            this.findController = options.findController || null
            this._scriptingManager = options.scriptingManager || null
            this.removePageBorders = options.removePageBorders || false
            this.textLayerMode = Number.isInteger(options.textLayerMode) ? options.textLayerMode : _ui_utils.TextLayerMode.ENABLE
            this.imageResourcesPath = options.imageResourcesPath || ''
            this.renderInteractiveForms = options.renderInteractiveForms !== false
            this.enablePrintAutoRotate = options.enablePrintAutoRotate || false
            this.renderer = options.renderer || _ui_utils.RendererType.CANVAS
            this.enableWebGL = options.enableWebGL || false
            this.useOnlyCssZoom = options.useOnlyCssZoom || false
            this.maxCanvasPixels = options.maxCanvasPixels
            this.l10n = options.l10n || _l10n_utils.NullL10n
            this.enableScripting = options.enableScripting === true && !!this._scriptingManager
            this.defaultRenderingQueue = !options.renderingQueue

            if (this.defaultRenderingQueue) {
              this.renderingQueue = new _pdf_rendering_queue.PDFRenderingQueue()
              this.renderingQueue.setViewer(this)
            } else {
              this.renderingQueue = options.renderingQueue
            }

            this.scroll = (0, _ui_utils.watchScroll)(this.container, this._scrollUpdate.bind(this))
            this.presentationModeState = _ui_utils.PresentationModeState.UNKNOWN
            this._onBeforeDraw = this._onAfterDraw = null

            this._resetView()

            if (this.removePageBorders) {
              this.viewer.classList.add('removePageBorders')
            }

            Promise.resolve().then(() => {
              this.eventBus.dispatch('baseviewerinit', {
                source: this
              })
            })
          }

          get pagesCount () {
            return this._pages.length
          }

          getPageView (index) {
            return this._pages[index]
          }

          get pageViewsReady () {
            if (!this._pagesCapability.settled) {
              return false
            }

            return this._pages.every(function (pageView) {
              return pageView?.pdfPage
            })
          }

          get currentPageNumber () {
            return this._currentPageNumber
          }

          set currentPageNumber (val) {
            if (!Number.isInteger(val)) {
              throw new Error('Invalid page number.')
            }

            if (!this.pdfDocument) {
              return
            }

            if (!this._setCurrentPageNumber(val, true)) {
              console.error(`${this._name}.currentPageNumber: "${val}" is not a valid page.`)
            }
          }

          _setCurrentPageNumber (val, resetCurrentPageView = false) {
            if (this._currentPageNumber === val) {
              if (resetCurrentPageView) {
                this._resetCurrentPageView()
              }

              return true
            }

            if (!(0 < val && val <= this.pagesCount)) {
              return false
            }

            const previous = this._currentPageNumber
            this._currentPageNumber = val
            this.eventBus.dispatch('pagechanging', {
              source: this,
              pageNumber: val,
              pageLabel: this._pageLabels?.[val - 1] ?? null,
              previous
            })

            if (resetCurrentPageView) {
              this._resetCurrentPageView()
            }

            return true
          }

          get currentPageLabel () {
            return this._pageLabels?.[this._currentPageNumber - 1] ?? null
          }

          set currentPageLabel (val) {
            if (!this.pdfDocument) {
              return
            }

            let page = val | 0

            if (this._pageLabels) {
              const i = this._pageLabels.indexOf(val)

              if (i >= 0) {
                page = i + 1
              }
            }

            if (!this._setCurrentPageNumber(page, true)) {
              console.error(`${this._name}.currentPageLabel: "${val}" is not a valid page.`)
            }
          }

          get currentScale () {
            return this._currentScale !== _ui_utils.UNKNOWN_SCALE ? this._currentScale : _ui_utils.DEFAULT_SCALE
          }

          set currentScale (val) {
            if (isNaN(val)) {
              throw new Error('Invalid numeric scale.')
            }

            if (!this.pdfDocument) {
              return
            }

            this._setScale(val, false)
          }

          get currentScaleValue () {
            return this._currentScaleValue
          }

          set currentScaleValue (val) {
            if (!this.pdfDocument) {
              return
            }

            this._setScale(val, false)
          }

          get pagesRotation () {
            return this._pagesRotation
          }

          set pagesRotation (rotation) {
            if (!(0, _ui_utils.isValidRotation)(rotation)) {
              throw new Error('Invalid pages rotation angle.')
            }

            if (!this.pdfDocument) {
              return
            }

            rotation %= 360

            if (rotation < 0) {
              rotation += 360
            }

            if (this._pagesRotation === rotation) {
              return
            }

            this._pagesRotation = rotation
            const pageNumber = this._currentPageNumber

            for (let i = 0, ii = this._pages.length; i < ii; i++) {
              const pageView = this._pages[i]
              pageView.update(pageView.scale, rotation)
            }

            if (this._currentScaleValue) {
              this._setScale(this._currentScaleValue, true)
            }

            this.eventBus.dispatch('rotationchanging', {
              source: this,
              pagesRotation: rotation,
              pageNumber
            })

            if (this.defaultRenderingQueue) {
              this.update()
            }
          }

          get firstPagePromise () {
            return this.pdfDocument ? this._firstPageCapability.promise : null
          }

          get onePageRendered () {
            return this.pdfDocument ? this._onePageRenderedCapability.promise : null
          }

          get pagesPromise () {
            return this.pdfDocument ? this._pagesCapability.promise : null
          }

          get _viewerElement () {
            throw new Error('Not implemented: _viewerElement')
          }

          _onePageRenderedOrForceFetch () {
            if (!this.container.offsetParent || this._getVisiblePages().views.length === 0) {
              return Promise.resolve()
            }

            return this._onePageRenderedCapability.promise
          }

          setDocument (pdfDocument) {
            if (this.pdfDocument) {
              this.eventBus.dispatch('pagesdestroy', {
                source: this
              })

              this._cancelRendering()

              this._resetView()

              if (this.findController) {
                this.findController.setDocument(null)
              }

              if (this._scriptingManager) {
                this._scriptingManager.setDocument(null)
              }
            }

            this.pdfDocument = pdfDocument

            if (!pdfDocument) {
              return
            }

            const isPureXfa = pdfDocument.isPureXfa
            const pagesCount = pdfDocument.numPages
            const firstPagePromise = pdfDocument.getPage(1)
            const optionalContentConfigPromise = pdfDocument.getOptionalContentConfig()

            this._pagesCapability.promise.then(() => {
              this.eventBus.dispatch('pagesloaded', {
                source: this,
                pagesCount
              })
            })

            this._onBeforeDraw = evt => {
              const pageView = this._pages[evt.pageNumber - 1]

              if (!pageView) {
                return
              }

              this._buffer.push(pageView)
            }

            this.eventBus._on('pagerender', this._onBeforeDraw)

            this._onAfterDraw = evt => {
              if (evt.cssTransform || this._onePageRenderedCapability.settled) {
                return
              }

              this._onePageRenderedCapability.resolve()

              this.eventBus._off('pagerendered', this._onAfterDraw)

              this._onAfterDraw = null
            }

            this.eventBus._on('pagerendered', this._onAfterDraw)

            firstPagePromise.then(firstPdfPage => {
              this._firstPageCapability.resolve(firstPdfPage)

              this._optionalContentConfigPromise = optionalContentConfigPromise
              const scale = this.currentScale
              const viewport = firstPdfPage.getViewport({
                scale: scale * _ui_utils.CSS_UNITS
              })
              const textLayerFactory = this.textLayerMode !== _ui_utils.TextLayerMode.DISABLE ? this : null
              const xfaLayerFactory = isPureXfa ? this : null

              for (let pageNum = 1; pageNum <= pagesCount; ++pageNum) {
                const pageView = new _pdf_page_view.PDFPageView({
                  container: this._viewerElement,
                  eventBus: this.eventBus,
                  id: pageNum,
                  scale,
                  defaultViewport: viewport.clone(),
                  optionalContentConfigPromise,
                  renderingQueue: this.renderingQueue,
                  textLayerFactory,
                  textLayerMode: this.textLayerMode,
                  annotationLayerFactory: this,
                  xfaLayerFactory,
                  imageResourcesPath: this.imageResourcesPath,
                  renderInteractiveForms: this.renderInteractiveForms,
                  renderer: this.renderer,
                  enableWebGL: this.enableWebGL,
                  useOnlyCssZoom: this.useOnlyCssZoom,
                  maxCanvasPixels: this.maxCanvasPixels,
                  l10n: this.l10n,
                  enableScripting: this.enableScripting
                })

                this._pages.push(pageView)
              }

              const firstPageView = this._pages[0]

              if (firstPageView) {
                firstPageView.setPdfPage(firstPdfPage)
                this.linkService.cachePageRef(1, firstPdfPage.ref)
              }

              if (this._spreadMode !== _ui_utils.SpreadMode.NONE) {
                this._updateSpreadMode()
              }

              this._onePageRenderedOrForceFetch().then(() => {
                if (this.findController) {
                  this.findController.setDocument(pdfDocument)
                }

                if (this.enableScripting) {
                  this._scriptingManager.setDocument(pdfDocument)
                }

                if (pdfDocument.loadingParams.disableAutoFetch || pagesCount > 7500) {
                  this._pagesCapability.resolve()

                  return
                }

                let getPagesLeft = pagesCount - 1

                if (getPagesLeft <= 0) {
                  this._pagesCapability.resolve()

                  return
                }

                for (let pageNum = 2; pageNum <= pagesCount; ++pageNum) {
                  pdfDocument.getPage(pageNum).then(pdfPage => {
                    const pageView = this._pages[pageNum - 1]

                    if (!pageView.pdfPage) {
                      pageView.setPdfPage(pdfPage)
                    }

                    this.linkService.cachePageRef(pageNum, pdfPage.ref)

                    if (--getPagesLeft === 0) {
                      this._pagesCapability.resolve()
                    }
                  }, reason => {
                    console.error(`Unable to get page ${pageNum} to initialize viewer`, reason)

                    if (--getPagesLeft === 0) {
                      this._pagesCapability.resolve()
                    }
                  })
                }
              })

              this.eventBus.dispatch('pagesinit', {
                source: this
              })

              if (this.defaultRenderingQueue) {
                this.update()
              }
            }).catch(reason => {
              console.error('Unable to initialize viewer', reason)
            })
          }

          setPageLabels (labels) {
            if (!this.pdfDocument) {
              return
            }

            if (!labels) {
              this._pageLabels = null
            } else if (!(Array.isArray(labels) && this.pdfDocument.numPages === labels.length)) {
              this._pageLabels = null
              console.error(`${this._name}.setPageLabels: Invalid page labels.`)
            } else {
              this._pageLabels = labels
            }

            for (let i = 0, ii = this._pages.length; i < ii; i++) {
              this._pages[i].setPageLabel(this._pageLabels?.[i] ?? null)
            }
          }

          _resetView () {
            this._pages = []
            this._currentPageNumber = 1
            this._currentScale = _ui_utils.UNKNOWN_SCALE
            this._currentScaleValue = null
            this._pageLabels = null
            this._buffer = new PDFPageViewBuffer(DEFAULT_CACHE_SIZE)
            this._location = null
            this._pagesRotation = 0
            this._optionalContentConfigPromise = null
            this._pagesRequests = new WeakMap()
            this._firstPageCapability = (0, _pdfjsLib.createPromiseCapability)()
            this._onePageRenderedCapability = (0, _pdfjsLib.createPromiseCapability)()
            this._pagesCapability = (0, _pdfjsLib.createPromiseCapability)()
            this._scrollMode = _ui_utils.ScrollMode.VERTICAL
            this._spreadMode = _ui_utils.SpreadMode.NONE

            if (this._onBeforeDraw) {
              this.eventBus._off('pagerender', this._onBeforeDraw)

              this._onBeforeDraw = null
            }

            if (this._onAfterDraw) {
              this.eventBus._off('pagerendered', this._onAfterDraw)

              this._onAfterDraw = null
            }

            this.viewer.textContent = ''

            this._updateScrollMode()
          }

          _scrollUpdate () {
            if (this.pagesCount === 0) {
              return
            }

            this.update()
          }

          _scrollIntoView ({
            pageDiv,
            pageSpot = null,
            pageNumber = null
          }) {
            (0, _ui_utils.scrollIntoView)(pageDiv, pageSpot)
          }

          _setScaleUpdatePages (newScale, newValue, noScroll = false, preset = false) {
            this._currentScaleValue = newValue.toString()

            if (isSameScale(this._currentScale, newScale)) {
              if (preset) {
                this.eventBus.dispatch('scalechanging', {
                  source: this,
                  scale: newScale,
                  presetValue: newValue
                })
              }

              return
            }

            for (let i = 0, ii = this._pages.length; i < ii; i++) {
              this._pages[i].update(newScale)
            }

            this._currentScale = newScale

            if (!noScroll) {
              let page = this._currentPageNumber,
                dest

              if (this._location && !(this.isInPresentationMode || this.isChangingPresentationMode)) {
                page = this._location.pageNumber
                dest = [null, {
                  name: 'XYZ'
                }, this._location.left, this._location.top, null]
              }

              this.scrollPageIntoView({
                pageNumber: page,
                destArray: dest,
                allowNegativeOffset: true
              })
            }

            this.eventBus.dispatch('scalechanging', {
              source: this,
              scale: newScale,
              presetValue: preset ? newValue : undefined
            })

            if (this.defaultRenderingQueue) {
              this.update()
            }
          }

          get _pageWidthScaleFactor () {
            if (this._spreadMode !== _ui_utils.SpreadMode.NONE && this._scrollMode !== _ui_utils.ScrollMode.HORIZONTAL && !this.isInPresentationMode) {
              return 2
            }

            return 1
          }

          _setScale (value, noScroll = false) {
            let scale = parseFloat(value)

            if (scale > 0) {
              this._setScaleUpdatePages(scale, value, noScroll, false)
            } else {
              const currentPage = this._pages[this._currentPageNumber - 1]

              if (!currentPage) {
                return
              }

              const noPadding = this.isInPresentationMode || this.removePageBorders
              let hPadding = noPadding ? 0 : _ui_utils.SCROLLBAR_PADDING
              let vPadding = noPadding ? 0 : _ui_utils.VERTICAL_PADDING

              if (!noPadding && this._isScrollModeHorizontal) {
                [hPadding, vPadding] = [vPadding, hPadding]
              }

              const pageWidthScale = (this.container.clientWidth - hPadding) / currentPage.width * currentPage.scale / this._pageWidthScaleFactor
              const pageHeightScale = (this.container.clientHeight - vPadding) / currentPage.height * currentPage.scale

              switch (value) {
                case 'page-actual':
                  scale = 1
                  break

                case 'page-width':
                  scale = pageWidthScale
                  break

                case 'page-height':
                  scale = pageHeightScale
                  break

                case 'page-fit':
                  scale = Math.min(pageWidthScale, pageHeightScale)
                  break

                case 'auto':
                  const horizontalScale = (0, _ui_utils.isPortraitOrientation)(currentPage) ? pageWidthScale : Math.min(pageHeightScale, pageWidthScale)
                  scale = Math.min(_ui_utils.MAX_AUTO_SCALE, horizontalScale)
                  break

                default:
                  console.error(`${this._name}._setScale: "${value}" is an unknown zoom value.`)
                  return
              }

              this._setScaleUpdatePages(scale, value, noScroll, true)
            }
          }

          _resetCurrentPageView () {
            if (this.isInPresentationMode) {
              this._setScale(this._currentScaleValue, true)
            }

            const pageView = this._pages[this._currentPageNumber - 1]

            this._scrollIntoView({
              pageDiv: pageView.div
            })
          }

          pageLabelToPageNumber (label) {
            if (!this._pageLabels) {
              return null
            }

            const i = this._pageLabels.indexOf(label)

            if (i < 0) {
              return null
            }

            return i + 1
          }

          scrollPageIntoView ({
            pageNumber,
            destArray = null,
            allowNegativeOffset = false,
            ignoreDestinationZoom = false
          }) {
            if (!this.pdfDocument) {
              return
            }

            const pageView = Number.isInteger(pageNumber) && this._pages[pageNumber - 1]

            if (!pageView) {
              console.error(`${this._name}.scrollPageIntoView: ` + `"${pageNumber}" is not a valid pageNumber parameter.`)
              return
            }

            if (this.isInPresentationMode || !destArray) {
              this._setCurrentPageNumber(pageNumber, true)

              return
            }

            let x = 0,
              y = 0
            let width = 0,
              height = 0,
              widthScale,
              heightScale
            const changeOrientation = pageView.rotation % 180 !== 0
            const pageWidth = (changeOrientation ? pageView.height : pageView.width) / pageView.scale / _ui_utils.CSS_UNITS
            const pageHeight = (changeOrientation ? pageView.width : pageView.height) / pageView.scale / _ui_utils.CSS_UNITS
            let scale = 0

            switch (destArray[1].name) {
              case 'XYZ':
                x = destArray[2]
                y = destArray[3]
                scale = destArray[4]
                x = x !== null ? x : 0
                y = y !== null ? y : pageHeight
                break

              case 'Fit':
              case 'FitB':
                scale = 'page-fit'
                break

              case 'FitH':
              case 'FitBH':
                y = destArray[2]
                scale = 'page-width'

                if (y === null && this._location) {
                  x = this._location.left
                  y = this._location.top
                } else if (typeof y !== 'number') {
                  y = pageHeight
                }

                break

              case 'FitV':
              case 'FitBV':
                x = destArray[2]
                width = pageWidth
                height = pageHeight
                scale = 'page-height'
                break

              case 'FitR':
                x = destArray[2]
                y = destArray[3]
                width = destArray[4] - x
                height = destArray[5] - y
                const hPadding = this.removePageBorders ? 0 : _ui_utils.SCROLLBAR_PADDING
                const vPadding = this.removePageBorders ? 0 : _ui_utils.VERTICAL_PADDING
                widthScale = (this.container.clientWidth - hPadding) / width / _ui_utils.CSS_UNITS
                heightScale = (this.container.clientHeight - vPadding) / height / _ui_utils.CSS_UNITS
                scale = Math.min(Math.abs(widthScale), Math.abs(heightScale))
                break

              default:
                console.error(`${this._name}.scrollPageIntoView: ` + `"${destArray[1].name}" is not a valid destination type.`)
                return
            }

            if (!ignoreDestinationZoom) {
              if (scale && scale !== this._currentScale) {
                this.currentScaleValue = scale
              } else if (this._currentScale === _ui_utils.UNKNOWN_SCALE) {
                this.currentScaleValue = _ui_utils.DEFAULT_SCALE_VALUE
              }
            }

            if (scale === 'page-fit' && !destArray[4]) {
              this._scrollIntoView({
                pageDiv: pageView.div,
                pageNumber
              })

              return
            }

            const boundingRect = [pageView.viewport.convertToViewportPoint(x, y), pageView.viewport.convertToViewportPoint(x + width, y + height)]
            let left = Math.min(boundingRect[0][0], boundingRect[1][0])
            let top = Math.min(boundingRect[0][1], boundingRect[1][1])

            if (!allowNegativeOffset) {
              left = Math.max(left, 0)
              top = Math.max(top, 0)
            }

            this._scrollIntoView({
              pageDiv: pageView.div,
              pageSpot: {
                left,
                top
              },
              pageNumber
            })
          }

          _updateLocation (firstPage) {
            const currentScale = this._currentScale
            const currentScaleValue = this._currentScaleValue
            const normalizedScaleValue = parseFloat(currentScaleValue) === currentScale ? Math.round(currentScale * 10000) / 100 : currentScaleValue
            const pageNumber = firstPage.id
            let pdfOpenParams = '#page=' + pageNumber
            pdfOpenParams += '&zoom=' + normalizedScaleValue
            const currentPageView = this._pages[pageNumber - 1]
            const container = this.container
            const topLeft = currentPageView.getPagePoint(container.scrollLeft - firstPage.x, container.scrollTop - firstPage.y)
            const intLeft = Math.round(topLeft[0])
            const intTop = Math.round(topLeft[1])
            pdfOpenParams += ',' + intLeft + ',' + intTop
            this._location = {
              pageNumber,
              scale: normalizedScaleValue,
              top: intTop,
              left: intLeft,
              rotation: this._pagesRotation,
              pdfOpenParams
            }
          }

          _updateHelper (visiblePages) {
            throw new Error('Not implemented: _updateHelper')
          }

          update () {
            const visible = this._getVisiblePages()

            const visiblePages = visible.views,
              numVisiblePages = visiblePages.length

            if (numVisiblePages === 0) {
              return
            }

            const newCacheSize = Math.max(DEFAULT_CACHE_SIZE, 2 * numVisiblePages + 1)

            this._buffer.resize(newCacheSize, visiblePages)

            this.renderingQueue.renderHighestPriority(visible)

            this._updateHelper(visiblePages)

            this._updateLocation(visible.first)

            this.eventBus.dispatch('updateviewarea', {
              source: this,
              location: this._location
            })
          }

          containsElement (element) {
            return this.container.contains(element)
          }

          focus () {
            this.container.focus()
          }

          get _isScrollModeHorizontal () {
            return this.isInPresentationMode ? false : this._scrollMode === _ui_utils.ScrollMode.HORIZONTAL
          }

          get _isContainerRtl () {
            return getComputedStyle(this.container).direction === 'rtl'
          }

          get isInPresentationMode () {
            return this.presentationModeState === _ui_utils.PresentationModeState.FULLSCREEN
          }

          get isChangingPresentationMode () {
            return this.presentationModeState === _ui_utils.PresentationModeState.CHANGING
          }

          get isHorizontalScrollbarEnabled () {
            return this.isInPresentationMode ? false : this.container.scrollWidth > this.container.clientWidth
          }

          get isVerticalScrollbarEnabled () {
            return this.isInPresentationMode ? false : this.container.scrollHeight > this.container.clientHeight
          }

          _getCurrentVisiblePage () {
            if (!this.pagesCount) {
              return {
                views: []
              }
            }

            const pageView = this._pages[this._currentPageNumber - 1]
            const element = pageView.div
            const view = {
              id: pageView.id,
              x: element.offsetLeft + element.clientLeft,
              y: element.offsetTop + element.clientTop,
              view: pageView
            }
            return {
              first: view,
              last: view,
              views: [view]
            }
          }

          _getVisiblePages () {
            return (0, _ui_utils.getVisibleElements)({
              scrollEl: this.container,
              views: this._pages,
              sortByVisibility: true,
              horizontal: this._isScrollModeHorizontal,
              rtl: this._isScrollModeHorizontal && this._isContainerRtl
            })
          }

          isPageVisible (pageNumber) {
            if (!this.pdfDocument) {
              return false
            }

            if (!(Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber <= this.pagesCount)) {
              console.error(`${this._name}.isPageVisible: "${pageNumber}" is not a valid page.`)
              return false
            }

            return this._getVisiblePages().views.some(function (view) {
              return view.id === pageNumber
            })
          }

          isPageCached (pageNumber) {
            if (!this.pdfDocument || !this._buffer) {
              return false
            }

            if (!(Number.isInteger(pageNumber) && pageNumber > 0 && pageNumber <= this.pagesCount)) {
              console.error(`${this._name}.isPageCached: "${pageNumber}" is not a valid page.`)
              return false
            }

            const pageView = this._pages[pageNumber - 1]

            if (!pageView) {
              return false
            }

            return this._buffer.has(pageView)
          }

          cleanup () {
            for (let i = 0, ii = this._pages.length; i < ii; i++) {
              if (this._pages[i] && this._pages[i].renderingState !== _pdf_rendering_queue.RenderingStates.FINISHED) {
                this._pages[i].reset()
              }
            }
          }

          _cancelRendering () {
            for (let i = 0, ii = this._pages.length; i < ii; i++) {
              if (this._pages[i]) {
                this._pages[i].cancelRendering()
              }
            }
          }

          _ensurePdfPageLoaded (pageView) {
            if (pageView.pdfPage) {
              return Promise.resolve(pageView.pdfPage)
            }

            if (this._pagesRequests.has(pageView)) {
              return this._pagesRequests.get(pageView)
            }

            const promise = this.pdfDocument.getPage(pageView.id).then(pdfPage => {
              if (!pageView.pdfPage) {
                pageView.setPdfPage(pdfPage)
              }

              this._pagesRequests.delete(pageView)

              return pdfPage
            }).catch(reason => {
              console.error('Unable to get page for page view', reason)

              this._pagesRequests.delete(pageView)
            })

            this._pagesRequests.set(pageView, promise)

            return promise
          }

          forceRendering (currentlyVisiblePages) {
            const visiblePages = currentlyVisiblePages || this._getVisiblePages()

            const scrollAhead = this._isScrollModeHorizontal ? this.scroll.right : this.scroll.down
            const pageView = this.renderingQueue.getHighestPriority(visiblePages, this._pages, scrollAhead)

            if (pageView) {
              this._ensurePdfPageLoaded(pageView).then(() => {
                this.renderingQueue.renderView(pageView)
              })

              return true
            }

            return false
          }

          createTextLayerBuilder (textLayerDiv, pageIndex, viewport, enhanceTextSelection = false, eventBus) {
            return new _text_layer_builder.TextLayerBuilder({
              textLayerDiv,
              eventBus,
              pageIndex,
              viewport,
              findController: this.isInPresentationMode ? null : this.findController,
              enhanceTextSelection: this.isInPresentationMode ? false : enhanceTextSelection
            })
          }

          createAnnotationLayerBuilder (pageDiv, pdfPage, annotationStorage = null, imageResourcesPath = '', renderInteractiveForms = false, l10n = _l10n_utils.NullL10n, enableScripting = false, hasJSActionsPromise = null, mouseState = null) {
            return new _annotation_layer_builder.AnnotationLayerBuilder({
              pageDiv,
              pdfPage,
              annotationStorage: annotationStorage || this.pdfDocument?.annotationStorage,
              imageResourcesPath,
              renderInteractiveForms,
              linkService: this.linkService,
              downloadManager: this.downloadManager,
              l10n,
              enableScripting,
              hasJSActionsPromise: hasJSActionsPromise || this.pdfDocument?.hasJSActions(),
              mouseState: mouseState || this._scriptingManager?.mouseState
            })
          }

          createXfaLayerBuilder (pageDiv, pdfPage) {
            return new _xfa_layer_builder.XfaLayerBuilder({
              pageDiv,
              pdfPage
            })
          }

          get hasEqualPageSizes () {
            const firstPageView = this._pages[0]

            for (let i = 1, ii = this._pages.length; i < ii; ++i) {
              const pageView = this._pages[i]

              if (pageView.width !== firstPageView.width || pageView.height !== firstPageView.height) {
                return false
              }
            }

            return true
          }

          getPagesOverview () {
            return this._pages.map(pageView => {
              const viewport = pageView.pdfPage.getViewport({
                scale: 1
              })

              if (!this.enablePrintAutoRotate || (0, _ui_utils.isPortraitOrientation)(viewport)) {
                return {
                  width: viewport.width,
                  height: viewport.height,
                  rotation: viewport.rotation
                }
              }

              return {
                width: viewport.height,
                height: viewport.width,
                rotation: (viewport.rotation - 90) % 360
              }
            })
          }

          get optionalContentConfigPromise () {
            if (!this.pdfDocument) {
              return Promise.resolve(null)
            }

            if (!this._optionalContentConfigPromise) {
              return this.pdfDocument.getOptionalContentConfig()
            }

            return this._optionalContentConfigPromise
          }

          set optionalContentConfigPromise (promise) {
            if (!(promise instanceof Promise)) {
              throw new Error(`Invalid optionalContentConfigPromise: ${promise}`)
            }

            if (!this.pdfDocument) {
              return
            }

            if (!this._optionalContentConfigPromise) {
              return
            }

            this._optionalContentConfigPromise = promise

            for (const pageView of this._pages) {
              pageView.update(pageView.scale, pageView.rotation, promise)
            }

            this.update()
            this.eventBus.dispatch('optionalcontentconfigchanged', {
              source: this,
              promise
            })
          }

          get scrollMode () {
            return this._scrollMode
          }

          set scrollMode (mode) {
            if (this._scrollMode === mode) {
              return
            }

            if (!(0, _ui_utils.isValidScrollMode)(mode)) {
              throw new Error(`Invalid scroll mode: ${mode}`)
            }

            this._scrollMode = mode
            this.eventBus.dispatch('scrollmodechanged', {
              source: this,
              mode
            })

            this._updateScrollMode(this._currentPageNumber)
          }

          _updateScrollMode (pageNumber = null) {
            const scrollMode = this._scrollMode,
              viewer = this.viewer
            viewer.classList.toggle('scrollHorizontal', scrollMode === _ui_utils.ScrollMode.HORIZONTAL)
            viewer.classList.toggle('scrollWrapped', scrollMode === _ui_utils.ScrollMode.WRAPPED)

            if (!this.pdfDocument || !pageNumber) {
              return
            }

            if (this._currentScaleValue && isNaN(this._currentScaleValue)) {
              this._setScale(this._currentScaleValue, true)
            }

            this._setCurrentPageNumber(pageNumber, true)

            this.update()
          }

          get spreadMode () {
            return this._spreadMode
          }

          set spreadMode (mode) {
            if (this._spreadMode === mode) {
              return
            }

            if (!(0, _ui_utils.isValidSpreadMode)(mode)) {
              throw new Error(`Invalid spread mode: ${mode}`)
            }

            this._spreadMode = mode
            this.eventBus.dispatch('spreadmodechanged', {
              source: this,
              mode
            })

            this._updateSpreadMode(this._currentPageNumber)
          }

          _updateSpreadMode (pageNumber = null) {
            if (!this.pdfDocument) {
              return
            }

            const viewer = this.viewer,
              pages = this._pages
            viewer.textContent = ''

            if (this._spreadMode === _ui_utils.SpreadMode.NONE) {
              for (let i = 0, iMax = pages.length; i < iMax; ++i) {
                viewer.appendChild(pages[i].div)
              }
            } else {
              const parity = this._spreadMode - 1
              let spread = null

              for (let i = 0, iMax = pages.length; i < iMax; ++i) {
                if (spread === null) {
                  spread = document.createElement('div')
                  spread.className = 'spread'
                  viewer.appendChild(spread)
                } else if (i % 2 === parity) {
                  spread = spread.cloneNode(false)
                  viewer.appendChild(spread)
                }

                spread.appendChild(pages[i].div)
              }
            }

            if (!pageNumber) {
              return
            }

            if (this._currentScaleValue && isNaN(this._currentScaleValue)) {
              this._setScale(this._currentScaleValue, true)
            }

            this._setCurrentPageNumber(pageNumber, true)

            this.update()
          }

          _getPageAdvance (currentPageNumber, previous = false) {
            if (this.isInPresentationMode) {
              return 1
            }

            switch (this._scrollMode) {
              case _ui_utils.ScrollMode.WRAPPED: {
                const {
                    views
                  } = this._getVisiblePages(),
                  pageLayout = new Map()

                for (const {
                  id,
                  y,
                  percent,
                  widthPercent
                } of views) {
                  if (percent === 0 || widthPercent < 100) {
                    continue
                  }

                  let yArray = pageLayout.get(y)

                  if (!yArray) {
                    pageLayout.set(y, yArray || (yArray = []))
                  }

                  yArray.push(id)
                }

                for (const yArray of pageLayout.values()) {
                  const currentIndex = yArray.indexOf(currentPageNumber)

                  if (currentIndex === -1) {
                    continue
                  }

                  const numPages = yArray.length

                  if (numPages === 1) {
                    break
                  }

                  if (previous) {
                    for (let i = currentIndex - 1, ii = 0; i >= ii; i--) {
                      const currentId = yArray[i],
                        expectedId = yArray[i + 1] - 1

                      if (currentId < expectedId) {
                        return currentPageNumber - expectedId
                      }
                    }
                  } else {
                    for (let i = currentIndex + 1, ii = numPages; i < ii; i++) {
                      const currentId = yArray[i],
                        expectedId = yArray[i - 1] + 1

                      if (currentId > expectedId) {
                        return expectedId - currentPageNumber
                      }
                    }
                  }

                  if (previous) {
                    const firstId = yArray[0]

                    if (firstId < currentPageNumber) {
                      return currentPageNumber - firstId + 1
                    }
                  } else {
                    const lastId = yArray[numPages - 1]

                    if (lastId > currentPageNumber) {
                      return lastId - currentPageNumber + 1
                    }
                  }

                  break
                }

                break
              }

              case _ui_utils.ScrollMode.HORIZONTAL: {
                break
              }

              case _ui_utils.ScrollMode.VERTICAL: {
                if (this._spreadMode === _ui_utils.SpreadMode.NONE) {
                  break
                }

                const parity = this._spreadMode - 1

                if (previous && currentPageNumber % 2 !== parity) {
                  break
                } else if (!previous && currentPageNumber % 2 === parity) {
                  break
                }

                const {
                    views
                  } = this._getVisiblePages(),
                  expectedId = previous ? currentPageNumber - 1 : currentPageNumber + 1

                for (const {
                  id,
                  percent,
                  widthPercent
                } of views) {
                  if (id !== expectedId) {
                    continue
                  }

                  if (percent > 0 && widthPercent === 100) {
                    return 2
                  }

                  break
                }

                break
              }
            }

            return 1
          }

          nextPage () {
            const currentPageNumber = this._currentPageNumber,
              pagesCount = this.pagesCount

            if (currentPageNumber >= pagesCount) {
              return false
            }

            const advance = this._getPageAdvance(currentPageNumber, false) || 1
            this.currentPageNumber = Math.min(currentPageNumber + advance, pagesCount)
            return true
          }

          previousPage () {
            const currentPageNumber = this._currentPageNumber

            if (currentPageNumber <= 1) {
              return false
            }

            const advance = this._getPageAdvance(currentPageNumber, true) || 1
            this.currentPageNumber = Math.max(currentPageNumber - advance, 1)
            return true
          }

        }

        exports.BaseViewer = BaseViewer

        /***/
      }),
      /* 20 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.XfaLayerBuilder = exports.DefaultXfaLayerFactory = void 0

        var _pdfjsLib = __w_pdfjs_require__(2)

        class XfaLayerBuilder {
          constructor ({
            pageDiv,
            pdfPage
          }) {
            this.pageDiv = pageDiv
            this.pdfPage = pdfPage
            this.div = null
            this._cancelled = false
          }

          render (viewport, intent = 'display') {
            return this.pdfPage.getXfa().then(xfa => {
              if (this._cancelled) {
                return
              }

              const parameters = {
                viewport: viewport.clone({
                  dontFlip: true
                }),
                div: this.div,
                xfa,
                page: this.pdfPage
              }

              if (this.div) {
                _pdfjsLib.XfaLayer.update(parameters)
              } else {
                this.div = document.createElement('div')
                this.pageDiv.appendChild(this.div)
                parameters.div = this.div

                _pdfjsLib.XfaLayer.render(parameters)
              }
            })
          }

          cancel () {
            this._cancelled = true
          }

          hide () {
            if (!this.div) {
              return
            }

            this.div.hidden = true
          }

        }

        exports.XfaLayerBuilder = XfaLayerBuilder

        class DefaultXfaLayerFactory {
          createXfaLayerBuilder (pageDiv, pdfPage) {
            return new XfaLayerBuilder({
              pageDiv,
              pdfPage
            })
          }

        }

        exports.DefaultXfaLayerFactory = DefaultXfaLayerFactory

        /***/
      }),
      /* 21 */
      /***/ ((__unused_webpack_module, exports, __w_pdfjs_require__) => {

        Object.defineProperty(exports, '__esModule', ({
          value: true
        }))
        exports.PDFViewer = void 0

        var _ui_utils = __w_pdfjs_require__(5)

        var _base_viewer = __w_pdfjs_require__(19)

        var _pdfjsLib = __w_pdfjs_require__(2)

        class PDFViewer extends _base_viewer.BaseViewer {
          get _viewerElement () {
            return (0, _pdfjsLib.shadow)(this, '_viewerElement', this.viewer)
          }

          _scrollIntoView ({
            pageDiv,
            pageSpot = null,
            pageNumber = null
          }) {
            if (!pageSpot && !this.isInPresentationMode) {
              const left = pageDiv.offsetLeft + pageDiv.clientLeft
              const right = left + pageDiv.clientWidth
              const {
                scrollLeft,
                clientWidth
              } = this.container

              if (this._isScrollModeHorizontal || left < scrollLeft || right > scrollLeft + clientWidth) {
                pageSpot = {
                  left: 0,
                  top: 0
                }
              }
            }

            super._scrollIntoView({
              pageDiv,
              pageSpot,
              pageNumber
            })
          }

          _getVisiblePages () {
            if (this.isInPresentationMode) {
              return this._getCurrentVisiblePage()
            }

            return super._getVisiblePages()
          }

          _updateHelper (visiblePages) {
            if (this.isInPresentationMode) {
              return
            }

            let currentId = this._currentPageNumber
            let stillFullyVisible = false

            for (const page of visiblePages) {
              if (page.percent < 100) {
                break
              }

              if (page.id === currentId && this._scrollMode === _ui_utils.ScrollMode.VERTICAL && this._spreadMode === _ui_utils.SpreadMode.NONE) {
                stillFullyVisible = true
                break
              }
            }

            if (!stillFullyVisible) {
              currentId = visiblePages[0].id
            }

            this._setCurrentPageNumber(currentId)
          }

        }

        exports.PDFViewer = PDFViewer

        /***/
      })
      /******/])
    /************************************************************************/
    /******/ 	// The module cache
    /******/
    var __webpack_module_cache__ = {}
    /******/
    /******/ 	// The require function
    /******/
    function __w_pdfjs_require__ (moduleId) {
      /******/ 		// Check if module is in cache
      /******/
      var cachedModule = __webpack_module_cache__[moduleId]
      /******/
      if (cachedModule !== undefined) {
        /******/
        return cachedModule.exports
        /******/
      }
      /******/ 		// Create a new module (and put it into the cache)
      /******/
      var module = __webpack_module_cache__[moduleId] = {
        /******/ 			// no module.id needed
        /******/ 			// no module.loaded needed
        /******/      exports: {}
        /******/
      }
      /******/
      /******/ 		// Execute the module function
      /******/
      __webpack_modules__[moduleId](module, module.exports, __w_pdfjs_require__)
      /******/
      /******/ 		// Return the exports of the module
      /******/
      return module.exports
      /******/
    }

    /******/
    /************************************************************************/
    var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
    (() => {
      var exports = __webpack_exports__

      Object.defineProperty(exports, '__esModule', ({
        value: true
      }))
      Object.defineProperty(exports, 'AnnotationLayerBuilder', ({
        enumerable: true,
        get: function () {
          return _annotation_layer_builder.AnnotationLayerBuilder
        }
      }))
      Object.defineProperty(exports, 'DefaultAnnotationLayerFactory', ({
        enumerable: true,
        get: function () {
          return _annotation_layer_builder.DefaultAnnotationLayerFactory
        }
      }))
      Object.defineProperty(exports, 'DefaultTextLayerFactory', ({
        enumerable: true,
        get: function () {
          return _text_layer_builder.DefaultTextLayerFactory
        }
      }))
      Object.defineProperty(exports, 'TextLayerBuilder', ({
        enumerable: true,
        get: function () {
          return _text_layer_builder.TextLayerBuilder
        }
      }))
      Object.defineProperty(exports, 'EventBus', ({
        enumerable: true,
        get: function () {
          return _ui_utils.EventBus
        }
      }))
      Object.defineProperty(exports, 'ProgressBar', ({
        enumerable: true,
        get: function () {
          return _ui_utils.ProgressBar
        }
      }))
      Object.defineProperty(exports, 'PDFLinkService', ({
        enumerable: true,
        get: function () {
          return _pdf_link_service.PDFLinkService
        }
      }))
      Object.defineProperty(exports, 'SimpleLinkService', ({
        enumerable: true,
        get: function () {
          return _pdf_link_service.SimpleLinkService
        }
      }))
      Object.defineProperty(exports, 'DownloadManager', ({
        enumerable: true,
        get: function () {
          return _download_manager.DownloadManager
        }
      }))
      Object.defineProperty(exports, 'GenericL10n', ({
        enumerable: true,
        get: function () {
          return _genericl10n.GenericL10n
        }
      }))
      Object.defineProperty(exports, 'NullL10n', ({
        enumerable: true,
        get: function () {
          return _l10n_utils.NullL10n
        }
      }))
      Object.defineProperty(exports, 'PDFFindController', ({
        enumerable: true,
        get: function () {
          return _pdf_find_controller.PDFFindController
        }
      }))
      Object.defineProperty(exports, 'PDFHistory', ({
        enumerable: true,
        get: function () {
          return _pdf_history.PDFHistory
        }
      }))
      Object.defineProperty(exports, 'PDFPageView', ({
        enumerable: true,
        get: function () {
          return _pdf_page_view.PDFPageView
        }
      }))
      Object.defineProperty(exports, 'PDFScriptingManager', ({
        enumerable: true,
        get: function () {
          return _pdf_scripting_manager.PDFScriptingManager
        }
      }))
      Object.defineProperty(exports, 'PDFSinglePageViewer', ({
        enumerable: true,
        get: function () {
          return _pdf_single_page_viewer.PDFSinglePageViewer
        }
      }))
      Object.defineProperty(exports, 'PDFViewer', ({
        enumerable: true,
        get: function () {
          return _pdf_viewer.PDFViewer
        }
      }))

      var _annotation_layer_builder = __w_pdfjs_require__(1)

      var _text_layer_builder = __w_pdfjs_require__(6)

      var _ui_utils = __w_pdfjs_require__(5)

      var _pdf_link_service = __w_pdfjs_require__(4)

      var _download_manager = __w_pdfjs_require__(7)

      var _genericl10n = __w_pdfjs_require__(9)

      var _l10n_utils = __w_pdfjs_require__(3)

      var _pdf_find_controller = __w_pdfjs_require__(11)

      var _pdf_history = __w_pdfjs_require__(13)

      var _pdf_page_view = __w_pdfjs_require__(14)

      var _pdf_scripting_manager = __w_pdfjs_require__(16)

      var _pdf_single_page_viewer = __w_pdfjs_require__(18)

      var _pdf_viewer = __w_pdfjs_require__(21)

      const pdfjsVersion = '2.8.335'
      const pdfjsBuild = '228adbf67'
    })()

    /******/
    return __webpack_exports__
    /******/
  })()

})
//# sourceMappingURL=pdf_viewer.js.map