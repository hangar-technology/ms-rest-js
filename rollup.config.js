import nodeResolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import json from 'rollup-plugin-json';
import { uglify } from 'rollup-plugin-uglify';

/**
 * @type {import('rollup').RollupDirOptions[]}
 */
const config = [
  // node.js build
  {
    input: 'es/lib/msRest.js',
    output: {
      file: 'dist/index.js',
      format: 'cjs',
      sourcemap: true
    },
    external: [
      "tslib",
      "os",
      "uuid/v4",
      "axios",
      "stream",
      "form-data",
      "tough-cookie",
      "xml2js"
    ],
    plugins: [
      nodeResolve({
        only: [], // list of modules which should be embedded instead of being referenced using require()
        module: true
      }),
      commonjs(),
      json(),
      uglify()
    ]
  },
  // browser <script> tag build
  {
    input: 'es/lib/msRest.js',
    output: {
      file: 'dist/index.browser.js',
      format: 'iife',
      name: 'Microsoft.Azure.MsRest',
      sourcemap: true
    },
    resolveExternal: null,
    external: [
      "tslib",
      "uuid/v4"
    ],
    plugins: [
      nodeResolve({
        only: ['tslib', 'uuid/v4'], // list of modules which should be embedded instead of being referenced using require()
        browser: true,
        module: true,
        main: false
      })
    ]
  }
];

export default config;