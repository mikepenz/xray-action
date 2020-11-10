<div align="center">
  :octocat:
</div>
<h1 align="center">
  xray-action
</h1>

<p align="center">
    ... a GitHub action to import test results into "Xray" - A complete Test Management tool for Jira.
</p>

<div align="center">
  <a href="https://github.com/mikepenz/xray-action/actions">
		<img src="https://github.com/mikepenz/xray-action/workflows/CI/badge.svg"/>
	</a>
</div>
<br />

-------

<p align="center">
    <a href="#setup">Setup 🛠️</a> &bull;
    <a href="#contribute-">Contribute 🧬</a> &bull;
    <a href="#license">License 📓</a>
</p>

-------

## Setup

### Configure the workflow

Specify the action as part of your GitHub actions workflow:

```yml
- name: "Import files"
  uses: mikepenz/xray-action@{latest-release}
  with:
    username: ${{ secrets.XRAY_USERNAME }}
    password: ${{ secrets.XRAY_PASSWORD }}
    testFormat: "junit"
    testPaths: "**/test/*.xml"
    testExecKey: "TEST-1"
    projectKey: "TEST"
```

💡 Do not specify username and password in cleartext, instead prefer to read them from GitHub action secrets.

| **Input**                 | **Description**                                                                                                                                                | **Required** |
|---------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------|
| `username`                | Username required to login to the Xray cloud                                                                                                                   | x            |
| `password`                | Password required to login to the Xray cloud                                                                                                                   | x            |
| `testFormat`              | Describes the import formats ["xray", "cucumber", "behave", "junit", "testng", "nunit", "xunit", "robot", "bundle"]                                            | x            |
| `testPaths`               | [Glob](https://github.com/actions/toolkit/tree/master/packages/glob) expression to junit report paths. The default is `**/junit-reports/TEST-*.xml`.           | x            |
| `testExecKey`             | Key of the Test Execution                                                                                                                                      | x            |
| `projectKey`              | Key of the project where the Test Execution (if the testExecKey parameter wasn't provided) and the tests (if they aren't created yet) are going to be created. | x            |
| `testPlanKey`             | Key of the Test Plan; if you specify the Test Plan, the Tests will be added automatically to the Test Plan if they're not part of it.                          |              |
| `testEnvironments`        | A string containing a list of test environments separated by ";"                                                                                               |              |
| `revision`                | Source code and documentation version used in the test execution.                                                                                              |              |
| `fixVersion`              | The Fix Version associated with the test execution (it supports only one value).                                                                               |              |
| `combineInSingleTestExec` | If no `testExecKey` is provided, it will generate a testExec with the first import, and reuse the same for all other imports. (Default: false)                 |              |
| `failOnImportError`       | Defines if the action should fail if an import error occurred. (Default: false)                                                                                |              |
| `continueOnImportError`   | Defines if the action should continue after a single import error occurred. (Default: true)                                                                    |              |
| `importParallelism`       | Specifies the level of parallelism to import to Xray. (Default: 12)                                                                                            |              |

### Action outputs

After action execution it will return helpful information.

```yml
# ${{steps.{XRAY_STEP_ID}.outputs.count}}
${{steps.xray.outputs.count}}
```

A full set list of possible output values for this action.


| **Output** | **Description**              |
|------------|------------------------------|
| count      | The count of imported files. |
| failed     | The count of failed imports. |

## Contribute 🧬

```bash
# Install the dependencies  
$ npm install

# Build the typescript and package it for distribution
$ npm run build && npm run package

# Run the tests, use to debug, and test it out
# Please note you have to uncomment the test
# Provide your xray instance username and password
# And then execute the test:
$ npm test

# Verify lint is happy
$ npm run lint -- --fix
```

## Xray

- [Xray](https://docs.getxray.app/site/xray) website
- Currently supporting all (non multipart) requests according to [Xray REST API documentation](https://docs.getxray.app/display/XRAY/Import+Execution+Results+-+REST#ImportExecutionResultsREST-xUnitXMLresults)

## Developed By

* Mike Penz
 * [mikepenz.com](http://mikepenz.com) - <mikepenz@gmail.com>
 * [paypal.me/mikepenz](http://paypal.me/mikepenz)

## License

    Copyright 2020 Mike Penz

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
