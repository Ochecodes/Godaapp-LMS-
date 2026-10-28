import * as migration_20261002_163811_instructor_cms_init from './20261002_163811_instructor_cms_init';
import * as migration_20261003_000000_add_lesson_quiz_questions from './20261003_000000_add_lesson_quiz_questions';
import * as migration_20261004_000000_add_course_live_classes from './20261004_000000_add_course_live_classes';

export const migrations = [
  {
    up: migration_20261002_163811_instructor_cms_init.up,
    down: migration_20261002_163811_instructor_cms_init.down,
    name: '20261002_163811_instructor_cms_init'
  },
  {
    up: migration_20261003_000000_add_lesson_quiz_questions.up,
    down: migration_20261003_000000_add_lesson_quiz_questions.down,
    name: '20261003_000000_add_lesson_quiz_questions'
  },
  {
    up: migration_20261004_000000_add_course_live_classes.up,
    down: migration_20261004_000000_add_course_live_classes.down,
    name: '20261004_000000_add_course_live_classes'
  },
];
