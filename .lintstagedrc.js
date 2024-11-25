module.exports = {
  // Type check TypeScript files
  'src/**/*.(ts|tsx)': () => [
    `npm run prettier`,
    'npm run check-ts',
    `npm run lint`,
    // `npm run test`
  ],
};