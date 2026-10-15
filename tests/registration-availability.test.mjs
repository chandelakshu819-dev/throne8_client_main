import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const require = createRequire(import.meta.url);
const typescript = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(
  path.join(root, 'src/features/auth/hooks/registrationAvailability.ts'),
  'utf8'
);
const { outputText } = typescript.transpileModule(source, {
  compilerOptions: {
    module: typescript.ModuleKind.CommonJS,
    target: typescript.ScriptTarget.ES2020,
  },
});
const loadedModule = { exports: {} };
vm.runInNewContext(
  `(function (module, exports) { ${outputText}\n})(loadedModule, loadedModule.exports);`,
  {
    loadedModule,
    AbortController,
    setTimeout,
    clearTimeout,
  }
);
const { RegistrationAvailability, canContinueAfterAvailabilityCheck } = loadedModule.exports;

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const deferred = () => {
  let resolve;
  let reject;
  const promise = new Promise((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};

test('taken values are reported for both registration fields', async () => {
  for (const field of ['email', 'phone']) {
    const availability = new RegistrationAvailability(async () => false, 5, 100);
    availability.setValue(`synthetic-${field}`);
    assert.equal(await availability.checkNow(), 'taken');
    assert.equal(availability.getSnapshot().status, 'taken');
    availability.dispose();
  }
});

test('available values produce an available status', async () => {
  const availability = new RegistrationAvailability(async () => true, 5, 100);
  availability.setValue('synthetic-available');
  assert.equal(await availability.checkNow(), 'available');
  assert.equal(availability.getSnapshot().status, 'available');
  availability.dispose();
});

test('stale responses do not replace the current value status', async () => {
  const requests = [];
  const availability = new RegistrationAvailability((value) => {
    const request = deferred();
    requests.push({ value, ...request });
    return request.promise;
  }, 5, 100);

  availability.setValue('synthetic-old');
  const oldCheck = availability.checkNow();
  await wait(0);
  availability.setValue('synthetic-current');
  const currentCheck = availability.checkNow();
  await wait(0);
  requests[0].resolve(false);
  await oldCheck;
  assert.equal(availability.getSnapshot().value, 'synthetic-current');
  assert.equal(availability.getSnapshot().status, 'checking');
  requests[1].resolve(true);
  assert.equal(await currentCheck, 'available');
  assert.equal(availability.getSnapshot().status, 'available');
  availability.dispose();
});

test('request failures and rate limits fail open without blocking Next', async () => {
  for (const failure of [new Error('network'), Object.assign(new Error('limited'), { status: 429 })]) {
    const availability = new RegistrationAvailability(async () => {
      throw failure;
    }, 5, 100);
    availability.setValue('synthetic-failure');
    const check = () => availability.checkNow();
    assert.equal(await check(), null);
    assert.equal(await canContinueAfterAvailabilityCheck(check), true);
    assert.equal(availability.getSnapshot().status, null);
    availability.dispose();
  }
});

test('a check timeout fails open', async () => {
  const availability = new RegistrationAvailability(() => new Promise(() => {}), 5, 10);
  availability.setValue('synthetic-timeout');
  assert.equal(await availability.checkNow(), null);
  assert.equal(await canContinueAfterAvailabilityCheck(() => availability.checkNow()), true);
  availability.dispose();
});

test('Next waits for a check, blocks known duplicates, then allows a changed available value', async () => {
  const answers = [false, true];
  const availability = new RegistrationAvailability(async () => answers.shift() ?? true, 5, 100);

  availability.setValue('synthetic-taken');
  assert.equal(
    await canContinueAfterAvailabilityCheck(() => availability.checkNow()),
    false
  );

  availability.setValue('synthetic-available-after-edit');
  assert.equal(
    await canContinueAfterAvailabilityCheck(() => availability.checkNow()),
    true
  );
  availability.dispose();
});

test('digit-by-digit phone input checks only once when normalization succeeds', async () => {
  let requestCount = 0;
  const availability = new RegistrationAvailability(async () => {
    requestCount += 1;
    return true;
  }, 5, 100);

  for (let digitCount = 1; digitCount < 10; digitCount += 1) {
    availability.setValue(undefined);
  }
  availability.setValue('synthetic-canonical-phone');
  await wait(15);
  assert.equal(availability.getSnapshot().status, 'available');
  assert.equal(await availability.checkNow(), 'available');
  assert.equal(requestCount, 1);
  availability.dispose();
});
