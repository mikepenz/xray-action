import {XrayImportOptions, XrayOptions, ImportOptions} from './processor.js'
import * as core from '@actions/core'
import FormData from 'form-data'
import {doFormDataRequest} from './utils.js'
import {
  createSearchParams,
  retrieveFileExtension,
  updateTestExecJson,
  updateTestJson
} from './xray-utils.js'
import {Xray} from './xray.js'
import got from 'got'

export class XrayServer implements Xray {
  xrayBaseUrl: URL
  searchParams!: URLSearchParams
  token = ''

  // XrayServer does not require authentication (uses BasicAuth or Token)
  requiresAuth = false

  constructor(
    private xrayOptions: XrayOptions,
    private xrayImportOptions: XrayImportOptions,
    private importOptions: ImportOptions
  ) {
    this.xrayBaseUrl =
      this.xrayOptions.baseUrl || new URL('https://sandbox.xpand-it.com')
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
    // no auth needed
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

    let authString = ''
    if (this.xrayOptions.token) {
      authString = `Bearer ${this.xrayOptions.token}`
    } else {
      authString = `Basic ${Buffer.from(
        `${this.xrayOptions.username}:${this.xrayOptions.password}`
      ).toString('base64')}`
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
      form.append(
        'info',
        JSON.stringify(this.xrayImportOptions.testExecutionJson),
        {
          contentType: 'application/json',
          filename: 'info.json',
          filepath: 'info.json'
        }
      )

      let apiPartName: string
      if (format === 'cucumber') {
        // workaround for cucumber, see for more details:
        // https://github.com/Xray-App/xray-code-snippets/blob/649be6d73d3213a22ef31a52bf6e2ac7d557330d/use_cases/import_automation_results/java/xray-code-snippets/src/main/java/com/idera/xray/XrayResultsImporter.java#L205
        apiPartName = 'result'
      } else {
        apiPartName = 'file'
      }

      const fileExtension = retrieveFileExtension(mimeType)
      form.append(apiPartName, data.toString('utf-8'), {
        contentType: mimeType,
        filename: `report.${fileExtension}`,
        filepath: `report.${fileExtension}`
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
        `Using multipart endpoint: ${this.xrayBaseUrl.href}rest/raven/2.0/import/execution${format}/multipart`
      )

      const importResponse = await doFormDataRequest(
        form,
        {
          protocol: this.protocol(),
          host: this.xrayBaseUrl.host,
          headers: {
            Authorization: authString
          },
          path: `${this.xrayBaseUrl.pathname}rest/raven/2.0/import/execution${format}/multipart`
        },
        this.importOptions.importRetryLimit
      )
      try {
        if (core.isDebug()) {
          core.debug(
            `Retrieved response: ${JSON.stringify(importResponse)} (21)`
          )
        }

        if (importResponse.testExecIssue.key) {
          return importResponse.testExecIssue.key
        } else {
          core.warning(
            `🔥 Failed to import the file: ${importResponse.error} (21)`
          )
          return ''
        }

        // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (error) {
        core.warning(
          `🔥 Response did not match expected format: ${JSON.stringify(
            importResponse
          )} (21)`
        )
        return ''
      }
    } else {
      if (mimeType === 'application/xml') {
        const form = new FormData()
        form.append('file', data.toString('utf-8'), {
          contentType: mimeType,
          filename: 'report.xml',
          filepath: 'report.xml'
        })

        const importResponse = await doFormDataRequest(
          form,
          {
            protocol: this.protocol(),
            host: this.xrayBaseUrl.host,
            headers: {
              Authorization: authString
            },
            path: `${
              this.xrayBaseUrl.pathname
            }rest/raven/2.0/import/execution${format}?${this.searchParams.toString()}`
          },
          this.importOptions.importRetryLimit
        )
        try {
          if (core.isDebug()) {
            core.debug(
              `Retrieved response: ${JSON.stringify(importResponse)} (22)`
            )
          }

          if (importResponse.testExecIssue.key) {
            return importResponse.testExecIssue.key
          } else {
            core.warning(
              `🔥 Failed to import the file: ${importResponse.error} (22)`
            )
            return ''
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          core.warning(
            `🔥 Response did not match expected format: ${JSON.stringify(
              importResponse
            )} (22)`
          )
          return ''
        }
      } else {
        const endpoint = `${this.xrayBaseUrl.href}rest/raven/2.0/import/execution${format}`
        core.debug(`Using endpoint: ${endpoint}`)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const importResponse = await got.post<any>(endpoint, {
          searchParams: this.searchParams,
          headers: {
            Authorization: authString,
            'Content-Type': mimeType
          },
          body: data,
          responseType: 'json',
          timeout: {
            request: responseTimeout // default timeout 60s
          },
          retry: {
            limit: this.importOptions.importRetryLimit // configurable retry count for import requests
          }
        })
        try {
          if (core.isDebug()) {
            core.debug(
              `Retrieved response: ${JSON.stringify(importResponse)} (23)`
            )
          }

          if (importResponse.body.testExecIssue.key) {
            return importResponse.body.testExecIssue.key
          } else {
            core.warning(
              `🔥 Failed to import the file: ${importResponse.body.error} (23)`
            )
            return ''
          }
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (error) {
          core.warning(
            `🔥 Response did not match expected format: ${JSON.stringify(
              importResponse.body || importResponse
            )} (23)`
          )
          return ''
        }
      }
    }
  }
}
