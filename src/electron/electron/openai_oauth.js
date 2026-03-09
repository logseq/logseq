const crypto = require('crypto')
const http = require('http')
const path = require('path')
const { app, net, shell } = require('electron')
const { promises: fs } = require('fs')

const DEFAULT_CLIENT_ID = 'app_EMoamEEZ73f0CkXaXp7hrann'
const ISSUER = 'https://auth.openai.com'
const REDIRECT_URI = 'http://localhost:1455/auth/callback'
const CREDS_PATH = path.join(app.getPath('home'), '.logseq', 'oauth', 'openai.json')
const CALLBACK_TIMEOUT_MS = 600000

class OpenAIService {
  constructor() {
    this.current = null
    this.callbackServer = null
  }

  generatePKCEState() {
    const verifier = crypto.randomBytes(32).toString('base64url')
    const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
    const state = crypto.randomBytes(16).toString('base64url')
    return { verifier, challenge, state }
  }

  buildAuthorizeUrl(pkce, clientId) {
    const url = new URL(`${ISSUER}/oauth/authorize`)
    url.searchParams.set('response_type', 'code')
    url.searchParams.set('client_id', clientId)
    url.searchParams.set('redirect_uri', REDIRECT_URI)
    url.searchParams.set('scope', 'openid profile email offline_access')
    url.searchParams.set('code_challenge', pkce.challenge)
    url.searchParams.set('code_challenge_method', 'S256')
    url.searchParams.set('state', pkce.state)
    return url.toString()
  }

  async exchangeCodeForTokens(code, verifier, clientId) {
    const response = await net.fetch(`${ISSUER}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: REDIRECT_URI,
        client_id: clientId,
        code_verifier: verifier
      }).toString()
    })
    if (!response.ok) {
      throw new Error(`OpenAI token exchange failed: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_at: data.expires_at || (Date.now() + Number(data.expires_in || 0) * 1000),
      expires_in: Number(data.expires_in || 0),
      id_token: data.id_token,
      token_type: data.token_type,
      scope: data.scope
    }
  }

  async refreshAccessToken(refreshToken, clientId) {
    const response = await net.fetch(`${ISSUER}/oauth/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: refreshToken,
        client_id: clientId
      }).toString()
    })
    if (!response.ok) {
      throw new Error(`OpenAI token refresh failed: ${response.status} ${response.statusText}`)
    }
    const data = await response.json()
    return {
      access_token: data.access_token,
      refresh_token: data.refresh_token || refreshToken,
      expires_at: data.expires_at || (Date.now() + Number(data.expires_in || 0) * 1000),
      expires_in: Number(data.expires_in || 0),
      id_token: data.id_token,
      token_type: data.token_type,
      scope: data.scope
    }
  }

  async saveCredentials(creds) {
    await fs.mkdir(path.dirname(CREDS_PATH), { recursive: true })
    await fs.writeFile(CREDS_PATH, JSON.stringify(creds, null, 2))
    await fs.chmod(CREDS_PATH, 0o600)
  }

  async loadCredentials() {
    try {
      const text = await fs.readFile(CREDS_PATH, 'utf-8')
      return JSON.parse(text)
    } catch {
      return null
    }
  }

  async getValidCredentials() {
    const clientId = DEFAULT_CLIENT_ID
    const creds = await this.loadCredentials()
    if (!creds) return null
    if (Number(creds.expires_at || 0) > Date.now() + 60000) {
      return creds
    }
    if (!creds.refresh_token) {
      return null
    }
    const refreshed = await this.refreshAccessToken(creds.refresh_token, clientId)
    const merged = { ...refreshed, id_token: refreshed.id_token || creds.id_token }
    await this.saveCredentials(merged)
    return merged
  }

  async startCallbackServer(expectedState) {
    await this.stopCallbackServer()
    return new Promise((resolve, reject) => {
      const callbackUrl = new URL(REDIRECT_URI)
      const timeout = setTimeout(() => {
        this.stopCallbackServer().finally(() => {
          reject(new Error('Timed out waiting for OpenAI OAuth callback'))
        })
      }, CALLBACK_TIMEOUT_MS)

      this.callbackServer = http.createServer((req, res) => {
        try {
          const host = req.headers.host || `localhost:${callbackUrl.port || '1455'}`
          const reqUrl = new URL(req.url, `${callbackUrl.protocol}//${host}`)
          if (reqUrl.pathname !== callbackUrl.pathname) {
            res.statusCode = 404
            res.end('Not found')
            return
          }
          const state = reqUrl.searchParams.get('state') || ''
          const code = reqUrl.searchParams.get('code') || ''
          const error = reqUrl.searchParams.get('error') || ''
          const errorDescription = reqUrl.searchParams.get('error_description') || ''

          if (error) {
            res.statusCode = 400
            res.setHeader('content-type', 'text/plain; charset=utf-8')
            res.end(`Authentication failed: ${error}\n${errorDescription}`)
            clearTimeout(timeout)
            this.stopCallbackServer().finally(() => reject(new Error(`OAuth error: ${error}`)))
            return
          }

          if (!code) {
            res.statusCode = 400
            res.end('Missing authorization code')
            clearTimeout(timeout)
            this.stopCallbackServer().finally(() => reject(new Error('Authorization code not found in callback')))
            return
          }

          if (state !== expectedState) {
            res.statusCode = 400
            res.end('State mismatch')
            clearTimeout(timeout)
            this.stopCallbackServer().finally(() => reject(new Error('State mismatch detected')))
            return
          }

          res.statusCode = 200
          res.setHeader('content-type', 'text/html; charset=utf-8')
          res.end('<!doctype html><html><body style="font-family:sans-serif;padding:24px"><h2>Authentication succeeded</h2><p>You can close this tab and return to Logseq.</p></body></html>')
          clearTimeout(timeout)
          this.stopCallbackServer().finally(() => resolve(reqUrl.toString()))
        } catch (error) {
          clearTimeout(timeout)
          this.stopCallbackServer().finally(() => reject(error))
        }
      })

      this.callbackServer.on('error', (error) => {
        clearTimeout(timeout)
        reject(error)
      })

      this.callbackServer.listen(Number(callbackUrl.port || '1455'))
    })
  }

  async stopCallbackServer() {
    if (!this.callbackServer) return
    const server = this.callbackServer
    this.callbackServer = null
    await new Promise((resolve) => server.close(() => resolve()))
  }

  async authenticate() {
    const clientId = DEFAULT_CLIENT_ID
    const existing = await this.getValidCredentials()
    if (existing) {
      return existing
    }

    this.current = this.generatePKCEState()
    const callbackPromise = this.startCallbackServer(this.current.state)
    const authUrl = this.buildAuthorizeUrl(this.current, clientId)
    await shell.openExternal(authUrl)
    const redirectUrl = await callbackPromise
    const url = new URL(redirectUrl)
    const code = url.searchParams.get('code') || ''
    if (!code) {
      this.current = null
      throw new Error('Authorization code not found in redirect URL')
    }
    const creds = await this.exchangeCodeForTokens(code, this.current.verifier, clientId)
    await this.saveCredentials(creds)
    this.current = null
    return creds
  }

  cancelOAuthFlow() {
    this.current = null
    this.stopCallbackServer().catch(() => null)
  }

  async clearCredentials() {
    try {
      await fs.unlink(CREDS_PATH)
    } catch (error) {
      if (error && error.code !== 'ENOENT') {
        throw error
      }
    }
  }
}

module.exports = new OpenAIService()
