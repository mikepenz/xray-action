<div align="center">
  :octocat:
</div>
<h1 align="center">
  xray-action
</h1>

<p align="center">
    ... imports JUnit test results using xray for jira
</p>

<div align="center">
  <a href="https://github.com/mikepenz/xray-action/actions">
		<img src="https://github.com/mikepenz/xray-action/workflows/CI/badge.svg"/>
	</a>
</div>
<br />

-------

## Setup

### Configure the workflow

Specify the action as part of your GitHub actions workflow:

```yml
- name: "Import files"
  uses: mikepenz/xray-action@{latest-release}
  with:
    username: "username to xray"
    password: "password to xray"
    testPaths: "glob retrieving junit xml files"
    testExecKey: ""
    projectKey: ""
    # testPlanKey: ""
    # testEnvironments: ""
    # revision: ""
    # fixVersion: ""
    # failOnImportError: ""
    # continueOnImportError: ""
```

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
