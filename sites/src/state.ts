import { createState, useState } from '@hookstate/core'

// @ts-ignore
import os from 'platform-detect/os.mjs'
import { useEffect } from 'react'

const appState = createState({
  os,
  releases: {
    fetching: false,
    downloads: {}, // macos -> download url
    error: null
  }
})

const releasesEndpoint = 'https://api.github.com/repos/logseq/logseq/releases'

export function useReleases () {
  const state = useAppState()

  useEffect(() => {
    if (!state.releases.fetching.get()) {
      state.releases.fetching.set(true)

      fetch(releasesEndpoint)
        .then(res => res.json())
        .then((json) => {
          // TODO: parse downloads
          let latestRelease = null

          if (json && Array.isArray(json)) {
            json.some(it => {
              if (it.hasOwnProperty('tag_name') &&
                it.tag_name?.toLowerCase() !== 'nightly' &&
                Array.isArray(it.assets)
              ) {
                const platformMappings = {
                  'macos-x64': (it: string) => it.includes('x64') && it.endsWith('.dmg'),
                  'macos-arm64': (it: string) => it.includes('arm64') && it.endsWith('.dmg'),
                  'android': (it: string) => it.endsWith('.apk'),
                  'linux': (it: string) => it.endsWith('.AppImage'),
                  'windows': (it: string) => it.endsWith('.exe')
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
        })
        .catch(e => {
          state.releases.error.set(e)
        })
        .finally(() => {
          state.releases.fetching.set(false)
        })
    }
  }, [])

  return state.releases
}

export function useAppState () {
  return useState(appState)
}