/**
 * Architectural dependency rules.
 * Domain does not import anything from Application, Infrastructure, Interface, or Kernel.
 * Application depends only on the domain and its own ports.
 * @type {import('dependency-cruiser').IConfiguration}
 */
module.exports = {
  forbidden: [
    {
      name: 'domain-is-isolated',
      comment: 'The domain does not depend on other layers.',
      severity: 'error',
      from: { path: '^src/Domain/' },
      to: { path: '^src/(Application|Infrastructure|Interface|Kernel)/' },
    },
    {
      name: 'domain-no-frameworks',
      comment: 'The domain remains independent of Express, Prisma, and DTO validation.',
      severity: 'error',
      from: { path: '^src/Domain/' },
      to: { path: 'node_modules/(express|@prisma|prisma|pg|zod)/' },
    },
    {
      name: 'application-depends-on-ports',
      comment: 'Application uses ports; adapters implement them.',
      severity: 'error',
      from: { path: '^src/Application/' },
      to: { path: '^src/(Infrastructure|Interface|Kernel)/' },
    },
    {
      name: 'application-no-http-or-orm',
      comment: 'Use cases are independent of Express and the Prisma client.',
      severity: 'error',
      from: { path: '^src/Application/' },
      to: { path: 'node_modules/(express|@prisma|prisma|pg)/' },
    },
    {
      name: 'support-is-leaf',
      comment: 'Support contains shared utilities and has no knowledge of application layers.',
      severity: 'error',
      from: { path: '^src/Support/' },
      to: { path: '^src/(Domain|Application|Infrastructure|Interface|Kernel)/' },
    },
    {
      name: 'no-circular',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'not-to-unresolvable',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: 'not-to-dev-dep',
      comment: 'Production code does not import development dependencies.',
      severity: 'error',
      from: { path: '^src/' },
      to: { dependencyTypes: ['npm-dev'], dependencyTypesNot: ['type-only'] },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.js'],
    },
  },
};
