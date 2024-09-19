const mysql = require('mysql2/promise');
const fs = require('fs');
const csv = require('csv-parser');

/* const dbConfig = {
  host: 'localhost', 
  user: 'root',      
  password: 'password', 
  database: 'school'
}; */

async function main() {
 // const connection = await mysql.createConnection(dbConfig);
  
  const csvFilePath = './A.csv'; 

  fs.createReadStream(csvFilePath)
    .pipe(csv())
    .on('headers', (headers) => {
      console.log('CSV Headers:', headers); 
    })
    .on('data', async (row) => {
      const isEmptyRow = Object.values(row).every(value => value.trim() === '');
      if (isEmptyRow) {
        return; 
      }

      console.log('Row data (trimmed):', row); 

      const student = {
        lrn: row['LRN'].trim(),
        lname: row['LAST NAME'].trim(),
        fname: row['FIRST NAME'].trim(),
        pname: row['GUARDIAN'].trim(),
        address: row['ADDRESS'].trim(),
        contactno: row['CONTACT NO.'].trim(),
        email: row['EMAIL'].trim(),
        grade: row['GRADE'].trim(),
        section: row['SECTION'].trim(),
        schoolyr: '2024-2025', 
        status: 'active' // Default status
      };

      console.log('Formatted Student Data:', student);

      try {
        const query = `
          INSERT INTO students (securedlrn, lrn, fname, lname, grade, section, schoolyr, contactno, address, pname, email, status)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        const values = [
          hashLRN(student.lrn),
          student.lrn,
          student.fname,
          student.lname,
          student.grade,
          student.section,
          student.schoolyr,
          student.contactno,
          student.address,
          student.pname,
          student.email,
          student.status
        ];

      //  await connection.execute(query, values);
        console.log(`Student ${student.lname}, ${student.fname} added to the database.`);
      } catch (err) {
        console.error('Error inserting data:', err.message);
      }
    })
    .on('end', () => {
      console.log('CSV file successfully processed.');
     // connection.end(); // Close the database connection
    });
}

// Function to hash the LRN for secured LRN storage
function hashLRN(lrn) {
  const crypto = require('crypto');
  return crypto.createHash('sha256').update(lrn).digest('hex');
}

// Start the script
main().catch((err) => console.error('Error connecting to the database:', err));
