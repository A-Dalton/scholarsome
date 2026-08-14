-- CreateTable
CREATE TABLE `CardMistake` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `cardId` VARCHAR(191) NOT NULL,
    `setId` VARCHAR(191) NOT NULL,
    `term` TEXT NOT NULL,
    `definition` TEXT NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `CardMistake_userId_idx`(`userId`),
    INDEX `CardMistake_cardId_idx`(`cardId`),
    INDEX `CardMistake_setId_idx`(`setId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `CardMistake` ADD CONSTRAINT `CardMistake_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardMistake` ADD CONSTRAINT `CardMistake_cardId_fkey` FOREIGN KEY (`cardId`) REFERENCES `Card`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CardMistake` ADD CONSTRAINT `CardMistake_setId_fkey` FOREIGN KEY (`setId`) REFERENCES `Set`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
