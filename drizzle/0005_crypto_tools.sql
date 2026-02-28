CREATE TABLE `crypto_tools` (
  `id` int AUTO_INCREMENT NOT NULL,
  `name` varchar(64) NOT NULL,
  `nameEn` varchar(64) NOT NULL,
  `description` text NOT NULL,
  `descriptionEn` text NOT NULL,
  `category` varchar(32) NOT NULL DEFAULT 'general',
  `source` varchar(128) NOT NULL,
  `url` varchar(512) NOT NULL,
  `icon` varchar(8) NOT NULL DEFAULT '🔧',
  `tags` varchar(256),
  `difficulty` enum('beginner','intermediate','advanced') NOT NULL DEFAULT 'beginner',
  `sortOrder` int NOT NULL DEFAULT 0,
  `isActive` boolean NOT NULL DEFAULT true,
  `createdAt` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT `crypto_tools_id` PRIMARY KEY(`id`)
);
