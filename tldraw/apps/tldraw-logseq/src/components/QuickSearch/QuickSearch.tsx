import { useDebouncedValue } from '@tldraw/react'
import { observer } from 'mobx-react-lite'
import React from 'react'
import { Virtuoso } from 'react-virtuoso'
import { LogseqPortalShape } from '../../lib'
import { LogseqContext, SearchResult } from '../../lib/logseq-context'
import { CircleButton } from '../Button'
import { TablerIcon } from '../icons'
import { TextInput } from '../inputs/TextInput'

interface LogseqQuickSearchProps {
  onChange: (id: string) => void
  className?: string
  placeholder?: string
  style?: React.CSSProperties
  onBlur?: () => void
  onAddBlock?: (uuid: string) => void
}

const LogseqTypeTag = ({
  type,
  active,
}: {
  type: 'B' | 'P' | 'BA' | 'PA' | 'WA' | 'WP' | 'BS' | 'PS'
  active?: boolean
}) => {
  const nameMapping = {
    B: 'block',
    P: 'page',
    WP: 'whiteboard',
    BA: 'new-block',
    PA: 'new-page',
    WA: 'new-whiteboard',
    BS: 'block-search',
    PS: 'page-search',
  }
  return (
    <span className="tl-type-tag" data-active={active}>
      <i className={`tie tie-${nameMapping[type]}`} />
    </span>
  )
}

function escapeRegExp(text: string) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&')
}

const highlightedJSX = (input: string, keyword: string) => {
  return (
    <span>
      {input
        .split(new RegExp(`(${escapeRegExp(keyword)})`, 'gi'))
        .map((part, index) => {
          if (index % 2 === 1) {
            return <mark className="tl-highlighted">{part}</mark>
          }
          return part
        })
        .map((frag, idx) => (
          <React.Fragment key={idx}>{frag}</React.Fragment>
        ))}
    </span>
  )
}

const useSearch = (q: string, searchFilter: 'B' | 'P' | null) => {
  const { handlers } = React.useContext(LogseqContext)
  const [results, setResults] = React.useState<SearchResult | null>(null)
  const dq = useDebouncedValue(q, 200)

  React.useEffect(() => {
    let canceled = false
    if (dq.length > 0) {
      const filter = { 'pages?': true, 'blocks?': true, 'files?': false }
      if (searchFilter === 'B') {
        filter['pages?'] = false
      } else if (searchFilter === 'P') {
        filter['blocks?'] = false
      }
      handlers.search(dq, filter).then(_results => {
        if (!canceled) {
          setResults(_results)
        }
      })
    } else {
      setResults(null)
    }
    return () => {
      canceled = true
    }
  }, [dq, handlers?.search])

  return results
}

export const LogseqQuickSearch = observer(
  ({ className, style, placeholder, onChange, onBlur, onAddBlock }: LogseqQuickSearchProps) => {
    const [q, setQ] = React.useState(LogseqPortalShape.defaultSearchQuery)
    const [searchFilter, setSearchFilter] = React.useState<'B' | 'P' | null>(
      LogseqPortalShape.defaultSearchFilter
    )
    const rInput = React.useRef<HTMLInputElement>(null)
    const { handlers, renderers } = React.useContext(LogseqContext)
    const t = handlers.t

    const finishSearching = React.useCallback((id: string) => {
      setTimeout(() => onChange(id))
      rInput.current?.blur()
      if (id) {
        LogseqPortalShape.defaultSearchQuery = ''
        LogseqPortalShape.defaultSearchFilter = null
      }
    }, [])

    const handleAddBlock = React.useCallback(
      (content: string) => {
        const uuid = handlers?.addNewBlock(content)
        if (uuid) {
          finishSearching(uuid)
          onAddBlock?.(uuid)
        }
        return uuid
      },
      [onAddBlock]
    )

    const optionsWrapperRef = React.useRef<HTMLDivElement>(null)

    const [focusedOptionIdx, setFocusedOptionIdx] = React.useState<number>(0)

    const searchResult = useSearch(q, searchFilter)

    const [prefixIcon, setPrefixIcon] = React.useState<string>('circle-plus')

    const [showPanel, setShowPanel] = React.useState<boolean>(false)

    React.useEffect(() => {
      // autofocus attr seems not to be working
      setTimeout(() => {
        rInput.current?.focus()
      })
    }, [searchFilter])

    React.useEffect(() => {
      LogseqPortalShape.defaultSearchQuery = q
      LogseqPortalShape.defaultSearchFilter = searchFilter
    }, [q, searchFilter])

    type Option = {
      actionIcon: 'search' | 'circle-plus'
      onChosen: () => boolean // return true if the action was handled
      element: React.ReactNode
    }

    const options: Option[] = React.useMemo(() => {
      const options: Option[] = []

      const Breadcrumb = renderers?.Breadcrumb

      if (!Breadcrumb || !handlers) {
        return []
      }

      if (onAddBlock) {
        // New block option
        options.push({
          actionIcon: 'circle-plus',
          onChosen: () => {
            return !!handleAddBlock(q)
          },
          element: (
            <div className="tl-quick-search-option-row">
              <LogseqTypeTag active type="BA" />
              {q.length > 0 ? (
                <>
                  <strong>{t('whiteboard/new-block')}</strong>
                  {q}
                </>
              ) : (
                <strong>{t('whiteboard/new-block-no-colon')}</strong>
              )}
            </div>
          ),
        })
      }

      // New page or whiteboard option when no exact match
      if (!searchResult?.pages?.some(p => p.toLowerCase() === q.toLowerCase()) && q) {
        options.push(
          {
            actionIcon: 'circle-plus',
            onChosen: () => {
              finishSearching(q)
              return true
            },
            element: (
              <div className="tl-quick-search-option-row">
                <LogseqTypeTag active type="PA" />
                <strong>{t('whiteboard/new-page')}</strong>
                {q}
              </div>
            ),
          },
          {
            actionIcon: 'circle-plus',
            onChosen: () => {
              handlers?.addNewWhiteboard(q)
              finishSearching(q)
              return true
            },
            element: (
              <div className="tl-quick-search-option-row">
                <LogseqTypeTag active type="WA" />
                <strong>{t('whiteboard/new-whiteboard')}</strong>
                {q}
              </div>
            ),
          }
        )
      }

      // search filters
      if (q.length === 0 && searchFilter === null) {
        options.push(
          {
            actionIcon: 'search',
            onChosen: () => {
              setSearchFilter('B')
              return true
            },
            element: (
              <div className="tl-quick-search-option-row">
                <LogseqTypeTag type="BS" />
                {t('whiteboard/search-only-blocks')}
              </div>
            ),
          },
          {
            actionIcon: 'search',
            onChosen: () => {
              setSearchFilter('P')
              return true
            },
            element: (
              <div className="tl-quick-search-option-row">
                <LogseqTypeTag type="PS" />
                {t('whiteboard/search-only-pages')}
              </div>
            ),
          }
        )
      }

      // Page results
      if ((!searchFilter || searchFilter === 'P') && searchResult && searchResult.pages) {
        options.push(
          ...searchResult.pages.map(page => {
            return {
              actionIcon: 'search' as 'search',
              onChosen: () => {
                finishSearching(page)
                return true
              },
              element: (
                <div className="tl-quick-search-option-row">
                  <LogseqTypeTag type={handlers.isWhiteboardPage(page) ? 'WP' : 'P'} />
                  {highlightedJSX(page, q)}
                </div>
              ),
            }
          })
        )
      }

      // Block results
      if ((!searchFilter || searchFilter === 'B') && searchResult && searchResult.blocks) {
        options.push(
          ...searchResult.blocks
            .filter(block => block.content && block.uuid)
            .map(({ content, uuid }) => {
              const block = handlers.queryBlockByUUID(uuid)
              return {
                actionIcon: 'search' as 'search',
                onChosen: () => {
                  if (block) {
                    finishSearching(uuid)
                    window.logseq?.api?.set_blocks_id?.([uuid])
                    return true
                  }
                  return false
                },
                element: block ? (
                  <>
                    <div className="tl-quick-search-option-row">
                      <LogseqTypeTag type="B" />
                      <div className="tl-quick-search-option-breadcrumb">
                        <Breadcrumb blockId={uuid} />
                      </div>
                    </div>
                    <div className="tl-quick-search-option-row">
                      <div className="tl-quick-search-option-placeholder" />
                      {highlightedJSX(content, q)}
                    </div>
                  </>
                ) : (
                  <div className="tl-quick-search-option-row">{t('whiteboard/cache-outdated')}</div>
                ),
              }
            })
        )
      }
      return options
    }, [q, searchFilter, searchResult, renderers?.Breadcrumb, handlers])

    React.useEffect(() => {
      const keydownListener = (e: KeyboardEvent) => {
        let newIndex = focusedOptionIdx
        if (e.key === 'ArrowDown') {
          newIndex = Math.min(options.length - 1, focusedOptionIdx + 1)
        } else if (e.key === 'ArrowUp') {
          newIndex = Math.max(0, focusedOptionIdx - 1)
        } else if (e.key === 'Enter') {
          options[focusedOptionIdx]?.onChosen()
          e.stopPropagation()
          e.preventDefault()
        } else if (e.key === 'Backspace' && q.length === 0) {
          setSearchFilter(null)
        } else if (e.key === 'Escape') {
          finishSearching('')
        }

        if (newIndex !== focusedOptionIdx) {
          const option = options[newIndex]
          setFocusedOptionIdx(newIndex)
          setPrefixIcon(option.actionIcon)
          e.stopPropagation()
          e.preventDefault()
          const optionElement = optionsWrapperRef.current?.querySelector(
            '.tl-quick-search-option:nth-child(' + (newIndex + 1) + ')'
          )
          if (optionElement) {
            // @ts-expect-error we are using scrollIntoViewIfNeeded, which is not in standards
            optionElement?.scrollIntoViewIfNeeded(false)
          }
        }
      }
      document.addEventListener('keydown', keydownListener, true)
      return () => {
        document.removeEventListener('keydown', keydownListener, true)
      }
    }, [options, focusedOptionIdx, q])

    return (
      <div className={'tl-quick-search ' + (className ?? '')} style={style}>
        <CircleButton
          icon={prefixIcon}
          onClick={() => {
            options[focusedOptionIdx]?.onChosen()
          }}
        />
        <div className="tl-quick-search-input-container">
          {searchFilter && (
            <div className="tl-quick-search-input-filter">
              <LogseqTypeTag type={searchFilter} />
              {searchFilter === 'B' ? 'Search blocks' : 'Search pages'}
              <div
                className="tl-quick-search-input-filter-remove"
                onClick={() => setSearchFilter(null)}
              >
                <TablerIcon name="x" />
              </div>
            </div>
          )}
          <TextInput
            ref={rInput}
            type="text"
            value={q}
            className="tl-quick-search-input"
            placeholder={placeholder ?? 'Create or search your graph...'}
            onChange={q => setQ(q.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                finishSearching(q)
              }
              e.stopPropagation()
            }}
            onFocus={() => {
              setShowPanel(true)
            }}
            onBlur={() => {
              setShowPanel(false)
              onBlur?.()
            }}
          />
        </div>
        {/* TODO: refactor to radix-ui popover */}
        {options.length > 0 && (
          <div
            onWheelCapture={e => e.stopPropagation()}
            className="tl-quick-search-options"
            ref={optionsWrapperRef}
            style={{
              // not using display: none so we can persist the scroll position
              visibility: showPanel ? 'visible' : 'hidden',
              pointerEvents: showPanel ? 'all' : 'none',
            }}
          >
            <Virtuoso
              style={{ height: Math.min(Math.max(1, options.length), 12) * 40 }}
              totalCount={options.length}
              itemContent={index => {
                const { actionIcon, onChosen, element } = options[index]
                return (
                  <div
                    key={index}
                    data-focused={index === focusedOptionIdx}
                    className="tl-quick-search-option"
                    tabIndex={0}
                    onMouseEnter={() => {
                      setPrefixIcon(actionIcon)
                      setFocusedOptionIdx(index)
                    }}
                    // we have to use mousedown && stop propagation EARLY, otherwise some
                    // default behavior of clicking the rendered elements will happen
                    onPointerDownCapture={e => {
                      if (onChosen()) {
                        e.stopPropagation()
                        e.preventDefault()
                      }
                    }}
                  >
                    {element}
                  </div>
                )
              }}
            />
          </div>
        )}
      </div>
    )
  }
)
