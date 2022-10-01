import { createState, useState } from '@hookstate/core'

// @ts-ignore
import os from 'platform-detect/os.mjs'
import { useEffect } from 'react'

export const checkSmBreakPoint = () => {
  return (
    visualViewport?.width ||
    document.documentElement.clientWidth
  ) <= 640
}

const appState = createState({
  os, sm: checkSmBreakPoint(),
  releases: {
    fetching: false,
    downloads: {}, // macos -> download url
    fetchErr: null,
  },
  discord: {
    guild: null,
    approximate_member_count: 0,
    approximate_presence_count: 0,
  },
})

const releasesEndpoint = 'https://api.github.com/repos/logseq/logseq/releases'
const discordEndpoint = 'https://discord.com/api/v9/invites/VNfUaTtdFb?with_counts=true&with_expiration=true'

export function useReleasesState () {
  const state = useAppState()

  useEffect(() => {
    if (!state.releases.fetching.get()) {
      state.releases.fetching.set(true)

      fetch(releasesEndpoint).then(res => res.json()).then((json) => {
        // TODO: parse downloads
        let latestRelease = null

        if (json && Array.isArray(json)) {
          json.some(it => {
            if (it.hasOwnProperty('tag_name') &&
              it.tag_name?.toLowerCase() !== 'nightly' &&
              Array.isArray(it.assets)
            ) {
              const platformMappings = {
                'macos-x64': (it: string) => it.includes('x64') &&
                  it.endsWith('.dmg'),
                'macos-arm64': (it: string) => it.includes('arm64') &&
                  it.endsWith('.dmg'),
                'android': (it: string) => it.endsWith('.apk'),
                'linux': (it: string) => it.endsWith('.AppImage'),
                'windows': (it: string) => it.endsWith('.exe'),
              }

              latestRelease = it.assets.reduce((a: any, b: any) => {
                Object.entries(platformMappings).some(([label, validator]) => {
                  if (validator(b.name)) {
                    a[label] = b
                    return true
                  }
                })

                return a
              }, {})

              return true
            }
          })

          state.releases.downloads.set(latestRelease as any)
        }

        if (!latestRelease) {
          throw new Error('Parse latest release failed!')
        }
      }).catch(e => {
        state.releases.fetchErr.set(e)
      }).finally(() => {
        state.releases.fetching.set(false)
      })
    }
  }, [])

  return state.releases
}

export function useDiscordState () {
  const state = useAppState()

  useEffect(() => {
    fetch(discordEndpoint).then(res => res.json()).then((json: any) => {
      if (json && json.guild) {
        state.discord.set(json as any)
      }
    }).catch(e => {
      console.debug(
        '[Fetch Discord Err]', e,
      )
    })
  }, [])

  return state.discord
}

export function useAppState () {
  return useState(appState)
}

// @ts-ignore
window.__appState = appState
