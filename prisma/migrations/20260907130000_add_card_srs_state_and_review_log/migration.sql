-- CreateTable
-- SRS state of a card (ts-fsrs `Card`) stored per user, as the same card can be studied by multiple users
CREATE TABLE `CardSrsState` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `due` DATETIME(3) NOT NULL,
    `stability` DOUBLE NOT NULL,
    `difficulty` DOUBLE NOT NULL,
    `elapsedDays` DOUBLE NOT NULL,
    `scheduledDays` INT NOT NULL,
    `learningSteps` INT NOT NULL,
    `reps` INT NOT NULL,
    `lapses` INT NOT NULL,
    `state` INT NOT NULL,
    `lastReview` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `CardSrsState_userId_cardId_key`(`userId`, `cardId`),
    INDEX `CardSrsState_userId_due_idx`(`userId`, `due`),
    INDEX `CardSrsState_cardId_idx`(`cardId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
-- History of every SRS review of a card (ts-fsrs `ReviewLog`) stored per user,
-- used for statistics and enabling rollback and reschedule
CREATE TABLE `CardSrsReviewLog` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `setId` VARCHAR(191) NOT NULL,
    `rating` INT NOT NULL,
    `state` INT NOT NULL,
    `due` DATETIME(3) NOT NULL,
    `stability` DOUBLE NOT NULL,
    `difficulty` DOUBLE NOT NULL,
    `elapsedDays` DOUBLE NOT NULL,
    `lastElapsedDays` DOUBLE NOT NULL,
    `scheduledDays` INT NOT NULL,
    `learningSteps` INT NOT NULL,
    `review` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CardSrsReviewLog_userId_idx`(`userId`),
    INDEX `CardSrsReviewLog_cardId_idx`(`cardId`),
    INDEX `CardSrsReviewLog_setId_idx`(`setId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CardSrsState` ADD CONSTRAINT `CardSrsState_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardSrsState` ADD CONSTRAINT `CardSrsState_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardSrsReviewLog` ADD CONSTRAINT `CardSrsReviewLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardSrsReviewLog` ADD CONSTRAINT `CardSrsReviewLog_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardSrsReviewLog` ADD CONSTRAINT `CardSrsReviewLog_setId_fkey` FOREIGN KEY (`setId`) REFERENCES `Set`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
