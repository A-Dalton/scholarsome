-- ChangeDefaults: align the SRS retention and maximum interval defaults with the ONCE_PER_DAY preset
ALTER TABLE `User` MODIFY COLUMN `srsRequestRetention` FLOAT NOT NULL DEFAULT 0.96;
ALTER TABLE `User` MODIFY COLUMN `srsMaximumInterval` INT NOT NULL DEFAULT 60;

-- DataMigration: apply the once-per-day preset to users already on that cadence
UPDATE `User` SET `srsRequestRetention` = 0.96, `srsMaximumInterval` = 60 WHERE `srsCadence` = 'ONCE_PER_DAY';
