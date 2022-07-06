import {XrayImportOptions, XrayOptions} from './processor'
import got from 'got'
import * as core from '@actions/core'
import FormData from 'form-data'
import {doFormDataRequest} from './utils'
import {
  createSearchParams,
  updateTestExecJson,
  updateTestJson,
  updateTestExecJsonCloud,
  retrieveFileExtension
} from './xray-utils'
import {Xray} from './xray'

export class XrayCloud implements Xray {
  xrayBaseUrl = new URL('https://xray.cloud.getxray.app')
  searchParams!: URLSearchParams
  token = ''

  // XrayCloud requires to authenticate with the given credentials first
  requiresAuth = true

  constructor(
    private xrayOptions: XrayOptions,
    private xrayImportOptions: XrayImportOptions
  ) {
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
      `${this.xrayBaseUrl.href}/api/v2/authenticate`,
      {
        json: {
          client_id: `${this.xrayOptions.username}`,
          client_secret: `${this.xrayOptions.password}`
        },
        responseType: 'json',
        timeout: 30000, // 30s timeout
        retry: 2, // retry count for some requests
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
    if (format === 'xray') {
      format = '' // xray format has no subpath
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
        `Using multipart endpoint: ${this.xrayBaseUrl.href}/api/v2/import/execution/${format}/multipart`
      )
      const importResponse = await doFormDataRequest(form, {
        protocol: this.protocol(),
        host: this.xrayBaseUrl.host,
        path: `${this.xrayBaseUrl.pathname}/api/v2/import/execution/${format}/multipart`,
        headers: {Authorization: `Bearer ${this.token}`}
      })
      try {
        return importResponse.key
      } catch (error) {
        core.warning(
          `🔥 Response did not match expected format: ${JSON.stringify(
            importResponse
          )}`
        )
        return ''
      }
    } else {
      const endpoint = `${this.xrayBaseUrl.href}/api/v2/import/execution/${format}`
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
        timeout: 60000, // 60s timeout
        retry: 2, // retry count for some requests
        http2: true // try to allow http2 requests
      })
      try {
        return importResponse.body.key
      } catch (error) {
        core.warning(
          `🔥 Response did not match expected format: ${JSON.stringify(
            importResponse.body || importResponse
          )}`
        )
        return ''
      }
    }
  }
}
