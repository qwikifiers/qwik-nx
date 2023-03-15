# Contribution Guidelines

We would love for you to contribute to this project.
As a contributor, here are the guidelines we would like you to follow:

## Be Kind - Code of Conduct

Please read and follow our [Code of Conduct](CODE_OF_CONDUCT.md) to help us keep this project open and inclusive.

<br/>

## Found a bug? Want a feature? - Submit an Issue

[Choose an issue template](https://github.com/qwikifiers/qwik-nx/issues/new/choose) to file a bug report / feature request.

<br/>

## Ready to contribute a Pull Request (PR)?

<br/>

### ▶ 1. First - [Search this repo for existing PRs](https://github.com/qwikifiers/qwik-nx/pulls) !

Try to find an open or closed PR that relates to the change you want to introduce.

<br/>

### ▶ 2. **Before you start coding - [find](https://github.com/qwikifiers/qwik-nx/issues) / [create an issue](https://github.com/qwikifiers/qwik-nx/issues/new/choose)**

**Make sure there's an issue** describing the problem you're fixing, or documents the design for the feature you'd like to add.
Discussing the design up front helps to ensure that we're ready to accept your work.

**Don't waste your time working on code before you got a 👍 in an issue comment.**

<br/>

### ▶ 3. Fork the this repo and create a branch.

- Hit that "Fork" button above (in this repo's github page).

![image](https://user-images.githubusercontent.com/1430726/95460679-ec014400-097d-11eb-9a7a-93e0262d37d9.png)

- git clone your fork

`git clone YOUR_FORK_URL`

Get your url by from here 👇

![image](https://user-images.githubusercontent.com/1430726/95461173-94afa380-097e-11eb-9568-dc986e050de6.png)

- Create a new branch locally in your fork's repo

```shell
git checkout -b my-fix-branch master
```

<br/>

### ▶ 4. Make sure you add / modify tests

Run `pnpm run test` to make sure there aren't any errors

<br/>

### ▶ 5. Commit your changes using commitizen:

Instead of `git commit` use the following command:

```shell
pnpm run commit
```

It will then ask you a bunch of questions.

This will create a descriptive commit message that follows the
[Angular commit message convention](#commit-message-format).

This is necessary to generate meaningful release notes / CHANGELOG automatically.

<br/>

### ▶ 6. Push your branch to GitHub:

```shell
git push origin my-fix-branch
```

### ▶ 7. Create a PR

In GitHub, create a pull request for `qwikifiers/qwik-nx:master`.

Make sure you check the following checkbox "Allow edits from maintainers" -

![image](https://user-images.githubusercontent.com/1430726/95461503-fbcd5800-097e-11eb-9b55-321d1ff0e6bb.png)

If you need to update your PR for some reason -

- Make the required updates.

- Re-run the tests to ensure tests are still passing `npm run test`

- Rebase your branch and force push to your GitHub repository (this will update your Pull Request):

  ```shell
  git rebase master -i
  git push -f
  ```

<br/>

### ▶ 8. After your PR is merged - delete your branches

After your pull request is merged, you can safely delete your branch and pull the changes from the main (upstream) repository:

- Delete the remote branch on GitHub either through the GitHub web UI or your local shell as follows:

  ```shell
  git push origin --delete my-fix-branch
  ```

- Check out the master branch:

  ```shell
  git checkout master -f
  ```

- Delete the local branch:

  ```shell
  git branch -D my-fix-branch
  ```

- Update your master with the latest upstream version:

  ```shell
  git pull --ff upstream master
  ```

<br/>

## ▶ 9. Publishing to a local registry

To test if your changes will actually work once the changes are published,
it can be useful to publish to a local registry.

- Run `pnpm run local-registry start` in Terminal 1 (keep it running)
- Run `npm adduser --registry http://localhost:4873` in Terminal 2 (real credentials are not required, you just need to
  be logged in. You can use test/test/test@test.io.)
- Run `pnpm run local-registry enable` in Terminal 2
- Run `pnpm exec nx run qwik-nx:publish:local` in Terminal 2. You can set the version you want to publish in the package's package.json file.

If you have problems publishing, make sure you use Node 18 and NPM 8. Alternatively to running the project's "publish" target you can build and publish manually by running `pnpm exec nx build:qwik-nx && cd dist/projects/qwik-nx && npm publish --registry=http://localhost:4873`

**NOTE:** After you finish with local testing don't forget to stop the local registry (e.g. closing the Terminal 1) and disabling the local registry using `pnpm run local-registry disable`. Keeping local registry enabled will change your lock file resolutions to `localhost:4873` on the next `pnpm install`. You can also run `pnpm run local-registry clear` to clean all packages in that local registry.

**NOTE:** To use this newly published local version, you need to make a new workspace or change your target package to this new version, eg: `"qwik-nx": "^1.0.0",` and re-run `pnpm install` in your testing project.

### ▶ 10. That's it! Thank you for your contribution! 🙏💓

[commit-message-format]: https://docs.google.com/document/d/1QrDFcIiPjSLDn3EL15IJygNPiHORgU1_OOAqWjiDU5Y/edit#
