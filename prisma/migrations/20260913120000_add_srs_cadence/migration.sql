-- AlterTable
ALTER TABLE `User` ADD COLUMN `srsCadence` ENUM('FOUR_TIMES_A_DAY', 'TWO_TIMES_A_DAY', 'ONCE_PER_DAY', 'EVERY_TWO_DAYS', 'EVERY_FOUR_DAYS', 'ONCE_PER_WEEK') NOT NULL DEFAULT 'ONCE_PER_DAY';

-- ChangeDefaults: align the SRS parameter defaults with the ONCE_PER_DAY cadence preset
ALTER TABLE `User` MODIFY COLUMN `srsEnableShortTerm` BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE `User` MODIFY COLUMN `srsLearningSteps` JSON NOT NULL DEFAULT '["1d"]';
ALTER TABLE `User` MODIFY COLUMN `srsRelearningSteps` JSON NOT NULL DEFAULT '["1d"]';

-- DataMigration: existing users start on the default cadence, so their SRS parameters are updated to match its preset
UPDATE `User` SET `srsEnableShortTerm` = false, `srsLearningSteps` = JSON_ARRAY("1d"), `srsRelearningSteps` = JSON_ARRAY("1d");
