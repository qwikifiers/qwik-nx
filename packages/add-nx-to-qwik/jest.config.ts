/* eslint-disable */
export default {
  displayName: 'add-nx-to-qwik',

  globals: {},
  transform: {
    '^.+\\.[tj]sx?$': [
      'ts-jest',
      {
        tsConfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/projects/add-nx-to-qwik',
  preset: '../../jest.preset.js',
};
