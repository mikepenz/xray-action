import * as core from '@actions/core'
import {Processor} from './processor'
import {resolveJson, retrieveRepositoryPath} from './utils'
import {
  JUNIT_FORMAT,
  ReportConfig,
  XrayCloudClient,
  XrayDatacenterClient,
  XraySettings
} from '@xray-app/xray-automation/dist/types'
import { AnyRecord } from 'dns'

async function run(): Promise<void> {
  try {
    // read in path specification, resolve github workspace, and repo path
    const inputPath = core.getInput('path')
    const repositoryPath = retrieveRepositoryPath(inputPath)

    // read in test exec config file if possible
    const testExecutionJsonInput: string = core.getInput('testExecutionJson')
    const testExecutionJson = resolveJson(
      repositoryPath,
      testExecutionJsonInput
    )

    // read in test config file if possible
    const testJsonInput: string = core.getInput('testJson')
    const testJson = resolveJson(repositoryPath, testJsonInput)

    // credentials for xray
    const cloud: boolean = core.getInput('xrayCloud') === 'true'
    const xrayBaseUrl: string = core.getInput('xrayBaseUrl')
    let baseUrl: URL | undefined = undefined
    if (xrayBaseUrl !== '') {
      try {
        baseUrl = new URL(xrayBaseUrl)
      } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
        core.setFailed(error.message)
      }
    }

    const xrayToken: string = core.getInput('xrayToken')
    const username: string = core.getInput('username')
    const password: string = core.getInput('password')
    if (!username && !xrayToken) {
      core.setFailed('The required `username` is missing')
      return
    } else if (!password && !xrayToken) {
      core.setFailed('The required `password` is missing')
      return
    }

    // params for xray
    const testPaths: string = core.getInput('testPaths')
    const testMerge: boolean = core.getInput('testMerge') === 'true'
    const testFormat: string = core.getInput('testFormat')
    const testExecKey: string = core.getInput('testExecKey')
    const projectKey: string = core.getInput('projectKey')
    const testPlanKey: string = core.getInput('testPlanKey')
    const testEnvironments: string = core.getInput('testEnvironments')
    const revision: string = core.getInput('revision')
    const fixVersion: string = core.getInput('fixVersion')

    // importConfigurations
    const combineInSingleTestExec: boolean =
      core.getInput('combineInSingleTestExec') === 'true'
    const failOnImportError: boolean =
      core.getInput('failOnImportError') === 'true'
    const continueOnImportError: boolean =
      core.getInput('continueOnImportError') === 'true'
    const importParallelism: number =
      Number(core.getInput('importParallelism')) || 2 // by default go to 2 parallelism
    const responseTimeout: number =
      Number(core.getInput('responseTimeout')) || 60000 // by default 60s

    const xrayCloudSettings: XraySettings = {
      clientId: username,
      clientSecret: password,
      timeout: responseTimeout
    }

    let xrayClient: unknown
    if (cloud) {
      xrayClient = new XrayCloudClient(xrayCloudSettings)
    } else {
      const configUsingToken: XraySettings = {
        jiraBaseUrl: baseUrl,
        jiraToken: xrayToken,
        timeout: responseTimeout
      }
      xrayClient = new XrayDatacenterClient(configUsingToken)
    }

    const reportFile = 'report.xml'
    const reportConfig: ReportConfig = {
      format: JUNIT_FORMAT,
      projectKey,
      version: '1.0',
      revision: '123',
      testPlanKey,
      testExecKey,
      testEnvironments: []
    }

    let res = await xrayClient.submitResults(reportFile, reportConfig)

    await new Processor(
      {
        cloud,
        baseUrl,
        username,
        password,
        token: xrayToken
      },
      {
        testFormat,
        testPaths,
        testMerge,
        testExecKey,
        projectKey,
        testPlanKey,
        testEnvironments,
        revision,
        fixVersion,
        testExecutionJson,
        testJson
      },
      {
        combineInSingleTestExec,
        failOnImportError,
        continueOnImportError,
        importParallelism,
        responseTimeout
      }
    ).process()
  } catch (error: any /* eslint-disable-line @typescript-eslint/no-explicit-any */) {
    core.setFailed(error.message)
  }
}

run()
