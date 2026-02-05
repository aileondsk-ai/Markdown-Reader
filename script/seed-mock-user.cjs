
const { Client } = require('pg');

async function insertMockUser() {
    const client = new Client({
        connectionString: 'postgresql://stylefinder:devpassword@localhost:5432/stylefinder'
    });

    try {
        await client.connect();
        console.log('✅ Connected to database');

        const MOCK_USER = {
            id: "local-dev-user-001",
            email: "dev@localhost",
            firstName: "Local",
            lastName: "Developer",
        };

        const query = `
      INSERT INTO users (id, email, first_name, last_name, profile_image_url)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (id) DO UPDATE 
      SET email = $2, first_name = $3, last_name = $4, profile_image_url = $5
    `;

        await client.query(query, [
            MOCK_USER.id,
            MOCK_USER.email,
            MOCK_USER.firstName,
            MOCK_USER.lastName,
            null
        ]);

        console.log('✅ Mock user seeded successfully:', MOCK_USER.id);
        await client.end();

    } catch (err) {
        console.error('❌ Error seeding user:', err);
        process.exit(1);
    }
}

insertMockUser();
