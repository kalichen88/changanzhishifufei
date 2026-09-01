-- AlterTable
-- 适配外部资源方表格模板：新增视频资源文件链接(url2)、资源链接2(url3)
ALTER TABLE `stocks`
    ADD COLUMN `url2` TEXT NULL,
    ADD COLUMN `url3` TEXT NULL;
