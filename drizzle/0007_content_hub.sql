CREATE TABLE IF NOT EXISTS `articles` (
  `id` int AUTO_INCREMENT NOT NULL,
  `title` varchar(256) NOT NULL,
  `slug` varchar(256) NOT NULL,
  `content` text NOT NULL,
  `excerpt` text,
  `coverImage` varchar(512),
  `category` varchar(32) NOT NULL DEFAULT 'analysis',
  `tags` varchar(512),
  `author` varchar(64) NOT NULL DEFAULT 'Get8Pro编辑部',
  `status` enum('draft','pending_review','approved','published','rejected') NOT NULL DEFAULT 'draft',
  `perspective` varchar(32) DEFAULT 'neutral',
  `targetAudience` varchar(32) DEFAULT 'beginner',
  `contentStyle` varchar(32) DEFAULT 'formal',
  `isAiGenerated` boolean NOT NULL DEFAULT false,
  `aiPrompt` text,
  `sensitiveStatus` varchar(32) DEFAULT 'pending',
  `sensitiveWords` text,
  `reviewNotes` text,
  `metaTitle` varchar(256),
  `metaDescription` varchar(512),
  `metaKeywords` varchar(512),
  `viewCount` int NOT NULL DEFAULT 0,
  `isPinned` boolean NOT NULL DEFAULT false,
  `isActive` boolean NOT NULL DEFAULT true,
  `scheduledAt` timestamp NULL,
  `publishedAt` timestamp NULL,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `articles_id` PRIMARY KEY(`id`),
  CONSTRAINT `articles_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `media_platforms` (
  `id` int AUTO_INCREMENT NOT NULL,
  `platform` varchar(32) NOT NULL,
  `name` varchar(64) NOT NULL,
  `icon` varchar(8) NOT NULL DEFAULT '📢',
  `isEnabled` boolean NOT NULL DEFAULT false,
  `apiKey` text,
  `apiSecret` text,
  `channelId` varchar(256),
  `extraConfig` text,
  `autoPublish` boolean NOT NULL DEFAULT false,
  `autoPublishNews` boolean NOT NULL DEFAULT false,
  `sensitiveStandard` varchar(32) DEFAULT 'general',
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `media_platforms_id` PRIMARY KEY(`id`),
  CONSTRAINT `media_platforms_platform_unique` UNIQUE(`platform`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `publish_logs` (
  `id` int AUTO_INCREMENT NOT NULL,
  `contentType` varchar(16) NOT NULL,
  `contentId` int NOT NULL,
  `contentTitle` varchar(256) NOT NULL,
  `platform` varchar(32) NOT NULL,
  `status` enum('pending','success','failed','skipped') NOT NULL DEFAULT 'pending',
  `response` text,
  `retryCount` int NOT NULL DEFAULT 0,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  `updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT `publish_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `sensitive_words` (
  `id` int AUTO_INCREMENT NOT NULL,
  `word` varchar(128) NOT NULL,
  `platforms` varchar(128) NOT NULL DEFAULT 'all',
  `severity` enum('block','warn','replace') NOT NULL DEFAULT 'warn',
  `replacement` varchar(128),
  `category` varchar(32) NOT NULL DEFAULT 'custom',
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `sensitive_words_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
INSERT IGNORE INTO `media_platforms` (`platform`, `name`, `icon`, `isEnabled`, `autoPublish`, `autoPublishNews`, `sensitiveStandard`) VALUES
('telegram', 'Telegram', '✈️', true, false, true, 'general'),
('wechat', '微信公众号', '💬', false, false, false, 'wechat'),
('weibo', '微博', '🔴', false, false, false, 'weibo'),
('twitter', 'Twitter/X', '🐦', false, false, false, 'general'),
('tiktok', '抖音', '🎵', false, false, false, 'tiktok');
--> statement-breakpoint
INSERT IGNORE INTO `sensitive_words` (`word`, `platforms`, `severity`, `replacement`, `category`) VALUES
('保证盈利', 'all', 'block', NULL, 'financial'),
('稳赚不赔', 'all', 'block', NULL, 'financial'),
('无风险', 'all', 'warn', '低风险', 'financial'),
('内幕消息', 'all', 'block', NULL, 'financial'),
('坐庄', 'all', 'block', NULL, 'financial'),
('割韭菜', 'wechat,weibo,tiktok', 'warn', '市场调整', 'financial'),
('跑路', 'wechat,weibo,tiktok', 'warn', '项目终止', 'financial'),
('庄家', 'wechat,weibo,tiktok', 'warn', '大资金方', 'financial'),
('洗盘', 'wechat,weibo,tiktok', 'warn', '价格整理', 'financial'),
('拉盘', 'wechat,weibo,tiktok', 'warn', '价格上涨', 'financial'),
('砸盘', 'wechat,weibo,tiktok', 'warn', '价格下跌', 'financial'),
('翻倍', 'wechat,weibo', 'warn', '大幅上涨', 'financial'),
('暴富', 'all', 'warn', '获得收益', 'financial'),
('一夜暴富', 'all', 'block', NULL, 'financial'),
('传销', 'all', 'block', NULL, 'financial'),
('资金盘', 'all', 'block', NULL, 'financial'),
('庞氏', 'all', 'warn', '高风险项目', 'financial');
