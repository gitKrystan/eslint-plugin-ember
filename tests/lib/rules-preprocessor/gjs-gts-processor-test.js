'use strict';

/**
 * Because this test needs the preprocessor, we can't use the normal
 * RuleTester api doesn't support preprocessors.
 *
 * @typedef {import('eslint/lib/cli-engine/cli-engine').CLIEngineOptions} CLIEngineOptions
 */

const { ESLint } = require('eslint');
const plugin = require('../../../lib');
const outdent = require('outdent');
// const prettierPluginEmberTemplateTag = require('prettier-plugin-ember-template-tag');
const eslintPluginPrettier = require('eslint-plugin-prettier');

/**
 * Helper function which creates ESLint instance with enabled/disabled autofix feature.
 *
 * @param {CLIEngineOptions} [options={}] Whether to enable autofix feature.
 * @returns {ESLint} ESLint instance to execute in tests.
 */
function initESLint(options) {
  // tests must be run with ESLint 7+
  return new ESLint({
    ignore: false,
    useEslintrc: false,
    plugins: { ember: plugin },
    overrideConfig: {
      root: true,
      env: {
        browser: true,
      },
      parser: '@babel/eslint-parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      plugins: ['ember'],
      extends: ['plugin:ember/recommended'],
      rules: {
        'no-undef': 'error',
      },
    },
    ...options,
  });
}

describe('template-vars', () => {
  const valid = [
    {
      filename: 'my-component.js',
      code: outdent`
        import Component from '@glimmer/component';

        export default class MyComponent extends Component {
          constructor() {
            super(...arguments);
          }
        }
      `,
    },
    {
      filename: 'my-component.gjs',
      code: outdent`
        import { on } from '@ember/modifier';

        const noop = () => {};

        <template>
          <div {{on 'click' noop}} />
        </template>
      `,
    },
    {
      filename: 'my-component.gjs',
      code: outdent`
        import { on } from '@ember/modifier';

        const noop = () => {};

        export default <template>
          <div {{on 'click' noop}} />
        </template>
      `,
    },
    {
      filename: 'my-component.gjs',
      code: outdent`
        const Foo = <template>
          hi
        </template>;

        <template>
          <Foo />
        </template>
      `,
    },
  ];

  const invalid = [
    {
      filename: 'my-component.gjs',
      code: outdent`
        const noop = () => {};

        <template>
          {{on 'click' noop}}
        </template>
      `,
      errors: [
        {
          message: "'on' is not defined.",
          line: 4,
          column: 5,
        },
      ],
    },
    {
      filename: 'my-component.gjs',
      code: outdent`
        <template>
          {{noop}}
        </template>
      `,
      errors: [
        {
          message: "'noop' is not defined.",
          line: 2,
          column: 5,
        },
      ],
    },
    {
      filename: 'my-component.gjs',
      code: outdent`
        <template>
          <Foo />
        </template>
      `,
      errors: [
        {
          message: "'Foo' is not defined.",
          line: 2,
          column: 4,
        },
      ],
    },
  ];

  describe('valid', () => {
    for (const scenario of valid) {
      const { code, filename } = scenario;

      // eslint-disable-next-line jest/valid-title
      it(code, async () => {
        const eslint = initESLint();
        const results = await eslint.lintText(code, { filePath: filename });
        const resultErrors = results.flatMap((result) => result.messages);

        // This gives more meaningful information than
        // checking if results is empty / length === 0
        let message = '';

        if (results && results[0]) {
          message = results[0]?.messages[0]?.message || '';
        }

        expect(message).toBe('');
        expect(resultErrors).toHaveLength(0);
      });
    }
  });

  describe('invalid', () => {
    for (const scenario of invalid) {
      const { code, filename, errors } = scenario;

      // eslint-disable-next-line jest/valid-title
      it(code, async () => {
        const eslint = initESLint();
        const results = await eslint.lintText(code, { filePath: filename });

        const resultErrors = results.flatMap((result) => result.messages);
        expect(resultErrors).toHaveLength(errors.length);

        for (const [index, error] of resultErrors.entries()) {
          const expected = errors[index];

          for (const key of Object.keys(expected)) {
            // Prefix with what key we are looking at so
            // that debugging is less painful
            const expectedString = `${key}: ${expected[key]}`;
            const actualString = `${key}: ${error[key]}`;

            expect(actualString).toStrictEqual(expectedString);
          }
        }
      });
    }
  });
});

// FIXME: Merge with above
/**
 * Helper function which creates ESLint instance with enabled/disabled autofix feature.
 *
 * @param {CLIEngineOptions} [options={}] Whether to enable autofix feature.
 * @returns {ESLint} ESLint instance to execute in tests.
 */
function initESLintWithPrettier(options) {
  // tests must be run with ESLint 7+
  return new ESLint({
    ignore: false,
    useEslintrc: false,
    plugins: { ember: plugin, prettier: eslintPluginPrettier },
    overrideConfig: {
      root: true,
      env: {
        browser: true,
      },
      parser: '@babel/eslint-parser',
      parserOptions: {
        ecmaVersion: 2020,
        sourceType: 'module',
      },
      plugins: ['ember', 'prettier'],
      extends: ['plugin:ember/recommended', 'plugin:prettier/recommended'],
      // rules: {
      //   'prettier/prettier': [
      //     'error',
      //     {
      //       plugins: [prettierPluginEmberTemplateTag],
      //     },
      //     { usePrettierrc: false },
      //   ],
      // },
    },
    ...options,
  });
}

describe('prettier', () => {
  const valid = [
    {
      filename: 'my-component.gjs',
      code: outdent`
        <template><h1>Hello World</h1></template>

      `,
    },
    {
      filename: 'my-component.gjs',
      code: outdent`
        const Foo = <template><h1>Hello World</h1></template>;

        <template><Foo /></template>

      `,
    },
    {
      filename: 'my-component.gjs',
      code: outdent`
        import Component from '@glimmer/component';

        export default class MyComponent {
          <template><h1>Hello World</h1></template>
        }

      `,
    },
  ];

  const invalid = [
    {
      filename: 'my-component.gjs',
      code: outdent`
        export default <template>   <h1>  Hello World</h1>  </template>
      `,
      errors: [
        {
          message:
            'Replace `export·default·[__GLIMMER_TEMPLATE(`···<h1>··Hello·World</h1>··`,·{·strictMode:·true·})]` with `[__GLIMMER_TEMPLATE(`<h1>·Hello·World</h1>`,·{·strictMode:·true·})]⏎`',
          line: 0,
          column: 11,
        },
      ],
    },
    {
      filename: 'my-component.gjs',
      code: outdent`
        const Foo = <template>   <h1>  Hello World</h1>  </template>

        <template>
          <Foo />
        </template>
      `,
      errors: [
        {
          message: 'Replace `···<h1>··Hello·World</h1>··` with `<h1>·Hello·World</h1>`];`',
          line: 1,
          endLine: 1,
          column: 22,
          endColumn: 49,
          ruleId: 'prettier/prettier',
        },
        {
          message: 'Replace `⏎··<Foo·/>⏎`` with `<Foo·/>`⏎`',
          line: 3,
          endLine: 5,
          column: 10,
          endColumn: 0,
          ruleId: 'prettier/prettier',
        },
      ],
    },
    {
      filename: 'my-component.gjs',
      code: outdent`
        import Component from '@glimmer/component';

        export default class MyComponent {
          <template>   <h1>  Hello World</h1>  </template>
        }

      `,
      errors: [
        {
          message: 'Replace `···<h1>··Hello·World</h1>··` with `<h1>·Hello·World</h1>`',
          line: 4,
          endLine: 4,
          column: 12,
          endColumn: 39,
          ruleId: 'prettier/prettier',
        },
      ],
    },
    {
      filename: 'my-component.gjs',
      // eslint-disable-next-line unicorn/template-indent
      code: outdent`
          <template>   <h1>  Hello World</h1>  </template>
      `,
      errors: [
        {
          message:
            'Replace `··<template>···<h1>··Hello·World</h1>··</template>` with `<template><h1>·Hello·World</h1></template>`',
          line: 1,
          endLine: 1,
          column: 2,
          endColumn: 50,
          ruleId: 'prettier/prettier',
        },
      ],
    },
  ];

  describe('valid', () => {
    for (const scenario of valid) {
      const { code, filename } = scenario;

      // eslint-disable-next-line jest/valid-title
      it(code, async () => {
        const eslint = initESLintWithPrettier();
        const results = await eslint.lintText(code, { filePath: filename });
        const resultErrors = results.flatMap((result) => result.messages);

        // This gives more meaningful information than
        // checking if results is empty / length === 0
        let message = '';

        if (results && results[0]) {
          message = results[0]?.messages[0]?.message || '';
        }

        expect(message).toBe('');
        expect(resultErrors).toHaveLength(0);
      });
    }
  });

  describe('invalid', () => {
    for (const scenario of invalid) {
      const { code, filename, errors } = scenario;

      // eslint-disable-next-line jest/valid-title
      it(code, async () => {
        const eslint = initESLintWithPrettier();
        const results = await eslint.lintText(code, { filePath: filename });

        const resultErrors = results.flatMap((result) => result.messages);
        expect(resultErrors).toHaveLength(errors.length);

        for (const [index, error] of resultErrors.entries()) {
          const expected = errors[index];

          for (const key of Object.keys(expected)) {
            // Prefix with what key we are looking at so
            // that debugging is less painful
            const expectedString = `${key}: ${expected[key]}`;
            const actualString = `${key}: ${error[key]}`;

            expect(actualString).toStrictEqual(expectedString);
          }
        }
      });
    }
  });
});
