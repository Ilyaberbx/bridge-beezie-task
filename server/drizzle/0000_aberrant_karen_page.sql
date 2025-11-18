CREATE TABLE `bridging_logs` (
	`id` bigint unsigned AUTO_INCREMENT NOT NULL,
	`source_tx_hash` varchar(66) NOT NULL,
	`source_tx_explorer_url` varchar(255) NOT NULL,
	`source_user_address` varchar(42) NOT NULL,
	`destination_tx_hash` varchar(66) NOT NULL,
	`destination_tx_explorer_url` varchar(255) NOT NULL,
	`destination_user_address` varchar(42) NOT NULL,
	`amount_bridged` decimal(20,6) NOT NULL,
	`timestamp` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `bridging_logs_id` PRIMARY KEY(`id`)
);
