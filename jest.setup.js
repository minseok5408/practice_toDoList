const mockAsyncStorage = require('@react-native-async-storage/async-storage/jest/async-storage-mock');

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('@sentry/react-native', () => ({
  captureException: jest.fn(),
  init: jest.fn(),
  wrap: (component) => component,
}));

jest.mock('@react-native-vector-icons/lucide', () => {
  const React = require('react');
  const { Text } = require('react-native');

  return {
    Lucide: ({ name }) => React.createElement(Text, null, name),
  };
});
