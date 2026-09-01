-- CreateTable
CREATE TABLE `admins` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pid` INTEGER NOT NULL DEFAULT 0,
    `pidTop` INTEGER NOT NULL DEFAULT 1,
    `username` VARCHAR(30) NOT NULL,
    `nickname` VARCHAR(50) NOT NULL,
    `password` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(255) NULL,
    `role` VARCHAR(191) NOT NULL DEFAULT 'agent',
    `viewId` INTEGER NOT NULL DEFAULT 4,
    `balance` DECIMAL(11, 2) NOT NULL DEFAULT 0,
    `kouliang` INTEGER NOT NULL DEFAULT 0,
    `ticheng` INTEGER NOT NULL DEFAULT 0,
    `minFee` INTEGER NOT NULL DEFAULT 0,
    `poundage` INTEGER NOT NULL DEFAULT 0,
    `dateFee` INTEGER NOT NULL DEFAULT 0,
    `weekFee` INTEGER NOT NULL DEFAULT 0,
    `monthFee` INTEGER NOT NULL DEFAULT 0,
    `bt` INTEGER NOT NULL DEFAULT 0,
    `by` INTEGER NOT NULL DEFAULT 0,
    `payModel` VARCHAR(191) NOT NULL DEFAULT '0',
    `payModel1` VARCHAR(191) NULL DEFAULT '0',
    `wxCheckApi` VARCHAR(191) NULL DEFAULT '',
    `mianfei` TEXT NULL,
    `txImg` VARCHAR(255) NULL,
    `short` VARCHAR(191) NOT NULL DEFAULT 'self',
    `status` VARCHAR(191) NOT NULL DEFAULT 'normal',
    `txPassword` VARCHAR(255) NOT NULL DEFAULT '',
    `loginIp` VARCHAR(50) NULL,
    `loginTime` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `admins_username_key`(`username`),
    INDEX `admins_pidTop_idx`(`pidTop`),
    INDEX `admins_pid_idx`(`pid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `admin_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL DEFAULT 0,
    `username` VARCHAR(30) NOT NULL,
    `url` VARCHAR(1500) NOT NULL,
    `title` VARCHAR(100) NOT NULL,
    `content` TEXT NOT NULL,
    `ip` VARCHAR(50) NOT NULL,
    `useragent` VARCHAR(255) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `admin_logs_username_idx`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `categories` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pid` INTEGER NOT NULL DEFAULT 0,
    `type` VARCHAR(30) NOT NULL DEFAULT '',
    `name` VARCHAR(30) NOT NULL,
    `nickname` VARCHAR(50) NOT NULL DEFAULT '',
    `image` VARCHAR(255) NOT NULL DEFAULT '',
    `keywords` VARCHAR(255) NOT NULL DEFAULT '',
    `description` VARCHAR(255) NOT NULL DEFAULT '',
    `diyname` VARCHAR(30) NOT NULL DEFAULT '',
    `weigh` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'normal',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `categories_type_status_weigh_idx`(`type`, `status`, `weigh`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stocks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cid` INTEGER NOT NULL DEFAULT 0,
    `uid` INTEGER NOT NULL DEFAULT 0,
    `img` TEXT NOT NULL,
    `title` VARCHAR(255) NOT NULL,
    `url` TEXT NOT NULL,
    `status` INTEGER NOT NULL DEFAULT 1,
    `sort` INTEGER NOT NULL DEFAULT 0,
    `inputTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateTime` DATETIME(3) NOT NULL,

    INDEX `stocks_cid_idx`(`cid`),
    INDEX `stocks_uid_idx`(`uid`),
    INDEX `stocks_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `stock_prices` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` INTEGER NOT NULL,
    `stockId` INTEGER NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL,

    UNIQUE INDEX `stock_prices_uid_stockId_key`(`uid`, `stockId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pay_orders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `transact` VARCHAR(64) NOT NULL,
    `uid` INTEGER NOT NULL,
    `pid` INTEGER NOT NULL DEFAULT 0,
    `pidTop` INTEGER NOT NULL DEFAULT 0,
    `vid` INTEGER NOT NULL DEFAULT 0,
    `user` VARCHAR(255) NOT NULL,
    `price` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `tcMoney` DECIMAL(11, 2) NOT NULL DEFAULT 0,
    `ip` VARCHAR(64) NOT NULL DEFAULT '0',
    `ua` VARCHAR(255) NULL,
    `isKouliang` INTEGER NOT NULL DEFAULT 1,
    `isDate` INTEGER NOT NULL DEFAULT 1,
    `isWeek` INTEGER NOT NULL DEFAULT 1,
    `isMonth` INTEGER NOT NULL DEFAULT 1,
    `payChannel` VARCHAR(255) NOT NULL DEFAULT '',
    `status` INTEGER NOT NULL DEFAULT 2,
    `des` VARCHAR(255) NULL,
    `payTime` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `pay_orders_transact_key`(`transact`),
    INDEX `pay_orders_uid_status_idx`(`uid`, `status`),
    INDEX `pay_orders_pidTop_status_idx`(`pidTop`, `status`),
    INDEX `pay_orders_isKouliang_createdAt_idx`(`isKouliang`, `createdAt`),
    INDEX `pay_orders_ip_idx`(`ip`),
    INDEX `pay_orders_ua_idx`(`ua`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `payed_shows` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ip` VARCHAR(64) NULL,
    `ua` VARCHAR(64) NULL,
    `orderSn` VARCHAR(80) NULL,
    `vid` INTEGER NOT NULL,
    `uid` INTEGER NOT NULL DEFAULT 0,
    `isDate` INTEGER NOT NULL DEFAULT 1,
    `isWeek` INTEGER NOT NULL DEFAULT 1,
    `isMonth` INTEGER NOT NULL DEFAULT 1,
    `expire` DATETIME(3) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `payed_shows_ip_createdAt_ua_idx`(`ip`, `createdAt`, `ua`),
    INDEX `payed_shows_orderSn_idx`(`orderSn`),
    INDEX `payed_shows_expire_idx`(`expire`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pay_channels` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(200) NOT NULL,
    `model` VARCHAR(200) NOT NULL,
    `appId` VARCHAR(255) NOT NULL,
    `appKey` VARCHAR(255) NOT NULL,
    `payChannel` VARCHAR(255) NOT NULL DEFAULT '',
    `payUrl` VARCHAR(255) NOT NULL DEFAULT '',
    `status` INTEGER NOT NULL DEFAULT 2,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `pay_channels_model_key`(`model`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cash_advances` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` INTEGER NOT NULL,
    `pid` INTEGER NOT NULL DEFAULT 0,
    `money` DECIMAL(11, 2) NOT NULL,
    `poundage` DECIMAL(11, 2) NOT NULL DEFAULT 0,
    `realMoney` DECIMAL(11, 2) NOT NULL DEFAULT 0,
    `account` VARCHAR(255) NOT NULL,
    `image` VARCHAR(255) NULL,
    `type` INTEGER NOT NULL DEFAULT 1,
    `status` INTEGER NOT NULL DEFAULT 0,
    `remark` VARCHAR(255) NOT NULL DEFAULT '',
    `adminNote` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `cash_advances_uid_idx`(`uid`),
    INDEX `cash_advances_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `money_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` INTEGER NOT NULL,
    `money` DECIMAL(11, 2) NOT NULL,
    `before` DECIMAL(11, 2) NOT NULL,
    `after` DECIMAL(11, 2) NOT NULL,
    `type` INTEGER NOT NULL DEFAULT 1,
    `biz` VARCHAR(30) NOT NULL,
    `memo` VARCHAR(255) NOT NULL,
    `orderSn` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `money_logs_uid_createdAt_idx`(`uid`, `createdAt`),
    INDEX `money_logs_biz_idx`(`biz`),
    INDEX `money_logs_orderSn_idx`(`orderSn`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domain_libs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `domain` VARCHAR(1000) NOT NULL,
    `type` INTEGER NOT NULL DEFAULT 1,
    `status` INTEGER NOT NULL DEFAULT 1,
    `isBind` INTEGER NOT NULL DEFAULT 0,
    `bindTime` DATETIME(3) NULL,
    `uid` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `domain_libs_type_status_idx`(`type`, `status`),
    INDEX `domain_libs_uid_idx`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `domain_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `getCount` INTEGER NOT NULL DEFAULT 5,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `mubans` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` INTEGER NULL,
    `title` VARCHAR(150) NULL,
    `muban` VARCHAR(150) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT '1',
    `image` VARCHAR(150) NULL,
    `desc` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `hezis` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` INTEGER NOT NULL,
    `video` VARCHAR(225) NULL,
    `title` VARCHAR(20) NULL,
    `status` VARCHAR(191) NOT NULL DEFAULT '1',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `configs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(30) NOT NULL,
    `group` VARCHAR(30) NOT NULL DEFAULT '',
    `title` VARCHAR(100) NOT NULL DEFAULT '',
    `tip` VARCHAR(100) NOT NULL DEFAULT '',
    `type` VARCHAR(30) NOT NULL DEFAULT 'string',
    `value` TEXT NOT NULL,
    `content` TEXT NULL,
    `rule` VARCHAR(100) NOT NULL DEFAULT '',
    `extend` VARCHAR(255) NOT NULL DEFAULT '',
    `sort` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `configs_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `links` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `cid` INTEGER NOT NULL DEFAULT 0,
    `uid` INTEGER NOT NULL,
    `videoId` INTEGER NULL,
    `videoName` VARCHAR(50) NULL,
    `videoUrl` TEXT NULL,
    `erwei` TEXT NULL,
    `shortUrl` VARCHAR(255) NULL,
    `money` VARCHAR(11) NOT NULL DEFAULT '0.00',
    `money1` VARCHAR(11) NOT NULL DEFAULT '0.00',
    `money2` VARCHAR(11) NOT NULL DEFAULT '0.00',
    `mianfei` INTEGER NOT NULL DEFAULT 0,
    `readNum` INTEGER NOT NULL DEFAULT 0,
    `status` INTEGER NOT NULL DEFAULT 1,
    `title` VARCHAR(255) NULL,
    `img` VARCHAR(255) NOT NULL DEFAULT '',
    `stockId` INTEGER NOT NULL DEFAULT 0,
    `trySee` INTEGER NOT NULL DEFAULT 0,
    `inputTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `links_uid_idx`(`uid`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_rules` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(30) NOT NULL DEFAULT 'file',
    `pid` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(100) NOT NULL,
    `title` VARCHAR(50) NOT NULL,
    `icon` VARCHAR(50) NOT NULL DEFAULT '',
    `condition` VARCHAR(255) NOT NULL DEFAULT '',
    `remark` VARCHAR(255) NOT NULL DEFAULT '',
    `ismenu` INTEGER NOT NULL DEFAULT 0,
    `weigh` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'normal',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `auth_rules_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_groups` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `pid` INTEGER NOT NULL DEFAULT 0,
    `name` VARCHAR(100) NOT NULL,
    `rules` TEXT NOT NULL,
    `status` VARCHAR(30) NOT NULL DEFAULT 'normal',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `auth_group_accesses` (
    `uid` INTEGER NOT NULL,
    `groupId` INTEGER NOT NULL,

    PRIMARY KEY (`uid`, `groupId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `visitor_tracks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `ip` VARCHAR(64) NOT NULL,
    `ua` VARCHAR(512) NULL,
    `deviceType` VARCHAR(191) NOT NULL DEFAULT 'mobile',
    `fpId` VARCHAR(64) NULL,
    `f` INTEGER NOT NULL DEFAULT 0,
    `referer` VARCHAR(255) NULL,
    `blocked` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `visitor_tracks_ip_createdAt_idx`(`ip`, `createdAt`),
    INDEX `visitor_tracks_f_createdAt_idx`(`f`, `createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `device_fingerprints` (
    `id` VARCHAR(64) NOT NULL,
    `uaMd5` VARCHAR(64) NOT NULL,
    `ua` VARCHAR(512) NULL,
    `firstIp` VARCHAR(64) NULL,
    `lastIp` VARCHAR(64) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `device_fingerprints_uaMd5_idx`(`uaMd5`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `import_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(191) NOT NULL DEFAULT 'stock',
    `fileName` VARCHAR(255) NOT NULL,
    `total` INTEGER NOT NULL DEFAULT 0,
    `success` INTEGER NOT NULL DEFAULT 0,
    `failed` INTEGER NOT NULL DEFAULT 0,
    `errors` JSON NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `operator` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `pay_users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `user` VARCHAR(255) NOT NULL,
    `password` VARCHAR(255) NOT NULL,

    UNIQUE INDEX `pay_users_user_key`(`user`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notifies` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` INTEGER NOT NULL DEFAULT 0,
    `title` VARCHAR(255) NULL,
    `content` VARCHAR(388) NULL,
    `isShow` VARCHAR(191) NOT NULL DEFAULT '1',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `complains` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `uid` VARCHAR(250) NULL,
    `status` INTEGER NOT NULL DEFAULT 0,
    `vid` VARCHAR(11) NULL,
    `remark` VARCHAR(255) NULL,
    `type` INTEGER NULL,
    `ip` VARCHAR(230) NULL,
    `ua` VARCHAR(255) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `versions` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `oldVersion` VARCHAR(30) NOT NULL DEFAULT '',
    `newVersion` VARCHAR(30) NOT NULL DEFAULT '',
    `packageSize` VARCHAR(30) NOT NULL DEFAULT '',
    `content` VARCHAR(500) NOT NULL DEFAULT '',
    `downloadUrl` VARCHAR(255) NOT NULL DEFAULT '',
    `enforce` INTEGER NOT NULL DEFAULT 0,
    `weigh` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'normal',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `attachments` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `adminId` INTEGER NOT NULL DEFAULT 0,
    `userId` INTEGER NOT NULL DEFAULT 0,
    `url` VARCHAR(255) NOT NULL,
    `imagewidth` VARCHAR(30) NOT NULL DEFAULT '',
    `imageheight` VARCHAR(30) NOT NULL DEFAULT '',
    `imagetype` VARCHAR(30) NOT NULL DEFAULT '',
    `imageframes` INTEGER NOT NULL DEFAULT 0,
    `filesize` INTEGER NOT NULL DEFAULT 0,
    `mimetype` VARCHAR(100) NOT NULL DEFAULT '',
    `extparam` VARCHAR(255) NOT NULL DEFAULT '',
    `storage` VARCHAR(100) NOT NULL DEFAULT 'local',
    `sha1` VARCHAR(40) NOT NULL DEFAULT '',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `uploadTime` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `cron_tasks` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` VARCHAR(10) NOT NULL DEFAULT '',
    `title` VARCHAR(100) NOT NULL DEFAULT '',
    `content` TEXT NOT NULL,
    `schedule` VARCHAR(100) NOT NULL DEFAULT '',
    `sleep` INTEGER NOT NULL DEFAULT 0,
    `maximums` INTEGER NOT NULL DEFAULT 0,
    `executes` INTEGER NOT NULL DEFAULT 0,
    `weigh` INTEGER NOT NULL DEFAULT 0,
    `status` VARCHAR(30) NOT NULL DEFAULT 'normal',
    `beginTime` DATETIME(3) NULL,
    `endTime` DATETIME(3) NULL,
    `executeTime` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `_AdminTree` (
    `A` INTEGER NOT NULL,
    `B` INTEGER NOT NULL,

    UNIQUE INDEX `_AdminTree_AB_unique`(`A`, `B`),
    INDEX `_AdminTree_B_index`(`B`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `stock_prices` ADD CONSTRAINT `stock_prices_stockId_fkey` FOREIGN KEY (`stockId`) REFERENCES `stocks`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `payed_shows` ADD CONSTRAINT `payed_shows_orderSn_fkey` FOREIGN KEY (`orderSn`) REFERENCES `pay_orders`(`transact`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AdminTree` ADD CONSTRAINT `_AdminTree_A_fkey` FOREIGN KEY (`A`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `_AdminTree` ADD CONSTRAINT `_AdminTree_B_fkey` FOREIGN KEY (`B`) REFERENCES `admins`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
