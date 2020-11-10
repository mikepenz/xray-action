import {XrayOptions, XrayImportOptions} from './processor'
import got from 'got'
import * as core from '@actions/core'

export class Xray {
  xrayBaseUrl = 'https://xray.cloud.xpand-it.com'
  searchParams!: URLSearchParams
  token = ''

  constructor(
    private xrayOptions: XrayOptions,
    private xrayImportOptions: XrayImportOptions
  ) {
    this.createSearchParams()
  }

  updateTestExecKey(testExecKey: string): void {
    this.xrayImportOptions.testExecKey = testExecKey
    this.createSearchParams()
  }

  createSearchParams(): void {
    // prepare params
    const elements: string[][] = [
      ['projectKey', this.xrayImportOptions.projectKey]
    ]
    if (this.xrayImportOptions.testExecKey) {
      elements.push(['testExecKey', this.xrayImportOptions.testExecKey])
    }
    if (this.xrayImportOptions.testPlanKey) {
      elements.push(['testPlanKey', this.xrayImportOptions.testPlanKey])
    }
    if (this.xrayImportOptions.testEnvironments) {
      elements.push([
        'testEnvironments',
        this.xrayImportOptions.testEnvironments
      ])
    }
    if (this.xrayImportOptions.revision) {
      elements.push(['revision', this.xrayImportOptions.revision])
    }
    if (this.xrayImportOptions.fixVersion) {
      elements.push(['fixVersion', this.xrayImportOptions.fixVersion])
    }
    this.searchParams = new URLSearchParams(elements)
  }

  async auth(): Promise<void> {
    const authenticateResponse = await got.post<string>(
      `${this.xrayBaseUrl}/api/v1/authenticate`,
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

  async import(data: Buffer): Promise<string> {
    // do import
    let format = this.xrayImportOptions.testFormat
    if (format === 'xray') {
      format = '' // xray format has no subpath
    }

    const endpoint = `${this.xrayBaseUrl}/api/v1/import/execution/${format}`
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
      timeout: 30000, // 30s timeout
      retry: 2, // retry count for some requests
      http2: true // try to allow http2 requests
    })
    return importResponse.body.key
  }
}
