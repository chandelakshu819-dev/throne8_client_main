// Run: node --test tests/company-autocomplete.test.mjs
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const typescript = require('typescript');
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const out = mkdtempSync(path.join(os.tmpdir(), 'company-ac-'));

// Transpile pure TS utils to CommonJS in a temp dir (same approach as the other tests here).
for (const f of ['companyLogo', 'companyGrouping']) {
  const src = readFileSync(path.join(root, `src/features/mentorship/utils/${f}.ts`), 'utf8');
  const { outputText } = typescript.transpileModule(src, {
    compilerOptions: { module: typescript.ModuleKind.CommonJS, target: typescript.ScriptTarget.ES2020 },
  });
  writeFileSync(path.join(out, `${f}.js`), outputText);
}
const logo = require(path.join(out, 'companyLogo.js'));
const { groupMentorsByCompany } = require(path.join(out, 'companyGrouping.js'));

const API = 'https://api.example.com/api/v1';

test('resolveLogoSrc prefers our stored https logo', () => {
  assert.equal(
    logo.resolveLogoSrc({ logoUrl: 'https://res.cloudinary.com/x/company-logos/a.png', logoPreviewPath: '/api/v1/mentorship/companies/logo-preview?domain=a.com' }, API),
    'https://res.cloudinary.com/x/company-logos/a.png'
  );
});

test('resolveLogoSrc resolves the preview proxy path against the API origin', () => {
  assert.equal(
    logo.resolveLogoSrc({ logoPreviewPath: '/api/v1/mentorship/companies/logo-preview?domain=google.com' }, API),
    'https://api.example.com/api/v1/mentorship/companies/logo-preview?domain=google.com'
  );
});

test('resolveLogoSrc ignores unsafe / unknown URLs', () => {
  assert.equal(logo.resolveLogoSrc({ logoUrl: 'javascript:alert(1)' }, API), undefined);
  assert.equal(logo.resolveLogoSrc({ logoUrl: 'http://insecure.com/a.png' }, API), undefined);
  assert.equal(logo.resolveLogoSrc({ logoPreviewPath: 'https://evil.com/x' }, API), undefined);
  assert.equal(logo.resolveLogoSrc({ logoPreviewPath: '/api/v1/x' }, 'not a url'), undefined);
  assert.equal(logo.resolveLogoSrc(null, API), undefined);
});

test('letter fallback helpers', () => {
  assert.equal(logo.companyInitial('  akssai ProjExel'), 'A');
  assert.equal(logo.companyInitial(''), '?');
  assert.equal(logo.companyColor('Redient'), logo.companyColor('Redient'));
  assert.match(logo.companyColor('x'), /^#[0-9A-F]{6}$/i);
});

test('groupMentorsByCompany groups by companyRef id and counts', () => {
  const ref = { id: 'c1', name: 'Throne 8', logoUrl: 'https://res.cloudinary.com/x/t8.png' };
  const g = groupMentorsByCompany([{ ref }, { ref }, { ref: { id: 'c2', name: 'Infosys' } }]);
  assert.deepEqual(g.map((x) => [x.name, x.count]), [['Throne 8', 2], ['Infosys', 1]]);
  assert.equal(g[0].logoUrl, 'https://res.cloudinary.com/x/t8.png');
});

test('name-only mentors merge into the ref group with the same normalized name', () => {
  const ref = { id: 'c1', name: 'Throne 8' };
  const g = groupMentorsByCompany([{ ref }, { legacyName: 'throne8' }, { legacyName: 'THRONE 8' }, { legacyName: 'Akssai ProjExel' }]);
  assert.equal(g.length, 2);
  assert.deepEqual([g[0].name, g[0].count], ['Throne 8', 3]);
  assert.deepEqual([g[1].name, g[1].count], ['Akssai ProjExel', 1]);
});

test('invalid / empty legacy names are skipped; non-https stored logos dropped', () => {
  const g = groupMentorsByCompany(
    [{ legacyName: 'N/A' }, { legacyName: '' }, { ref: { id: 'c9', name: 'Acme', logoUrl: 'http://x.com/a.png' } }],
    new Set(['na', ''])
  );
  assert.equal(g.length, 1);
  assert.equal(g[0].logoUrl, undefined);
});
