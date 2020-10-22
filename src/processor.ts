import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as fs from 'fs'
import got from 'got'

export interface XrayOptions {
  username: string
  password: string
}

export interface ImportOptions {
  testPaths: string
  testExecKey: string
  projectKey: string
  testPlanKey: string
  testEnvironments: string
  revision: string
  fixVersion: string
  failOnImportError: boolean
  continueOnImportError: boolean
}

export class Processor {
  constructor(
    private xrayOptions: XrayOptions,
    private importOptions: ImportOptions
  ) {}

  async process(): Promise<void> {
    core.startGroup(`🚀 Connect to jira`)

    const xrayBaseUrl = 'https://xray.cloud.xpand-it.com'
    const authenticateResponse = await got.post<String>(
      `${xrayBaseUrl}/api/v1/authenticate`,
      {
        json: {
          client_id: `${this.xrayOptions.username}`,
          client_secret: `${this.xrayOptions.password}`
        },
        responseType: 'json'
      }
    )
    const token = authenticateResponse.body

    core.endGroup()
    core.startGroup(`🚀 Import test reports`)

    // construct search params
    let searchParams: any = {
      testExecKey: this.importOptions.testExecKey,
      projectKey: this.importOptions.projectKey
    }
    if (this.importOptions.testPlanKey) {
      searchParams['testPlanKey'] = this.importOptions.testPlanKey
    }
    if (this.importOptions.testEnvironments) {
      searchParams['testEnvironments'] = this.importOptions.testEnvironments
    }
    if (this.importOptions.revision) {
      searchParams['revision'] = this.importOptions.revision
    }
    if (this.importOptions.fixVersion) {
      searchParams['fixVersion'] = this.importOptions.fixVersion
    }

    let count = 0
    let failed = 0
    const globber = await glob.create(this.importOptions.testPaths, {
      followSymbolicLinks: false
    })

    for await (const file of globber.globGenerator()) {
      core.debug(`Try to import: ${file}`)
      count++
      try {
        const data = await fs.promises.readFile(file)
        const importResponse = await got.post<String>(
          `${xrayBaseUrl}/api/v1/import/execution/junit`,
          {
            searchParams,
            headers: {
              'Content-Type': 'text/xml',
              Authorization: `Bearer ${token}`
            },
            body: data,
            responseType: 'json'
          }
        )

        core.info(`Imported: ${file} to ${importResponse.body.toString()}`)
      } catch (error) {
        core.warning(`Failed to import: ${file}`)
        failed++

        if (!this.importOptions.continueOnImportError) {
          break
        }
      }
    }

    core.info(`Processed ${count} elements. Failed to import: ${failed}`)

    if (failed > 0 && this.importOptions.failOnImportError) {
      core.setFailed(`${failed} Failed imports detected`)
    }
    core.endGroup()
  }
}
