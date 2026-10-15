import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const typescript = require('typescript');

test('registration thunk keeps the backend errors for the signup banner', async () => {
  const sourcePath = path.join(root, 'src/hooks/auth/thunks/registerThunks.ts');
  const source = readFileSync(sourcePath, 'utf8');
  const { outputText } = typescript.transpileModule(source, {
    compilerOptions: {
      module: typescript.ModuleKind.CommonJS,
      target: typescript.ScriptTarget.ES2020,
      esModuleInterop: true,
    },
  });

  let mockedStatusCode = 400;
  const authService = {
    register: async () => {
      throw {
        message: 'Registration validation failed',
        statusCode: mockedStatusCode,
        errors: [
          'First synthetic validation detail',
          'Second synthetic validation detail',
          'Third synthetic validation detail',
          'Fourth synthetic validation detail',
        ],
      };
    },
  };
  const tokenStorage = { setAuthData: () => assert.fail('Failure must not store tokens') };
  const loadedModule = { exports: {} };
  const mockedRequire = (specifier) => {
    if (specifier === '@reduxjs/toolkit') return require('@reduxjs/toolkit');
    if (specifier === '@/lib/api/auth.service') return { __esModule: true, default: authService };
    if (specifier === '@/lib/store/token.storage') return { __esModule: true, default: tokenStorage };
    throw new Error(`Unexpected dependency: ${specifier}`);
  };
  vm.runInNewContext(
    `(function (require, module, exports) { ${outputText}\n})(mockedRequire, loadedModule, loadedModule.exports);`,
    { mockedRequire, loadedModule, assert }
  );

  const registrationData = {
    email: 'synthetic.user@example.com',
    password: 'Synthetic123!',
    confirmPassword: 'Synthetic123!',
    firstName: 'Taylor',
    lastName: '',
    phoneNumber: '+919876543210',
    location: 'Mumbai',
    userType: 'working',
  };
  const registerUser = loadedModule.exports.registerUser;

  const pageSource = readFileSync(path.join(root, 'src/app/(auth)/signup/page.tsx'), 'utf8');
  const helperStart = pageSource.indexOf('export function buildRegistrationFailureBanner(');
  const helperEnd = pageSource.indexOf('\nexport default function SignupPage', helperStart);
  assert.notEqual(helperStart, -1);
  assert.notEqual(helperEnd, -1);
  const helperSource = pageSource
    .slice(helperStart, helperEnd)
    .trimEnd()
    .replace('export function', 'function');
  const helperJs = typescript.transpileModule(helperSource, {
    compilerOptions: { target: typescript.ScriptTarget.ES2020 },
  }).outputText;
  const bannerContext = {};
  vm.runInNewContext(
    `${helperJs}\nglobalThis.buildBanner = buildRegistrationFailureBanner;`,
    bannerContext
  );

  for (const statusCode of [400, 409]) {
    mockedStatusCode = statusCode;
    const dispatched = [];
    const thunkResult = await registerUser(registrationData)(
      (action) => {
        dispatched.push(action);
        return action;
      },
      () => ({}),
      undefined
    );

    assert.equal(thunkResult.type, 'auth/register/rejected');
    assert.equal(thunkResult.payload.message, 'Registration validation failed');
    assert.equal(thunkResult.payload.statusCode, statusCode);
    assert.equal(thunkResult.payload.fieldErrors, undefined);
    assert.deepEqual([...thunkResult.payload.errors], [
      'First synthetic validation detail',
      'Second synthetic validation detail',
      'Third synthetic validation detail',
      'Fourth synthetic validation detail',
    ]);
    assert.equal(dispatched.at(-1), thunkResult);

    const banner = bannerContext.buildBanner(thunkResult.payload, registrationData);
    assert.match(banner, /First synthetic validation detail/);
    assert.match(banner, /Third synthetic validation detail/);
    assert.doesNotMatch(banner, /Fourth synthetic validation detail/);
  }
});
