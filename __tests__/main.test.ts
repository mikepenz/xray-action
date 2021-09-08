import {Processor} from '../src/processor'

jest.setTimeout(180000)

test('import test results server', async () => {
  
  const processor = new Processor(
    {
      cloud: true,
      baseUrl: undefined,
      username: "x",
      password: "y"
    },
    {
      testFormat: "junit",
      testPaths: "marathon_tests/*.xml",
      testMerge: false,
      testExecKey: "",
      projectKey: "GHXA",
      testPlanKey: "",
      testEnvironments: "",
      revision: "",
      fixVersion: "",
      testExecutionJson: undefined,
      testJson: undefined,
    },
    {
      combineInSingleTestExec: true,
      failOnImportError: true,
      continueOnImportError: true,
      importParallelism: 2
    }
  )
  const result = await processor.process()

  // expect it to fail
  expect(result).toEqual(false)
})

test('import test results server', async () => {

  const processor = new Processor(
    {
      cloud: false,
      baseUrl: new URL("https://xray-demo3.xpand-it.com"),
      username: process.env.XRAY_USERNAME || "",
      password: process.env.XRAY_PASSWORD || ""
    },
    {
      testFormat: "junit",
      testPaths: "marathon_tests/*.xml",
      testMerge: true,
      testExecKey: "",
      projectKey: "GHXA",
      testPlanKey: "GHXA-1",
      testEnvironments: "",
      revision: "",
      fixVersion: "",
      testExecutionJson: {
        "fields": {
            "summary": "Brand new Test execution",
            "description": "This test execution covers the Android section of things"
        }
      },
      testJson:  {
        "fields": {
            "labels": [ "test_label" ]
        }
      }
    },
    {
      combineInSingleTestExec: true,
      failOnImportError: false,
      continueOnImportError: true,
      importParallelism: 2
    }
  )
  const result = await processor.process()
  
})

/*
test('import test results cloud', async () => {
  
  const processor = new Processor(
    {
      cloud: true,
      baseUrl: undefined,
      username: "x",
      password: "y"
    },
    {
      testFormat: "junit",
      testPaths: "marathon_tests/*.xml",
      testExecKey: "",
      projectKey: "TA",
      testPlanKey: "TA-33",
      testEnvironments: "",
      revision: "",
      fixVersion: "",
      testExecutionJson: {
        "fields": {
            "summary": "Brand new Test execution",
            "description": "This test execution covers the Android section of things",
            "customfield_10904": [ { "value": "Android" } ],
            "assignee": {
              "id": "123"
            },
            "issuetype": {
                "id": "123"
            }
        }
      },
      testJson: undefined,
    },
    {
      combineInSingleTestExec: true,
      failOnImportError: false,
      continueOnImportError: true,
      importParallelism: 2
    }
  )
  const result = await processor.process()
  
})
*/