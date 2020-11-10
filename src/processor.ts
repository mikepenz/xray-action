import * as core from '@actions/core'
import * as glob from '@actions/glob'
import {PromisePool} from '@supercharge/promise-pool/dist/promise-pool'
import * as fs from 'fs'
import {Xray} from './xray'

export interface XrayOptions {
  username: string
  password: string
}

export interface XrayImportOptions {
  testFormat: string
  testPaths: string
  testExecKey: string
  projectKey: string
  testPlanKey: string
  testEnvironments: string
  revision: string
  fixVersion: string
  testExecutionJson: Object | undefined
}

export interface ImportOptions {
  combineInSingleTestExec: boolean
  failOnImportError: boolean
  continueOnImportError: boolean
  importParallelism: number
}

export class Processor {
  constructor(
    private xrayOptions: XrayOptions,
    private xrayImportOptions: XrayImportOptions,
    private importOptions: ImportOptions
  ) {}

  async process(): Promise<void> {
    core.startGroup(`🚀 Connect to jira`)

    const xray = new Xray(this.xrayOptions, this.xrayImportOptions)
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

    const importOptions = this.importOptions
    let completed = 0
    let failed = 0
    const globber = await glob.create(this.xrayImportOptions.testPaths, {
      followSymbolicLinks: false
    })

    core.info(`ℹ️ Importing from: ${this.xrayImportOptions.testPaths}`)
    core.info(`ℹ️ Importing using format: ${this.xrayImportOptions.testFormat}`)

    const files = await globber.glob()
    const filesCount = files.length

    try {
      /* does a import for a specific file */
      // eslint-disable-next-line no-inner-declarations
      async function doImport(file: string): Promise<string> {
        core.debug(`Try to import: ${file}`)
        try {
          const result = await xray.import(await fs.promises.readFile(file))
          core.info(`ℹ️ Imported: ${file} (${result})`)

          completed++
          return result
        } catch (error) {
          core.warning(`🔥 Failed to import: ${file} (${error.message})`)
          failed++

          if (!importOptions.continueOnImportError) {
            throw error
          }
        }
        return ''
      }

      // if no test exec key was specified we wanna execute once and then update the testExec for the remaining imports
      if (
        files.length > 1 &&
        !this.xrayImportOptions.testExecKey &&
        this.importOptions.combineInSingleTestExec
      ) {
        core.debug(`Do import of first file to retrieve a new testExec`)

        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const testExecKey = await doImport(files.shift()!)
        if (testExecKey) {
          xray.updateTestExecKey(testExecKey)
        } else {
          throw Error(
            "Couldn't retrieve the test exec key by importing one test"
          )
        }
      }

      // execute all remaining in parallel
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const {results} = await PromisePool.for(files)
        .withConcurrency(this.importOptions.importParallelism)
        .process(async file => await doImport(file))
    } catch (error) {
      core.warning(`🔥 Stopped import (${error.message})`)
    }

    core.info(
      `ℹ️ Processed ${completed} of ${filesCount} elements. Failed to import: ${failed}`
    )

    core.setOutput('count', filesCount)
    core.setOutput('completed', completed)
    core.setOutput('failed', failed)

    if (failed > 0 && this.importOptions.failOnImportError) {
      core.setFailed(`🔥 ${failed} failed imports detected`)
    }
    core.endGroup()
  }
}
