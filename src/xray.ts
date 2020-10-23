import {XrayOptions, ImportOptions} from './processor'
import got from 'got'
import * as core from '@actions/core'

export class Xray {
  xrayBaseUrl = 'https://xray.cloud.xpand-it.com'
  searchParams: URLSearchParams
  token = ''

  constructor(
    private xrayOptions: XrayOptions,
    private importOptions: ImportOptions
  ) {
    // parepare params
    const elements: string[][] = [
      ['testExecKey', this.importOptions.testExecKey],
      ['projectKey', this.importOptions.projectKey]
    ]
    if (this.importOptions.testPlanKey) {
      elements.push(['testPlanKey', this.importOptions.testPlanKey])
    }
    if (this.importOptions.testEnvironments) {
      elements.push(['testEnvironments', this.importOptions.testEnvironments])
    }
    if (this.importOptions.revision) {
      elements.push(['revision', this.importOptions.revision])
    }
    if (this.importOptions.fixVersion) {
      elements.push(['fixVersion', this.importOptions.fixVersion])
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
        timeout: 30000,   // 30s timeout
        retry: 2,         // retry count for some requests
        http2: true       // try to allow http2 requests
      }
    )
    this.token = authenticateResponse.body
    core.setSecret(this.token)
  }

  async import(data: Buffer): Promise<string> {
    // do import
    let format = this.importOptions.testFormat
    if (format === 'xray') {
      format = '' // xray format has no subpath
    }

    const endpoint = `${this.xrayBaseUrl}/api/v1/import/execution/${format}`
    core.debug(`Using endpoint: ${endpoint}`)

    const importResponse = await got.post<string>(endpoint, {
      searchParams: this.searchParams,
      headers: {
        'Content-Type': 'text/xml',
        Authorization: `Bearer ${this.token}`
      },
      body: data,
      responseType: 'json',
      timeout: 30000,   // 30s timeout
      retry: 2,         // retry count for some requests
      http2: true       // try to allow http2 requests
    })
    return importResponse.body
  }
}
