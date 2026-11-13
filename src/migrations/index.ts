import * as migration_20261002_163811_instructor_cms_init from './20261002_163811_instructor_cms_init';
import * as migration_20261003_000000_add_lesson_quiz_questions from './20261003_000000_add_lesson_quiz_questions';
import * as migration_20261004_000000_add_course_live_classes from './20261004_000000_add_course_live_classes';
import * as migration_20261029_000000_add_live_class_instructor_name from './20261029_000000_add_live_class_instructor_name';
import * as migration_20261029_010000_add_resources from './20261029_010000_add_resources';
import * as migration_20261030_000000_normalize_enrollment_emails from './20261030_000000_normalize_enrollment_emails';
import * as migration_20261101_000000_add_course_original_price from './20261101_000000_add_course_original_price';
import * as migration_20261108_000000_enable_payload_table_rls from './20261108_000000_enable_payload_table_rls';
import * as migration_20261111_000000_add_app_rate_limits from './20261111_000000_add_app_rate_limits';
import * as migration_20261118_000000_add_lesson_duration from './20261118_000000_add_lesson_duration';

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
  {
    up: migration_20261029_000000_add_live_class_instructor_name.up,
    down: migration_20261029_000000_add_live_class_instructor_name.down,
    name: '20261029_000000_add_live_class_instructor_name'
  },
  {
    up: migration_20261029_010000_add_resources.up,
    down: migration_20261029_010000_add_resources.down,
    name: '20261029_010000_add_resources'
  },
  {
    up: migration_20261030_000000_normalize_enrollment_emails.up,
    down: migration_20261030_000000_normalize_enrollment_emails.down,
    name: '20261030_000000_normalize_enrollment_emails'
  },
  {
    up: migration_20261101_000000_add_course_original_price.up,
    down: migration_20261101_000000_add_course_original_price.down,
    name: '20261101_000000_add_course_original_price'
  },
  {
    up: migration_20261108_000000_enable_payload_table_rls.up,
    down: migration_20261108_000000_enable_payload_table_rls.down,
    name: '20261108_000000_enable_payload_table_rls'
  },
  {
    up: migration_20261111_000000_add_app_rate_limits.up,
    down: migration_20261111_000000_add_app_rate_limits.down,
    name: '20261111_000000_add_app_rate_limits'
  },
  {
    up: migration_20261118_000000_add_lesson_duration.up,
    down: migration_20261118_000000_add_lesson_duration.down,
    name: '20261118_000000_add_lesson_duration'
  },
];
