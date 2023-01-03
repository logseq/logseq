// Fork from https://github.com/mozilla/pdf.js

import { binarySearchFirstItem, getCharacterType, getPdfjsLib } from './utils'
import { scrollIntoView } from 'codemirror/src/display/scrolling'

const FindState = {
  FOUND: 0, NOT_FOUND: 1, WRAPPED: 2, PENDING: 3,
}

const FIND_TIMEOUT = 250 // ms
const MATCH_SCROLL_OFFSET_TOP = -50 // px
const MATCH_SCROLL_OFFSET_LEFT = -400 // px

const CHARACTERS_TO_NORMALIZE = {
  '\u2010': '-', // Hyphen
  '\u2018': '\'', // Left single quotation mark
  '\u2019': '\'', // Right single quotation mark
  '\u201A': '\'', // Single low-9 quotation mark
  '\u201B': '\'', // Single high-reversed-9 quotation mark
  '\u201C': '"', // Left double quotation mark
  '\u201D': '"', // Right double quotation mark
  '\u201E': '"', // Double low-9 quotation mark
  '\u201F': '"', // Double high-reversed-9 quotation mark
  '\u00BC': '1/4', // Vulgar fraction one quarter
  '\u00BD': '1/2', // Vulgar fraction one half
  '\u00BE': '3/4', // Vulgar fraction three quarters
}

// These diacritics aren't considered as combining diacritics
// when searching in a document:
//   https://searchfox.org/mozilla-central/source/intl/unicharutil/util/is_combining_diacritic.py.
// The combining class definitions can be found:
//   https://www.unicode.org/reports/tr44/#Canonical_Combining_Class_Values
// Category 0 corresponds to [^\p{Mn}].
const DIACRITICS_EXCEPTION = new Set([// UNICODE_COMBINING_CLASS_KANA_VOICING
  // https://www.compart.com/fr/unicode/combining/8
  0x3099, 0x309a, // UNICODE_COMBINING_CLASS_VIRAMA (under 0xFFFF)
  // https://www.compart.com/fr/unicode/combining/9
  0x094d, 0x09cd, 0x0a4d, 0x0acd, 0x0b4d, 0x0bcd, 0x0c4d, 0x0ccd, 0x0d3b, 0x0d3c, 0x0d4d, 0x0dca, 0x0e3a, 0x0eba,
  0x0f84, 0x1039, 0x103a, 0x1714, 0x1734, 0x17d2, 0x1a60, 0x1b44, 0x1baa, 0x1bab, 0x1bf2, 0x1bf3, 0x2d7f, 0xa806,
  0xa82c, 0xa8c4, 0xa953, 0xa9c0, 0xaaf6, 0xabed, // 91
  // https://www.compart.com/fr/unicode/combining/91
  0x0c56, // 129
  // https://www.compart.com/fr/unicode/combining/129
  0x0f71, // 130
  // https://www.compart.com/fr/unicode/combining/130
  0x0f72, 0x0f7a, 0x0f7b, 0x0f7c, 0x0f7d, 0x0f80, // 132
  // https://www.compart.com/fr/unicode/combining/132
  0x0f74,])
const DIACRITICS_EXCEPTION_STR = [...DIACRITICS_EXCEPTION.values()]
  .map(x => String.fromCharCode(x))
  .join('')

const DIACRITICS_REG_EXP = /\p{M}+/gu
const SPECIAL_CHARS_REG_EXP = /([.*+?^${}()|[\]\\])|(\p{P})|(\s+)|(\p{M})|(\p{L})/gu
const NOT_DIACRITIC_FROM_END_REG_EXP = /([^\p{M}])\p{M}*$/u
const NOT_DIACRITIC_FROM_START_REG_EXP = /^\p{M}*([^\p{M}])/u

let normalizationRegex = null

function normalize (text) {
  // The diacritics in the text or in the query can be composed or not.
  // So we use a decomposed text using NFD (and the same for the query)
  // in order to be sure that diacritics are in the same order.

  if (!normalizationRegex) {
    // Compile the regular expression for text normalization once.
    const replace = Object.keys(CHARACTERS_TO_NORMALIZE).join('')
    normalizationRegex = new RegExp(`([${replace}])|(\\p{M}+(?:-\\n)?)|(\\S-\\n)|(\\n)`, 'gum')
  }

  // The goal of this function is to normalize the string and
  // be able to get from an index in the new string the
  // corresponding index in the old string.
  // For example if we have: abCd12ef456gh where C is replaced by ccc
  // and numbers replaced by nothing (it's the case for diacritics), then
  // we'll obtain the normalized string: abcccdefgh.
  // So here the reverse map is: [0,1,2,2,2,3,6,7,11,12].

  // The goal is to obtain the array: [[0, 0], [3, -1], [4, -2],
  // [6, 0], [8, 3]].
  // which can be used like this:
  //  - let say that i is the index in new string and j the index
  //    the old string.
  //  - if i is in [0; 3[ then j = i + 0
  //  - if i is in [3; 4[ then j = i - 1
  //  - if i is in [4; 6[ then j = i - 2
  //  ...
  // Thanks to a binary search it's easy to know where is i and what's the
  // shift.
  // Let say that the last entry in the array is [x, s] and we have a
  // substitution at index y (old string) which will replace o chars by n chars.
  // Firstly, if o === n, then no need to add a new entry: the shift is
  // the same.
  // Secondly, if o < n, then we push the n - o elements:
  // [y - (s - 1), s - 1], [y - (s - 2), s - 2], ...
  // Thirdly, if o > n, then we push the element: [y - (s - n), o + s - n]

  // Collect diacritics length and positions.
  const rawDiacriticsPositions = []
  let m
  while ((m = DIACRITICS_REG_EXP.exec(text)) !== null) {
    rawDiacriticsPositions.push([m[0].length, m.index])
  }

  let normalized = text.normalize('NFD')
  const positions = [[0, 0]]
  let k = 0
  let shift = 0
  let shiftOrigin = 0
  let eol = 0
  let hasDiacritics = false

  normalized = normalized.replace(normalizationRegex, (match, p1, p2, p3, p4, i) => {
    i -= shiftOrigin
    if (p1) {
      // Maybe fractions or quotations mark...
      const replacement = CHARACTERS_TO_NORMALIZE[match]
      const jj = replacement.length
      for (let j = 1; j < jj; j++) {
        positions.push([i - shift + j, shift - j])
      }
      shift -= jj - 1
      return replacement
    }

    if (p2) {
      const hasTrailingDashEOL = p2.endsWith('\n')
      const len = hasTrailingDashEOL ? p2.length - 2 : p2.length

      // Diacritics.
      hasDiacritics = true
      let jj = len
      if (i + eol === rawDiacriticsPositions[k]?.[1]) {
        jj -= rawDiacriticsPositions[k][0]
        ++k
      }

      for (let j = 1; j < jj + 1; j++) {
        // i is the position of the first diacritic
        // so (i - 1) is the position for the letter before.
        positions.push([i - 1 - shift + j, shift - j])
      }
      shift -= jj
      shiftOrigin += jj

      if (hasTrailingDashEOL) {
        // Diacritics are followed by a -\n.
        // See comments in `if (p3)` block.
        i += len - 1
        positions.push([i - shift + 1, 1 + shift])
        shift += 1
        shiftOrigin += 1
        eol += 1
        return p2.slice(0, len)
      }

      return p2
    }

    if (p3) {
      // "X-\n" is removed because an hyphen at the end of a line
      // with not a space before is likely here to mark a break
      // in a word.
      // The \n isn't in the original text so here y = i, n = 1 and o = 2.
      positions.push([i - shift + 1, 1 + shift])
      shift += 1
      shiftOrigin += 1
      eol += 1
      return p3.charAt(0)
    }

    // p4
    // eol is replaced by space: "foo\nbar" is likely equivalent to
    // "foo bar".
    positions.push([i - shift + 1, shift - 1])
    shift -= 1
    shiftOrigin += 1
    eol += 1
    return ' '
  })

  positions.push([normalized.length, shift])

  return [normalized, positions, hasDiacritics]
}

// Determine the original, non-normalized, match index such that highlighting of
// search results is correct in the `textLayer` for strings containing e.g. "½"
// characters; essentially "inverting" the result of the `normalize` function.
function getOriginalIndex (diffs, pos, len) {
  if (!diffs) {
    return [pos, len]
  }

  const start = pos
  const end = pos + len
  let i = binarySearchFirstItem(diffs, x => x[0] >= start)
  if (diffs[i][0] > start) {
    --i
  }

  let j = binarySearchFirstItem(diffs, x => x[0] >= end, i)
  if (diffs[j][0] > end) {
    --j
  }

  return [start + diffs[i][1], len + diffs[j][1] - diffs[i][1]]
}

/**
 * @typedef {Object} PDFFindControllerOptions
 * @property {IPDFLinkService} linkService - The navigation/linking service.
 * @property {EventBus} eventBus - The application event bus.
 */

/**
 * Provides search functionality to find a given string in a PDF document.
 */
export class PDFFindController {

  /**
   * @param {PDFFindControllerOptions} options
   */
  constructor ({ linkService, eventBus }) {
    this._linkService = linkService
    this._eventBus = eventBus

    this.__reset()
    eventBus._on('find', this.__onFind.bind(this))
    eventBus._on('findbarclose', this.__onFindBarClose.bind(this))
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

  /**
   * Set a reference to the PDF document in order to search it.
   * Note that searching is not possible if this method is not called.
   *
   * @param {PDFDocumentProxy} pdfDocument - The PDF document to search.
   */
  setDocument (pdfDocument) {
    if (this._pdfDocument) {
      this.__reset()
    }
    if (!pdfDocument) {
      return
    }
    this._pdfDocument = pdfDocument
    this._firstPageCapability.resolve()
  }

  __onFind (state) {
    if (!state) {
      return
    }
    const pdfDocument = this._pdfDocument
    const { type } = state

    if (this._state === null || this.__shouldDirtyMatch(state)) {
      this._dirtyMatch = true
    }
    this._state = state
    if (type !== 'highlightallchange') {
      this.__updateUIState(FindState.PENDING)
    }

    this._firstPageCapability.promise.then(() => {
      // If the document was closed before searching began, or if the search
      // operation was relevant for a previously opened document, do nothing.
      if (!this._pdfDocument || (pdfDocument && this._pdfDocument !== pdfDocument)) {
        return
      }
      this.__extractText()

      const findbarClosed = !this._highlightMatches
      const pendingTimeout = !!this._findTimeout

      if (this._findTimeout) {
        clearTimeout(this._findTimeout)
        this._findTimeout = null
      }
      if (!type) {
        // Trigger the find action with a small delay to avoid starting the
        // search when the user is still typing (saving resources).
        this._findTimeout = setTimeout(() => {
          this.__nextMatch()
          this._findTimeout = null
        }, FIND_TIMEOUT)
      } else if (this._dirtyMatch) {
        // Immediately trigger searching for non-'find' operations, when the
        // current state needs to be reset and matches re-calculated.
        this.__nextMatch()
      } else if (type === 'again') {
        this.__nextMatch()

        // When the findbar was previously closed, and `highlightAll` is set,
        // ensure that the matches on all active pages are highlighted again.
        if (findbarClosed && this._state.highlightAll) {
          this.__updateAllPages()
        }
      } else if (type === 'highlightallchange') {
        // If there was a pending search operation, synchronously trigger a new
        // search *first* to ensure that the correct matches are highlighted.
        if (pendingTimeout) {
          this.__nextMatch()
        } else {
          this._highlightMatches = true
        }
        this.__updateAllPages() // Update the highlighting on all active pages.
      } else {
        this.__nextMatch()
      }
    })
  }

  scrollMatchIntoView ({
    element = null, selectedLeft = 0, pageIndex = -1, matchIndex = -1,
  }) {
    if (!this._scrollMatches || !element) {
      return
    } else if (matchIndex === -1 || matchIndex !== this._selected.matchIdx) {
      return
    } else if (pageIndex === -1 || pageIndex !== this._selected.pageIdx) {
      return
    }
    this._scrollMatches = false // Ensure that scrolling only happens once.

    const spot = {
      top: MATCH_SCROLL_OFFSET_TOP, left: selectedLeft + MATCH_SCROLL_OFFSET_LEFT,
    }
    scrollIntoView(element, spot, /* scrollMatches = */ true)
  }

  __reset () {
    this._highlightMatches = false
    this._scrollMatches = false
    this._pdfDocument = null
    this._pageMatches = []
    this._pageMatchesLength = []
    this._state = null
    // Currently selected match.
    this._selected = {
      pageIdx: -1, matchIdx: -1,
    }
    // Where the find algorithm currently is in the document.
    this._offset = {
      pageIdx: null, matchIdx: null, wrapped: false,
    }
    this._extractTextPromises = []
    this._pageContents = [] // Stores the normalized text for each page.
    this._pageDiffs = []
    this._hasDiacritics = []
    this._matchesCountTotal = 0
    this._pagesToSearch = null
    this._pendingFindMatches = new Set()
    this._resumePageIdx = null
    this._dirtyMatch = false
    clearTimeout(this._findTimeout)
    this._findTimeout = null

    this._firstPageCapability = getPdfjsLib().createPromiseCapability()
  }

  /**
   * @type {string} The (current) normalized search query.
   */
  get __query () {
    if (this._state.query !== this._rawQuery) {
      this._rawQuery = this._state.query;
      [this._normalizedQuery] = normalize(this._state.query)
    }
    return this._normalizedQuery
  }

  __shouldDirtyMatch (state) {
    // When the search query changes, regardless of the actual search command
    // used, always re-calculate matches to avoid errors (fixes bug 1030622).
    if (state.query !== this._state.query) {
      return true
    }
    switch (state.type) {
      case 'again':
        const pageNumber = this._selected.pageIdx + 1
        const linkService = this._linkService
        // Only treat a 'findagain' event as a new search operation when it's
        // *absolutely* certain that the currently selected match is no longer
        // visible, e.g. as a result of the user scrolling in the document.
        //
        // NOTE: If only a simple `this._linkService.page` check was used here,
        // there's a risk that consecutive 'findagain' operations could "skip"
        // over matches at the top/bottom of pages thus making them completely
        // inaccessible when there's multiple pages visible in the viewer.
        if (pageNumber >= 1 && pageNumber <= linkService.pagesCount && pageNumber !== linkService.page && !linkService.isPageVisible(pageNumber)) {
          return true
        }
        return false
      case 'highlightallchange':
        return false
    }
    return true
  }

  /**
   * Determine if the search query constitutes a "whole word", by comparing the
   * first/last character type with the preceding/following character type.
   */
  __isEntireWord (content, startIdx, length) {
    let match = content
      .slice(0, startIdx)
      .match(NOT_DIACRITIC_FROM_END_REG_EXP)
    if (match) {
      const first = content.charCodeAt(startIdx)
      const limit = match[1].charCodeAt(0)
      if (getCharacterType(first) === getCharacterType(limit)) {
        return false
      }
    }

    match = content
      .slice(startIdx + length)
      .match(NOT_DIACRITIC_FROM_START_REG_EXP)
    if (match) {
      const last = content.charCodeAt(startIdx + length - 1)
      const limit = match[1].charCodeAt(0)
      if (getCharacterType(last) === getCharacterType(limit)) {
        return false
      }
    }

    return true
  }

  __calculateRegExpMatch (query, entireWord, pageIndex, pageContent) {
    const matches = [], matchesLength = []

    const diffs = this._pageDiffs[pageIndex]
    let match
    while ((match = query.exec(pageContent)) !== null) {
      if (entireWord && !this.__isEntireWord(pageContent, match.index, match[0].length)) {
        continue
      }

      const [matchPos, matchLen] = getOriginalIndex(diffs, match.index, match[0].length)

      if (matchLen) {
        matches.push(matchPos)
        matchesLength.push(matchLen)
      }
    }
    this._pageMatches[pageIndex] = matches
    this._pageMatchesLength[pageIndex] = matchesLength
  }

  __convertToRegExpString (query, hasDiacritics) {
    const { matchDiacritics } = this._state
    let isUnicode = false
    query = query.replace(SPECIAL_CHARS_REG_EXP, (match, p1 /* to escape */, p2 /* punctuation */, p3 /* whitespaces */, p4 /* diacritics */, p5 /* letters */) => {
      // We don't need to use a \s for whitespaces since all the different
      // kind of whitespaces are replaced by a single " ".

      if (p1) {
        // Escape characters like *+?... to not interfer with regexp syntax.
        return `[ ]*\\${p1}[ ]*`
      }
      if (p2) {
        // Allow whitespaces around punctuation signs.
        return `[ ]*${p2}[ ]*`
      }
      if (p3) {
        // Replace spaces by \s+ to be sure to match any spaces.
        return '[ ]+'
      }
      if (matchDiacritics) {
        return p4 || p5
      }

      if (p4) {
        // Diacritics are removed with few exceptions.
        return DIACRITICS_EXCEPTION.has(p4.charCodeAt(0)) ? p4 : ''
      }

      // A letter has been matched and it can be followed by any diacritics
      // in normalized text.
      if (hasDiacritics) {
        isUnicode = true
        return `${p5}\\p{M}*`
      }
      return p5
    })

    const trailingSpaces = '[ ]*'
    if (query.endsWith(trailingSpaces)) {
      // The [ ]* has been added in order to help to match "foo . bar" but
      // it doesn't make sense to match some whitespaces after the dot
      // when it's the last character.
      query = query.slice(0, query.length - trailingSpaces.length)
    }

    if (matchDiacritics) {
      // aX must not match aXY.
      if (hasDiacritics) {
        isUnicode = true
        query = `${query}(?=[${DIACRITICS_EXCEPTION_STR}]|[^\\p{M}]|$)`
      }
    }

    return [isUnicode, query]
  }

  __calculateMatch (pageIndex) {
    let query = this.__query
    if (query.length === 0) {
      // Do nothing: the matches should be wiped out already.
      return
    }

    const { caseSensitive, entireWord, phraseSearch } = this._state
    const pageContent = this._pageContents[pageIndex]
    const hasDiacritics = this._hasDiacritics[pageIndex]

    let isUnicode = false
    if (phraseSearch) {
      [isUnicode, query] = this.__convertToRegExpString(query, hasDiacritics)
    } else {
      // Words are sorted in reverse order to be sure that "foobar" is matched
      // before "foo" in case the query is "foobar foo".
      const match = query.match(/\S+/g)
      if (match) {
        query = match
          .sort()
          .reverse()
          .map(q => {
            const [isUnicodePart, queryPart] = this.__convertToRegExpString(q, hasDiacritics)
            isUnicode ||= isUnicodePart
            return `(${queryPart})`
          })
          .join('|')
      }
    }

    const flags = `g${isUnicode ? 'u' : ''}${caseSensitive ? '' : 'i'}`
    query = new RegExp(query, flags)

    this.__calculateRegExpMatch(query, entireWord, pageIndex, pageContent)

    // When `highlightAll` is set, ensure that the matches on previously
    // rendered (and still active) pages are correctly highlighted.
    if (this._state.highlightAll) {
      this.__updatePage(pageIndex)
    }
    if (this._resumePageIdx === pageIndex) {
      this._resumePageIdx = null
      this.__nextPageMatch()
    }

    // Update the match count.
    const pageMatchesCount = this._pageMatches[pageIndex].length
    if (pageMatchesCount > 0) {
      this._matchesCountTotal += pageMatchesCount
      this.__updateUIResultsCount()
    }
  }

  __extractText () {
    // Perform text extraction once if this method is called multiple times.
    if (this._extractTextPromises.length > 0) {
      return
    }

    let promise = Promise.resolve()
    for (let i = 0, ii = this._linkService.pagesCount; i < ii; i++) {
      const extractTextCapability = createPromiseCapability()
      this._extractTextPromises[i] = extractTextCapability.promise

      promise = promise.then(() => {
        return this._pdfDocument
          .getPage(i + 1)
          .then(pdfPage => {
            return pdfPage.getTextContent()
          })
          .then(textContent => {
            const strBuf = []

            for (const textItem of textContent.items) {
              strBuf.push(textItem.str)
              if (textItem.hasEOL) {
                strBuf.push('\n')
              }
            }

            // Store the normalized page content (text items) as one string.
            [this._pageContents[i], this._pageDiffs[i], this._hasDiacritics[i],] = normalize(strBuf.join(''))
            extractTextCapability.resolve()
          }, reason => {
            console.error(`Unable to get text content for page ${i + 1}`, reason)
            // Page error -- assuming no text content.
            this._pageContents[i] = ''
            this._pageDiffs[i] = null
            this._hasDiacritics[i] = false
            extractTextCapability.resolve()
          })
      })
    }
  }

  __updatePage (index) {
    if (this._scrollMatches && this._selected.pageIdx === index) {
      // If the page is selected, scroll the page into view, which triggers
      // rendering the page, which adds the text layer. Once the text layer
      // is built, it will attempt to scroll the selected match into view.
      this._linkService.page = index + 1
    }

    this._eventBus.dispatch('updatetextlayermatches', {
      source: this, pageIndex: index,
    })
  }

  __updateAllPages () {
    this._eventBus.dispatch('updatetextlayermatches', {
      source: this, pageIndex: -1,
    })
  }

  __nextMatch () {
    const previous = this._state.findPrevious
    const currentPageIndex = this._linkService.page - 1
    const numPages = this._linkService.pagesCount

    this._highlightMatches = true

    if (this._dirtyMatch) {
      // Need to recalculate the matches, reset everything.
      this._dirtyMatch = false
      this._selected.pageIdx = this._selected.matchIdx = -1
      this._offset.pageIdx = currentPageIndex
      this._offset.matchIdx = null
      this._offset.wrapped = false
      this._resumePageIdx = null
      this._pageMatches.length = 0
      this._pageMatchesLength.length = 0
      this._matchesCountTotal = 0

      this.__updateAllPages() // Wipe out any previously highlighted matches.

      for (let i = 0; i < numPages; i++) {
        // Start finding the matches as soon as the text is extracted.
        if (this._pendingFindMatches.has(i)) {
          continue
        }
        this._pendingFindMatches.add(i)
        this._extractTextPromises[i].then(() => {
          this._pendingFindMatches.delete(i)
          this.__calculateMatch(i)
        })
      }
    }

    // If there's no query there's no point in searching.
    if (this.__query === '') {
      this.__updateUIState(FindState.FOUND)
      return
    }
    // If we're waiting on a page, we return since we can't do anything else.
    if (this._resumePageIdx) {
      return
    }

    const offset = this._offset
    // Keep track of how many pages we should maximally iterate through.
    this._pagesToSearch = numPages
    // If there's already a `matchIdx` that means we are iterating through a
    // page's matches.
    if (offset.matchIdx !== null) {
      const numPageMatches = this._pageMatches[offset.pageIdx].length
      if ((!previous && offset.matchIdx + 1 < numPageMatches) || (previous && offset.matchIdx > 0)) {
        // The simple case; we just have advance the matchIdx to select
        // the next match on the page.
        offset.matchIdx = previous ? offset.matchIdx - 1 : offset.matchIdx + 1
        this.__updateMatch(/* found = */ true)
        return
      }
      // We went beyond the current page's matches, so we advance to
      // the next page.
      this.__advanceOffsetPage(previous)
    }
    // Start searching through the page.
    this.__nextPageMatch()
  }

  __matchesReady (matches) {
    const offset = this._offset
    const numMatches = matches.length
    const previous = this._state.findPrevious

    if (numMatches) {
      // There were matches for the page, so initialize `matchIdx`.
      offset.matchIdx = previous ? numMatches - 1 : 0
      this.__updateMatch(/* found = */ true)
      return true
    }
    // No matches, so attempt to search the next page.
    this.__advanceOffsetPage(previous)
    if (offset.wrapped) {
      offset.matchIdx = null
      if (this._pagesToSearch < 0) {
        // No point in wrapping again, there were no matches.
        this.__updateMatch(/* found = */ false)
        // While matches were not found, searching for a page
        // with matches should nevertheless halt.
        return true
      }
    }
    // Matches were not found (and searching is not done).
    return false
  }

  __nextPageMatch () {
    if (this._resumePageIdx !== null) {
      console.error('There can only be one pending page.')
    }

    let matches = null
    do {
      const pageIdx = this._offset.pageIdx
      matches = this._pageMatches[pageIdx]
      if (!matches) {
        // The matches don't exist yet for processing by `_matchesReady`,
        // so set a resume point for when they do exist.
        this._resumePageIdx = pageIdx
        break
      }
    } while (!this.__matchesReady(matches))
  }

  __advanceOffsetPage (previous) {
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

  __updateMatch (found = false) {
    let state = FindState.NOT_FOUND
    const wrapped = this._offset.wrapped
    this._offset.wrapped = false

    if (found) {
      const previousPage = this._selected.pageIdx
      this._selected.pageIdx = this._offset.pageIdx
      this._selected.matchIdx = this._offset.matchIdx
      state = wrapped ? FindState.WRAPPED : FindState.FOUND

      // Update the currently selected page to wipe out any selected matches.
      if (previousPage !== -1 && previousPage !== this._selected.pageIdx) {
        this.__updatePage(previousPage)
      }
    }

    this.__updateUIState(state, this._state.findPrevious)
    if (this._selected.pageIdx !== -1) {
      // Ensure that the match will be scrolled into view.
      this._scrollMatches = true

      this.__updatePage(this._selected.pageIdx)
    }
  }

  __onFindBarClose (evt) {
    const pdfDocument = this._pdfDocument
    // Since searching is asynchronous, ensure that the removal of highlighted
    // matches (from the UI) is async too such that the 'updatetextlayermatches'
    // events will always be dispatched in the expected order.
    this._firstPageCapability.promise.then(() => {
      // Only update the UI if the document is open, and is the current one.
      if (!this._pdfDocument || (pdfDocument && this._pdfDocument !== pdfDocument)) {
        return
      }
      // Ensure that a pending, not yet started, search operation is aborted.
      if (this._findTimeout) {
        clearTimeout(this._findTimeout)
        this._findTimeout = null
      }
      // Abort any long running searches, to avoid a match being scrolled into
      // view *after* the findbar has been closed. In this case `this._offset`
      // will most likely differ from `this._selected`, hence we also ensure
      // that any new search operation will always start with a clean slate.
      if (this._resumePageIdx) {
        this._resumePageIdx = null
        this._dirtyMatch = true
      }
      // Avoid the UI being in a pending state when the findbar is re-opened.
      this.__updateUIState(FindState.FOUND)

      this._highlightMatches = false
      this.__updateAllPages() // Wipe out any previously highlighted matches.
    })
  }

  __requestMatchesCount () {
    const { pageIdx, matchIdx } = this._selected
    let current = 0, total = this._matchesCountTotal
    if (matchIdx !== -1) {
      for (let i = 0; i < pageIdx; i++) {
        current += this._pageMatches[i]?.length || 0
      }
      current += matchIdx + 1
    }
    // When searching starts, this method may be called before the `pageMatches`
    // have been counted (in `_calculateMatch`). Ensure that the UI won't show
    // temporarily broken state when the active find result doesn't make sense.
    if (current < 1 || current > total) {
      current = total = 0
    }
    return { current, total }
  }

  __updateUIResultsCount () {
    this._eventBus.dispatch('updatefindmatchescount', {
      source: this, matchesCount: this.__requestMatchesCount(),
    })
  }

  __updateUIState (state, previous = false) {
    this._eventBus.dispatch('updatefindcontrolstate', {
      source: this, state, previous, matchesCount: this.__requestMatchesCount(), rawQuery: this._state?.query ?? null,
    })
  }
}

const MATCHES_COUNT_LIMIT = 1000

/**
 * Creates a "search bar" given a set of DOM elements that act as controls
 * for searching or for setting search preferences in the UI. This object
 * also sets up the appropriate events for the controls. Actual searching
 * is done by PDFFindController.
 */
export class PDFFindBar {
  constructor (options, eventBus, l10n) {
    this.opened = false

    this.bar = options.bar
    this.toggleButton = options.toggleButton
    this.findField = options.findField
    this.highlightAll = options.highlightAllCheckbox
    this.caseSensitive = options.caseSensitiveCheckbox
    this.matchDiacritics = options.matchDiacriticsCheckbox
    this.entireWord = options.entireWordCheckbox
    this.findMsg = options.findMsg
    this.findResultsCount = options.findResultsCount
    this.findPreviousButton = options.findPreviousButton
    this.findNextButton = options.findNextButton
    this.eventBus = eventBus
    this.l10n = l10n

    // Add event listeners to the DOM elements.
    this.toggleButton.addEventListener('click', () => {
      this.toggle()
    })

    this.findField.addEventListener('input', () => {
      this.dispatchEvent('')
    })

    this.bar.addEventListener('keydown', e => {
      switch (e.keyCode) {
        case 13: // Enter
          if (e.target === this.findField) {
            this.dispatchEvent('again', e.shiftKey)
          }
          break
        case 27: // Escape
          this.close()
          break
      }
    })

    this.findPreviousButton.addEventListener('click', () => {
      this.dispatchEvent('again', true)
    })

    this.findNextButton.addEventListener('click', () => {
      this.dispatchEvent('again', false)
    })

    this.highlightAll.addEventListener('click', () => {
      this.dispatchEvent('highlightallchange')
    })

    this.caseSensitive.addEventListener('click', () => {
      this.dispatchEvent('casesensitivitychange')
    })

    this.entireWord.addEventListener('click', () => {
      this.dispatchEvent('entirewordchange')
    })

    this.matchDiacritics.addEventListener('click', () => {
      this.dispatchEvent('diacriticmatchingchange')
    })

    this.eventBus._on('resize', this.__adjustWidth.bind(this))
  }

  reset () {
    this.updateUIState()
  }

  dispatchEvent (type, findPrev = false) {
    this.eventBus.dispatch('find', {
      source: this,
      type,
      query: this.findField.value,
      phraseSearch: true,
      caseSensitive: this.caseSensitive.checked,
      entireWord: this.entireWord.checked,
      highlightAll: this.highlightAll.checked,
      findPrevious: findPrev,
      matchDiacritics: this.matchDiacritics.checked,
    })
  }

  updateUIState (state, previous, matchesCount) {
    let findMsg = Promise.resolve('')
    let status = ''

    switch (state) {
      case FindState.FOUND:
        break
      case FindState.PENDING:
        status = 'pending'
        break
      case FindState.NOT_FOUND:
        findMsg = this.l10n.get('find_not_found')
        status = 'notFound'
        break
      case FindState.WRAPPED:
        findMsg = this.l10n.get(`find_reached_${previous ? 'top' : 'bottom'}`)
        break
    }
    this.findField.setAttribute('data-status', status)
    this.findField.setAttribute('aria-invalid', state === FindState.NOT_FOUND)

    findMsg.then(msg => {
      this.findMsg.textContent = msg
      this.__adjustWidth()
    })

    this.updateResultsCount(matchesCount)
  }

  updateResultsCount ({ current = 0, total = 0 } = {}) {
    const limit = MATCHES_COUNT_LIMIT
    let matchCountMsg = Promise.resolve('')

    if (total > 0) {
      if (total > limit) {
        let key = 'find_match_count_limit'

        if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('MOZCENTRAL')) {
          // TODO: Remove this hard-coded `[other]` form once plural support has
          // been implemented in the mozilla-central specific `l10n.js` file.
          key += '[other]'
        }
        matchCountMsg = this.l10n.get(key, { limit })
      } else {
        let key = 'find_match_count'

        if (typeof PDFJSDev !== 'undefined' && PDFJSDev.test('MOZCENTRAL')) {
          // TODO: Remove this hard-coded `[other]` form once plural support has
          // been implemented in the mozilla-central specific `l10n.js` file.
          key += '[other]'
        }
        matchCountMsg = this.l10n.get(key, { current, total })
      }
    }
    matchCountMsg.then(msg => {
      this.findResultsCount.textContent = msg
      // Since `updateResultsCount` may be called from `PDFFindController`,
      // ensure that the width of the findbar is always updated correctly.
      this.__adjustWidth()
    })
  }

  open () {
    if (!this.opened) {
      this.opened = true
      this.toggleButton.classList.add('toggled')
      this.toggleButton.setAttribute('aria-expanded', 'true')
      this.bar.classList.remove('hidden')
    }
    this.findField.select()
    this.findField.focus()

    this.__adjustWidth()
  }

  close () {
    if (!this.opened) {
      return
    }
    this.opened = false
    this.toggleButton.classList.remove('toggled')
    this.toggleButton.setAttribute('aria-expanded', 'false')
    this.bar.classList.add('hidden')

    this.eventBus.dispatch('findbarclose', { source: this })
  }

  toggle () {
    if (this.opened) {
      this.close()
    } else {
      this.open()
    }
  }

  __adjustWidth () {
    if (!this.opened) {
      return
    }

    // The find bar has an absolute position and thus the browser extends
    // its width to the maximum possible width once the find bar does not fit
    // entirely within the window anymore (and its elements are automatically
    // wrapped). Here we detect and fix that.
    this.bar.classList.remove('wrapContainers')

    const findbarHeight = this.bar.clientHeight
    const inputContainerHeight = this.bar.firstElementChild.clientHeight

    if (findbarHeight > inputContainerHeight) {
      // The findbar is taller than the input container, which means that
      // the browser wrapped some of the elements. For a consistent look,
      // wrap all of them to adjust the width of the find bar.
      this.bar.classList.add('wrapContainers')
    }
  }
}