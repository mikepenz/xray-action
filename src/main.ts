import * as core from '@actions/core'
import {Processor} from './processor'

async function run(): Promise<void> {
  try {
    const username: string = core.getInput('username')
    const password: string = core.getInput('password')

    const testPaths: string = core.getInput('testPaths')
    const testFormat: string = core.getInput('testFormat')
    const testExecKey: string = core.getInput('testExecKey')
    const projectKey: string = core.getInput('projectKey')
    const testPlanKey: string = core.getInput('testPlanKey')
    const testEnvironments: string = core.getInput('testEnvironments')
    const revision: string = core.getInput('revision')
    const fixVersion: string = core.getInput('fixVersion')
    const combineInSingleTestExec: boolean = 
      core.getInput('combineInSingleTestExec') === 'true'
    const failOnImportError: boolean =
      core.getInput('failOnImportError') === 'true'
    const continueOnImportError: boolean =
      core.getInput('continueOnImportError') === 'true'

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
        combineInSingleTestExec,
        failOnImportError,
        continueOnImportError
      }
    ).process()
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
