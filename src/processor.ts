import * as core from '@actions/core'
import * as fs from 'fs'
import {lookup} from 'mime-types'
import {retrieveTestFiles} from './utils.js'
import {Xray} from './xray.js'
import {XrayCloud} from './xray-cloud.js'
import {XrayServer} from './xray-server.js'
import { PromisePool } from '@supercharge/promise-pool/dist/promise-pool.js'

export interface XrayOptions {
  cloud: boolean
  baseUrl?: URL
  username?: string
  password?: string
  token?: string
}

export interface XrayImportOptions {
  testFormat: string
  testPaths: string
  testMerge: boolean
  testExecKey: string
  projectKey: string
  testPlanKey: string
  testEnvironments: string
  revision: string
  fixVersion: string
  testExecutionJson?: Object // only used in case of multipart API
  testJson?: Object // only used in case of multipart API
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

  async process(): Promise<boolean> {
    core.startGroup(`🚀 Connect to xray`)

    let xray: Xray
    if (this.xrayOptions.cloud) {
      xray = new XrayCloud(this.xrayOptions, this.xrayImportOptions)
      core.info('ℹ️ Configured XrayCloud')
    } else {
      xray = new XrayServer(this.xrayOptions, this.xrayImportOptions)
      core.info('ℹ️ Configured XrayServer')
    }

    if (xray.requiresAuth) {
      core.info('ℹ️ Start logging in procedure to xray')
      try {
        await xray.auth()
        core.info('ℹ️ Completed login and retrieved token')
      } catch (error) {
        core.setFailed(`🔥 Failed to authenticate with Xray: ${error}`)
        return false
      }
    } else {
      core.info(
        'ℹ️ No authentication required, using Basic Auth or provided token'
      )
    }

    core.endGroup()
    core.startGroup(`📝 Import test reports`)

    const importOptions = this.importOptions
    let completed = 0
    let failed = 0

    core.info(`ℹ️ Importing from: ${this.xrayImportOptions.testPaths}`)
    core.info(`ℹ️ Importing using format: ${this.xrayImportOptions.testFormat}`)

    // load the test files, this may merge the results into a single file
    const files = await retrieveTestFiles(
      this.xrayImportOptions.testMerge,
      this.xrayImportOptions.testFormat,
      this.xrayImportOptions.testPaths
    )

    try {
      /* does a import for a specific file */
      // eslint-disable-next-line no-inner-declarations
      async function doImport(file: string): Promise<string> {
        core.debug(`Try to import: ${file}`)
        try {
          // identify mimetype
          const tmpMime = lookup(file)
          let mimeType: string
          if (tmpMime === false) {
            mimeType = 'application/xml'
          } else {
            mimeType = tmpMime
          }

          // execute import
          const result = await xray.import(
            await fs.promises.readFile(file),
            mimeType
          )
          core.info(`ℹ️ Imported: ${file} (${result})`)

          completed++
          return result
        } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
          core.warning(`🔥 Failed to import: ${file} (${error.message})`)
          failed++

          if (!importOptions.continueOnImportError) {
            throw error
          }
        }
        return ''
      }

      // all exec keys
      const execKeys = []

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
          execKeys.push(testExecKey)
        } else {
          throw Error(
            "Couldn't retrieve the test exec key by importing one test"
          )
        }
      }

      if (files.length > 0) {
        // execute all remaining in parallel
        const {results} = await PromisePool.for(files)
          .withConcurrency(this.importOptions.importParallelism)
          .process(async file => await doImport(file))

        execKeys.push(results)
      }

      core.setOutput('testExecKey', execKeys.join(','))
    } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
      core.warning(`🔥 Stopped import (${error.message})`)
    }

    core.info(
      `ℹ️ Processed ${completed} of ${files.length} elements. Failed to import: ${failed}`
    )

    core.setOutput('count', files.length)
    core.setOutput('completed', completed)
    core.setOutput('failed', failed)

    let success = true
    if (failed > 0 && this.importOptions.failOnImportError) {
      core.setFailed(`🔥 ${failed} failed imports detected`)
      success = false
    }
    core.endGroup()
    return success
  }
}
