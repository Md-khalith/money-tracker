const defaultCategories = [
  { name: 'Food', icon: '🍔' },
  { name: 'Medicine', icon: '💊' },
  { name: 'Travel', icon: '✈️' },
  { name: 'Entertainment', icon: '🎬' },
  { name: 'Shopping', icon: '🛍️' },
  { name: 'Bills', icon: '📄' },
  { name: 'Salary', icon: '💼' },
  { name: 'Freelance', icon: '💻' },
  { name: 'Gift', icon: '🎁' },
  { name: 'Other', icon: '📦' }
];

function seedDatabase(db) {
  const countRow = db.prepare('SELECT COUNT(*) AS count FROM categories').get();
  if (countRow && countRow.count === 0) {
    const insertStmt = db.prepare('INSERT INTO categories (name, icon) VALUES (?, ?)');
    const insertMany = db.transaction((categories) => {
      for (const cat of categories) {
        insertStmt.run(cat.name, cat.icon);
      }
    });
    insertMany(defaultCategories);
    console.log('Seeded default categories into database.');
  }
}

module.exports = {
  defaultCategories,
  seedDatabase
};
