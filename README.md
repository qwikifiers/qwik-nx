<p align="center">
  <br/>
  <img width="400" src="./assets/qwik-nx.png" alt="qwik loves nx ">
  <br/>
  <br/>
</p>

<h1 align='center'>Qwik Nx Plugin</h1>

<div align='center'>
  The <a href='https://nx.dev/'>nx</a> plugin for <a href='https://qwik.builder.io/'>Qwik</a>
  <br><br>

  <a href='https://img.shields.io/npm/v/qwik-nx?label=npm%20version'>
  <img src='https://img.shields.io/npm/v/qwik-nx?label=npm%20version' alt='qwik-nx npm'>
  </a>
  <a href='https://opensource.org/licenses/MIT'>
  <img src='https://img.shields.io/badge/License-MIT-green.svg' alt='MIT'>
  </a>
  <a href='#contributors'>
  <img src='https://img.shields.io/badge/all_contributors-3-green.svg?style=flat-square' alt='All Contributors'>
  </a>

</div>

## install

```
npm install -D qwik-nx
```

## Usage

### Generating a workspace

```
npx create-qwik-nx@latest
```

or

```
npx create-nx-workspace@latest org-workspace --preset=qwik-nx
```

### Generating an application

```
nx generate qwik-nx:app
```

### Generating an library

```
nx generate qwik-nx:lib
```

### Generating a component

```
nx generate qwik-nx:component
```

### Generating a route

```
nx generate qwik-nx:route
```

### Setting up Tailwind CSS

```
nx generate qwik-nx:setup-tailwind
```

### Setting up Deno integration

```
nx generate qwik-nx:deno-integration
```

## Migrations

This plugin supports Nx migrations and provides necessary version and code updates for Qwik. So instead of bumping plugin version manually in package.json it's recommended to run `nx migrate qwik-nx` command, that includes bumping the version of the qwik-nx plugin, related dependencies and running code migrations.

## qwik-nx & Nx Compatibility Chart

| qwik-nx version    | Nx version |
| ------------------ | ---------- |
| ^1.0.0             | ^16.0.0    |
| ^0.16.0            | ^16.0.0    |
| >= 0.12.0 < 0.16.0 | ^15.8.0    |
| ~0.10.0, ~0.11.0   | ~15.7.2    |
| >= 0.6.0 < 0.10.0  | ~15.6.0    |
| ~0.5.0             | ~15.5.0    |
| ~0.4.0             | ~15.4.0    |
| <=0.4.0            | ^15.0.0    |

We will provide support for Nx 15 with critical bug fixes and minor features for a while. If you're using nx@15.8 or higher, you can stick to qwik-nx@0.15.

## ROADMAP:

- [ ] Complete `add-nx-to-qwik`
- [ ] Write missing tests
- [ ] implement more package.json scripts to project.json targets
- [ ] more...

## Contributing

Want to contribute? Yayy! 🎉

Please read and follow our [Contributing Guidelines](CONTRIBUTING.md) to learn what are the right steps to take before contributing your time, effort and code.

Thanks 🙏

<br/>

## Code Of Conduct

Be kind to each other and please read our [code of conduct](CODE_OF_CONDUCT.md).

<br/>

## Contributors

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tbody>
    <tr>
      <td align="center" valign="top" width="14.28%"><a href="https://hirez.io/?utm_source=github&utm_medium=link&utm_campaign=qwik-nx"><img src="https://avatars1.githubusercontent.com/u/1430726?v=4?s=100" width="100px;" alt="Shai Reznik"/><br /><sub><b>Shai Reznik</b></sub></a><br /><a href="https://github.com/qwikifiers/qwik-nx/commits?author=shairez" title="Code">💻</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=shairez" title="Tests">⚠️</a> <a href="#infra-shairez" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=shairez" title="Documentation">📖</a> <a href="#maintenance-shairez" title="Maintenance">🚧</a> <a href="https://github.com/qwikifiers/qwik-nx/pulls?q=is%3Apr+reviewed-by%3Ashairez" title="Reviewed Pull Requests">👀</a> <a href="#ideas-shairez" title="Ideas, Planning, & Feedback">🤔</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/dmitry-stepanenko"><img src="https://avatars.githubusercontent.com/u/33101123?v=4?s=100" width="100px;" alt="Dmitriy Stepanenko"/><br /><sub><b>Dmitriy Stepanenko</b></sub></a><br /><a href="https://github.com/qwikifiers/qwik-nx/commits?author=dmitry-stepanenko" title="Code">💻</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=dmitry-stepanenko" title="Tests">⚠️</a> <a href="https://github.com/qwikifiers/qwik-nx/issues?q=author%3Admitry-stepanenko" title="Bug reports">🐛</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=dmitry-stepanenko" title="Documentation">📖</a> <a href="#ideas-dmitry-stepanenko" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-dmitry-stepanenko" title="Maintenance">🚧</a> <a href="#projectManagement-dmitry-stepanenko" title="Project Management">📆</a> <a href="https://github.com/qwikifiers/qwik-nx/pulls?q=is%3Apr+reviewed-by%3Admitry-stepanenko" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/reemardelarosa"><img src="https://avatars.githubusercontent.com/u/4918140?v=4?s=100" width="100px;" alt="John Reemar Dela Rosa"/><br /><sub><b>John Reemar Dela Rosa</b></sub></a><br /><a href="https://github.com/qwikifiers/qwik-nx/commits?author=reemardelarosa" title="Code">💻</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=reemardelarosa" title="Tests">⚠️</a> <a href="https://github.com/qwikifiers/qwik-nx/issues?q=author%3Areemardelarosa" title="Bug reports">🐛</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=reemardelarosa" title="Documentation">📖</a> <a href="#ideas-reemardelarosa" title="Ideas, Planning, & Feedback">🤔</a> <a href="#maintenance-reemardelarosa" title="Maintenance">🚧</a> <a href="https://github.com/qwikifiers/qwik-nx/pulls?q=is%3Apr+reviewed-by%3Areemardelarosa" title="Reviewed Pull Requests">👀</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/n8sabes"><img src="https://avatars.githubusercontent.com/u/10445528?v=4?s=100" width="100px;" alt="nait sabes &#124; sebastian®"/><br /><sub><b>nait sabes &#124; sebastian®</b></sub></a><br /><a href="https://github.com/qwikifiers/qwik-nx/commits?author=n8sabes" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://sebastiandg.com"><img src="https://avatars.githubusercontent.com/u/13395979?v=4?s=100" width="100px;" alt="Sebastian Duque Gutierrez"/><br /><sub><b>Sebastian Duque Gutierrez</b></sub></a><br /><a href="https://github.com/qwikifiers/qwik-nx/commits?author=sebastiandg7" title="Code">💻</a> <a href="#ideas-sebastiandg7" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=sebastiandg7" title="Tests">⚠️</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/NachoVazquez"><img src="https://avatars.githubusercontent.com/u/9338604?v=4?s=100" width="100px;" alt="Nacho Vazquez"/><br /><sub><b>Nacho Vazquez</b></sub></a><br /><a href="https://github.com/qwikifiers/qwik-nx/commits?author=NachoVazquez" title="Code">💻</a> <a href="#ideas-NachoVazquez" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=NachoVazquez" title="Tests">⚠️</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=NachoVazquez" title="Documentation">📖</a></td>
      <td align="center" valign="top" width="14.28%"><a href="https://github.com/faileon"><img src="https://avatars.githubusercontent.com/u/9354213?v=4?s=100" width="100px;" alt="Tomas Ptacek"/><br /><sub><b>Tomas Ptacek</b></sub></a><br /><a href="https://github.com/qwikifiers/qwik-nx/commits?author=faileon" title="Code">💻</a> <a href="#ideas-faileon" title="Ideas, Planning, & Feedback">🤔</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=faileon" title="Tests">⚠️</a> <a href="https://github.com/qwikifiers/qwik-nx/commits?author=faileon" title="Documentation">📖</a></td>
    </tr>
  </tbody>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!

<br/>

## Related Links

- [qwik-nx Discord](https://discord.gg/g6CYVAcDxf)
- [Qwik Docs](https://qwik.builder.io/)
- [nx](https://nx.dev/)
- [Qwik Discord](https://qwik.builder.io/chat)
- [Qwik GitHub](https://github.com/BuilderIO/qwik)
- [@QwikDev](https://twitter.com/QwikDev)

## License

MIT
