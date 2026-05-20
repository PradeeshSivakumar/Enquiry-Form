const { pool } = require('../config/db');

async function getVisitingCards() {
  const [cards] = await pool.execute(
    `SELECT id, filename, url, file_size, mime_type, uploaded_at FROM visiting_cards WHERE status = 0 ORDER BY uploaded_at DESC`
  );

  return cards;
}

async function getVisitingCardById(id) {
  const [cards] = await pool.execute(
    `SELECT id, filename, url, file_size, mime_type, uploaded_at FROM visiting_cards WHERE id = ? AND status = 0`,
    [id]
  );

  if (cards.length === 0) {
    const err = new Error('Visiting card not found.');
    err.statusCode = 404;
    throw err;
  }

  return cards[0];
}

async function deleteVisitingCard(id) {
  const [card] = await pool.execute(
    `SELECT filename FROM visiting_cards WHERE id = ?`,
    [id]
  );

  if (card.length === 0) {
    const err = new Error('Visiting card not found.');
    err.statusCode = 404;
    throw err;
  }

  await pool.execute(
    `UPDATE visiting_cards SET status = 1 WHERE id = ?`,
    [id]
  );

  return { message: 'Visiting card deleted successfully.' };
}

module.exports = {
  getVisitingCards,
  getVisitingCardById,
  deleteVisitingCard
};
