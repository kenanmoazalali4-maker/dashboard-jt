const mysql = require('mysql2/promise');

async function testConnection() {
  try {
    const connection = await mysql.createConnection({
      host: '185.234.75.48',
      user: 'jtadmin',
      password: 'JtT13129302KeSm',
      database: 'jt-sql'
    });
    console.log('Successfully connected to the database!');
    await connection.end();
  } catch (error) {
    console.error('Connection failed:', error.message);
  }
}

testConnection();
