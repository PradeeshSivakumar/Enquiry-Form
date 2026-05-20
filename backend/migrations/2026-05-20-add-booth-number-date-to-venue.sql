ALTER TABLE venue_master
  ADD COLUMN booth_number VARCHAR(30) NULL AFTER venue,
  ADD COLUMN venue_date DATE NULL AFTER booth_number;
