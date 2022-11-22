/* eslint-disable */
export default {
  displayName: 'add-nx-to-qwik',

  globals: {
    'ts-jest': {
      tsConfig: '<rootDir>/tsconfig.spec.json',
    },
  },
  transform: {
    '^.+\\.[tj]sx?$': 'ts-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx'],
  coverageDirectory: '../../coverage/projects/add-nx-to-qwik',
  preset: '../../jest.preset.js',
};
