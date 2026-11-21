-- ChangeDefaults: align the SRS parameter defaults with the ONCE_PER_DAY cadence preset
ALTER TABLE `User` MODIFY COLUMN `srsEnableShortTerm` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `User` MODIFY COLUMN `srsLearningSteps` JSON NOT NULL DEFAULT '["23h","1d"]';
ALTER TABLE `User` MODIFY COLUMN `srsRelearningSteps` JSON NOT NULL DEFAULT '["23h"]';

-- DataMigration: re-apply the preset of the cadence each user has selected, so that cards
-- rated "Don't know" enter the (re)learning states and the sparser cadences schedule their
-- reviews at their own interval
UPDATE `User` SET `srsEnableShortTerm` = true, `srsLearningSteps` = JSON_ARRAY("23h", "1d"), `srsRelearningSteps` = JSON_ARRAY("23h") WHERE `srsCadence` = 'ONCE_PER_DAY';
UPDATE `User` SET `srsEnableShortTerm` = true, `srsLearningSteps` = JSON_ARRAY("23h", "2d"), `srsRelearningSteps` = JSON_ARRAY("23h") WHERE `srsCadence` = 'EVERY_TWO_DAYS';
UPDATE `User` SET `srsEnableShortTerm` = true, `srsLearningSteps` = JSON_ARRAY("23h", "4d"), `srsRelearningSteps` = JSON_ARRAY("23h") WHERE `srsCadence` = 'EVERY_FOUR_DAYS';
UPDATE `User` SET `srsEnableShortTerm` = true, `srsLearningSteps` = JSON_ARRAY("23h", "7d"), `srsRelearningSteps` = JSON_ARRAY("23h") WHERE `srsCadence` = 'ONCE_PER_WEEK';
