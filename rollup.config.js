import fs from 'fs';
import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';
import pkg from './package.json';

const { name, version, repository } = pkg;
const base = {
  external: ['react'],
  input: 'src/index.ts',
};
const bundles = {
  esm: {
    file: `dist/${name}.esm.js`,
    minified: `dist/${name}.esm.min.js`,
    tsconfig: './tsconfig.esm.json',
  },
  umd: {
    file: `dist/${name}.umd.js`,
    minified: `dist/${name}.umd.min.js`,
    tsconfig: './tsconfig.umd.json',
    umdGlobals: {
      name,
      exports: 'named',
      globals: {
        react: 'React',
      },
    },
  },
};
const banner = `/*!
* ${name}
* ${repository?.url || ''}
*
* Version: ${version}
*
* Copyright KingSora | Rene Haas.
* https://github.com/KingSora
*
* Released under the MIT license.
* Date: ${new Date().toLocaleDateString('de-AT', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})}
*/`;

export default [
  // output types:
  {
    ...base,
    output: [
      {
        file: `dist/${name}.js`,
        sourcemap: false,
      },
    ],
    plugins: [
      typescript({ tsconfig: './tsconfig.json' }),
      {
        name: 'deleteJsBundle',
        writeBundle(options) {
          fs.unlinkSync(options.file);
        },
      },
    ],
  },
  // output bundles:
  ...Object.keys(bundles).reduce((config, format) => {
    const { file, minified, tsconfig, umdGlobals = {} } = bundles[format];
    config.push({
      ...base,
      output: {
        file,
        format,
        banner,
        sourcemap: true,
        ...umdGlobals,
      },
      plugins: [typescript({ tsconfig })],
    });
    if (minified) {
      config.push({
        ...base,
        input: file,
        context: 'this',
        output: [
          {
            format,
            file: minified,
            sourcemap: false,
            plugins: [
              terser({
                output: {
                  comments: false,
                },
              }),
            ],
          },
        ],
      });
    }
    return config;
  }, []),
];
