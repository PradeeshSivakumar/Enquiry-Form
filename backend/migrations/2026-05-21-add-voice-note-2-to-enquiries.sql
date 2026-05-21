ALTER TABLE enquiries
  ADD COLUMN voice_note_id_2 INT NULL AFTER voice_note_url,
  ADD COLUMN voice_note_url_2 VARCHAR(500) NULL AFTER voice_note_id_2;
