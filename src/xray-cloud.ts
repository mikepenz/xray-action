import {XrayOptions, XrayImportOptions} from './processor'
import got from 'got'
import * as core from '@actions/core'
import FormData from 'form-data'
import {doFormDataRequest} from './utils'
import { createSearchParams, updateTestExecJson } from './xray-utils';
import { Xray } from './xray'

export class XrayCloud implements Xray {
  xrayProtocol = 'https'
  xrayBaseUrl = 'xray.cloud.xpand-it.com'
  searchParams!: URLSearchParams
  token = ''

  constructor(
    private xrayOptions: XrayOptions,
    private xrayImportOptions: XrayImportOptions
  ) {
    this.searchParams = createSearchParams(this.xrayImportOptions)
  }

  async auth(): Promise<void> {
    const authenticateResponse = await got.post<string>(
      `${this.xrayProtocol}://${this.xrayBaseUrl}/api/v1/authenticate`,
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
  
  updateTestExecKey(testExecKey: string): URLSearchParams {
      this.xrayImportOptions.testExecKey = testExecKey
      return createSearchParams(this.xrayImportOptions)
  }

  async import(data: Buffer): Promise<string> {
    // do import
    let format = this.xrayImportOptions.testFormat
    if (format === 'xray') {
      format = '' // xray format has no subpath
    }

    if (
      this.xrayImportOptions.testExecutionJson &&
      !this.xrayImportOptions.testExecKey
    ) {
      const form = new FormData()
      updateTestExecJson(this.xrayImportOptions, this.xrayImportOptions.testExecutionJson)
      form.append(
        'info',
        JSON.stringify(this.xrayImportOptions.testExecutionJson),
        {
          contentType: 'application/json',
          filename: 'info.json',
          filepath: 'info.json'
        }
      )
      form.append('results', data.toString('utf-8'), {
        contentType: 'text/xml',
        filename: 'test.xml',
        filepath: 'test.xml'
      })
      form.append(
        'testInfo',
        JSON.stringify({
          fields: {
            project: {
              key: this.xrayImportOptions.projectKey
            }
          }
        }),
        {
          contentType: 'application/json',
          filename: 'testInfo.json',
          filepath: 'testInfo.json'
        }
      )

      core.debug(
        `Using multipart endpoint: ${this.xrayProtocol}://${this.xrayBaseUrl}/api/v1/import/execution/${format}/multipart`
      )
      const importResponse = await doFormDataRequest(form, {
        host: this.xrayBaseUrl,
        path: `/api/v1/import/execution/${format}/multipart`,
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
      const endpoint = `${this.xrayProtocol}://${this.xrayBaseUrl}/api/v1/import/execution/${format}`
      core.debug(`Using endpoint: ${endpoint}`)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const importResponse = await got.post<any>(endpoint, {
        searchParams: this.searchParams,
        headers: {
          'Content-Type': 'text/xml',
          Authorization: `Bearer ${this.token}`
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
