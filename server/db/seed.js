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

async function seedDatabase(clientOrPool) {
  for (const cat of defaultCategories) {
    await clientOrPool.query(
      `INSERT INTO categories (name, icon) 
       VALUES ($1, $2) 
       ON CONFLICT (name) DO NOTHING`,
      [cat.name, cat.icon]
    );
  }
}

module.exports = {
  defaultCategories,
  seedDatabase
};
