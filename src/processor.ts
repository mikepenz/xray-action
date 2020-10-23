import * as core from '@actions/core'
import * as glob from '@actions/glob'
import * as fs from 'fs'
import {Xray} from './xray'

export interface XrayOptions {
  username: string
  password: string
}

export interface ImportOptions {
  testFormat: string
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

    const xray = new Xray(this.xrayOptions, this.importOptions)
    core.info('ℹ️ Start logging in procedure to xray')
    try {
      await xray.auth()
      core.info('ℹ️ Completed login and retrieved token')
    } catch (error) {
      core.setFailed(`🔥 Failed to authenticate with Xray: ${error}`)
      return
    }

    core.endGroup()
    core.startGroup(`📝 Import test reports`)

    let count = 0
    let failed = 0
    const globber = await glob.create(this.importOptions.testPaths, {
      followSymbolicLinks: false
    })

    core.info(`ℹ️ Importing from: ${this.importOptions.testPaths}`)
    core.info(`ℹ️ Importing using format: ${this.importOptions.testFormat}`)

    for await (const file of globber.globGenerator()) {
      core.debug(`Try to import: ${file}`)
      count++
      try {
        const result = await xray.import(await fs.promises.readFile(file))
        core.info(`ℹ️ Imported: ${file} to ${result.toString()}`)
      } catch (error) {
        core.warning(`🔥 Failed to import: ${file}`)
        failed++

        if (!this.importOptions.continueOnImportError) {
          break
        }
      }
    }

    core.info(`ℹ️ Processed ${count} elements. Failed to import: ${failed}`)

    core.setOutput('count', count)
    core.setOutput('failed', failed)
    
    if (failed > 0 && this.importOptions.failOnImportError) {
      core.setFailed(`🔥 ${failed} failed imports detected`)
    }
    core.endGroup()
  }
}
