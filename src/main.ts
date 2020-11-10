import * as core from '@actions/core'
import {Processor} from './processor'
import {resolveJson, retrieveRepositoryPath} from './utils'

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

    // credentials for xray
    const username: string = core.getInput('username')
    const password: string = core.getInput('password')

    // params for xray
    const testPaths: string = core.getInput('testPaths')
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

    await new Processor(
      {
        username,
        password
      },
      {
        testFormat,
        testPaths,
        testExecKey,
        projectKey,
        testPlanKey,
        testEnvironments,
        revision,
        fixVersion,
        testExecutionJson
      },
      {
        combineInSingleTestExec,
        failOnImportError,
        continueOnImportError,
        importParallelism
      }
    ).process()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
