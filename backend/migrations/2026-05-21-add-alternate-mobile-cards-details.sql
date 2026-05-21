ALTER TABLE enquiries
  ADD COLUMN alternate_mobile VARCHAR(20) NULL AFTER mobile,
  ADD COLUMN visiting_card_id_2 INT NULL AFTER visiting_card_url,
  ADD COLUMN visiting_card_url_2 VARCHAR(500) NULL AFTER visiting_card_id_2,
  ADD COLUMN details TEXT NULL AFTER remarks;
