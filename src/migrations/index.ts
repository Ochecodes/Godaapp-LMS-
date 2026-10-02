import * as migration_20261002_163811_instructor_cms_init from './20261002_163811_instructor_cms_init';

export const migrations = [
  {
    up: migration_20261002_163811_instructor_cms_init.up,
    down: migration_20261002_163811_instructor_cms_init.down,
    name: '20261002_163811_instructor_cms_init'
  },
];
