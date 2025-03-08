import {XrayImportOptions, XrayOptions, ImportOptions} from './processor.js'
import * as core from '@actions/core'
import FormData from 'form-data'
import {doFormDataRequest} from './utils.js'
import {
  createSearchParams,
  updateTestExecJson,
  updateTestJson,
  updateTestExecJsonCloud,
  retrieveFileExtension
} from './xray-utils.js'
import {Xray} from './xray.js'
import got from 'got'

export class XrayCloud implements Xray {
  xrayBaseUrl: URL
  searchParams!: URLSearchParams
  token = ''

  // XrayCloud requires you to authenticate with the given credentials first
  requiresAuth = true

  constructor(
    private xrayOptions: XrayOptions,
    private xrayImportOptions: XrayImportOptions,
    private importOptions: ImportOptions
  ) {
    this.xrayBaseUrl =
      this.xrayOptions.baseUrl || new URL('https://xray.cloud.getxray.app')
    this.searchParams = createSearchParams(this.xrayImportOptions)
  }

  private protocol(): 'https:' | 'http:' {
    if (this.xrayBaseUrl.protocol === 'http') {
      return 'http:'
    } else {
      return 'https:'
    }
  }

  async auth(): Promise<void> {
    const authenticateResponse = await got.post<string>(
      `${this.xrayBaseUrl.href}api/v2/authenticate`,
      {
        json: {
          client_id: `${this.xrayOptions.username}`,
          client_secret: `${this.xrayOptions.password}`
        },
        responseType: 'json',
        timeout: {
          request: 30000 // 30s timeout
        },
        retry: {
          limit: 2 // retry count for some requests
        },
        http2: true // try to allow http2 requests
      }
    )
    this.token = authenticateResponse.body
    core.setSecret(this.token)
  }

  updateTestExecKey(testExecKey: string): void {
    this.xrayImportOptions.testExecKey = testExecKey
    this.searchParams = createSearchParams(this.xrayImportOptions)
  }

  async import(data: Buffer, mimeType: string): Promise<string> {
    // do import
    let format = this.xrayImportOptions.testFormat
    const responseTimeout = this.importOptions.responseTimeout
    if (format === 'xray') {
      format = '' // xray format has no subpath
    } else {
      format = `/${format}`
    }

    if (
      this.xrayImportOptions.testExecutionJson &&
      this.xrayImportOptions.testExecKey === ''
    ) {
      const form = new FormData()

      updateTestExecJson(
        this.xrayImportOptions,
        this.xrayImportOptions.testExecutionJson
      )
      updateTestExecJsonCloud(
        this.xrayImportOptions,
        this.xrayImportOptions.testExecutionJson
      )
      form.append(
        'info',
        JSON.stringify(this.xrayImportOptions.testExecutionJson),
        {
          contentType: 'application/json',
          filename: 'info.json',
          filepath: 'info.json'
        }
      )

      const fileExtension = retrieveFileExtension(mimeType)
      form.append('results', data.toString('utf-8'), {
        contentType: mimeType,
        filename: `test.${fileExtension}`,
        filepath: `test.${fileExtension}`
      })

      updateTestJson(this.xrayImportOptions, this.xrayImportOptions.testJson)
      if (this.xrayImportOptions.testJson) {
        form.append(
          'testInfo',
          JSON.stringify(this.xrayImportOptions.testJson),
          {
            contentType: 'application/json',
            filename: 'testInfo.json',
            filepath: 'testInfo.json'
          }
        )
      }

      core.debug(
        `Using multipart endpoint: ${this.xrayBaseUrl.href}api/v2/import/execution${format}/multipart`
      )
      const importResponse = await doFormDataRequest(form, {
        protocol: this.protocol(),
        host: this.xrayBaseUrl.host,
        path: `${this.xrayBaseUrl.pathname}api/v2/import/execution${format}/multipart`,
        headers: {Authorization: `Bearer ${this.token}`}
      })
      try {
        if (core.isDebug()) {
          core.debug(
            `Retrieved response: ${JSON.stringify(importResponse)} (11)`
          )
        }

        if (importResponse.key) {
          return importResponse.key
        } else {
          core.warning(
            `🔥 Failed to import the file: ${importResponse.error} (11)`
          )
          return ''
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        core.warning(
          `🔥 Response did not match expected format: ${JSON.stringify(
            importResponse
          )} (11)`
        )
        return ''
      }
    } else {
      const endpoint = `${this.xrayBaseUrl.href}api/v2/import/execution${format}`
      core.debug(`Using endpoint: ${endpoint}`)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const importResponse = await got.post<any>(endpoint, {
        searchParams: this.searchParams,
        headers: {
          Authorization: `Bearer ${this.token}`,
          'Content-Type': mimeType
        },
        body: data,
        responseType: 'json',
        timeout: {
          request: responseTimeout // default timeout 60s
        },
        retry: {
          limit: 2 // retry count for some requests
        },
        http2: true // try to allow http2 requests
      })
      try {
        if (core.isDebug()) {
          core.debug(
            `Retrieved response: ${JSON.stringify(importResponse)} (12)`
          )
        }

        if (importResponse.body.key) {
          return importResponse.body.key
        } else {
          core.warning(
            `🔥 Failed to import the file: ${importResponse.body.error} (12)`
          )
          return ''
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        core.warning(
          `🔥 Response did not match expected format: ${JSON.stringify(
            importResponse.body || importResponse
          )} (12)`
        )
        return ''
      }
    }
  }
}
