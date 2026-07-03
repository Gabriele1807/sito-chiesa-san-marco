import test from 'node:test';
import assert from 'node:assert/strict';
import { buildRegistrationSummary, filterAndSortRegistrations } from './registrations-utils.ts';

const registrations = [
  {
    _id: '1',
    nome: 'Marco',
    cognome: 'Rossi',
    padreNome: 'Paolo',
    padreCognome: 'Rossi',
    telefono: '3331112222',
    email: 'marco@example.com',
    ha_pagato: true,
    createdAt: '2024-03-01T10:00:00.000Z',
  },
  {
    _id: '2',
    nome: 'Luca',
    cognome: 'Bianchi',
    padreNome: 'Giuseppe',
    padreCognome: 'Bianchi',
    telefono: '3333334444',
    email: 'luca@example.com',
    ha_pagato: false,
    createdAt: '2024-01-10T08:00:00.000Z',
  },
  {
    _id: '3',
    nome: 'Anna',
    cognome: 'Verdi',
    padreNome: 'Mario',
    padreCognome: 'Verdi',
    telefono: '3335556666',
    email: 'anna@example.com',
    ha_pagato: false,
    createdAt: '2024-02-15T09:00:00.000Z',
  },
];

test('buildRegistrationSummary returns payment counts', () => {
  assert.deepEqual(buildRegistrationSummary(registrations), {
    totali: 3,
    pagati: 1,
    nonPagati: 2,
  });
});

test('filterAndSortRegistrations applies payment filter and sorting', () => {
  const result = filterAndSortRegistrations(registrations, {
    search: 'marco',
    activeFilters: new Set(['paid']),
    sortBy: 'nomeAsc',
  });

  assert.deepEqual(result.map((item) => item._id), ['1']);
});

test('filterAndSortRegistrations sorts by creation date descending by default', () => {
  const result = filterAndSortRegistrations(registrations, {
    search: '',
    activeFilters: new Set(),
    sortBy: 'createdAtDesc',
  });

  assert.deepEqual(result.map((item) => item._id), ['1', '3', '2']);
});

test('filterAndSortRegistrations combines payment and raccoglimento filters with AND', () => {
  const result = filterAndSortRegistrations(
    [
      { ...registrations[0], raccoglimento: 'chiesa' },
      { ...registrations[1], raccoglimento: 'chiesa' },
      { ...registrations[2], raccoglimento: 'luogo' },
    ],
    {
      search: '',
      activeFilters: new Set(['paid', 'chiesa']),
      sortBy: 'createdAtDesc',
    }
  );

  assert.deepEqual(result.map((item) => item._id), ['1']);
});
