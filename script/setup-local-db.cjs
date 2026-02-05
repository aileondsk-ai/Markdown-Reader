
const { Client } = require('pg');

async function setupDatabase() {
    // 1. Try connecting to default 'postgres' database with current OS user
    // On MacOS Homebrew install, the default user is often the OS username with no password
    const config = {
        host: 'localhost',
        port: 5432,
        database: 'postgres',
    };

    console.log('Using config:', config);
    const client = new Client(config);

    try {
        await client.connect();
        console.log('✅ Connected to postgres database successfully!');

        // 2. Create database if not exists
        try {
            await client.query('CREATE DATABASE stylefinder');
            console.log('✅ Database "stylefinder" created.');
        } catch (err) {
            if (err.code === '42P04') { // duplicate_database
                console.log('ℹ️ Database "stylefinder" already exists.');
            } else {
                throw err;
            }
        }

        // 3. Create user if not exists
        try {
            await client.query("CREATE USER stylefinder WITH PASSWORD 'devpassword'");
            console.log('✅ User "stylefinder" created.');
        } catch (err) {
            if (err.code === '42710') { // duplicate_object
                console.log('ℹ️ User "stylefinder" already exists. Updating password...');
                await client.query("ALTER USER stylefinder WITH PASSWORD 'devpassword'");
                console.log('✅ User password updated.');
            } else {
                throw err;
            }
        }

        // 4. Grant privileges
        await client.query('GRANT ALL PRIVILEGES ON DATABASE stylefinder TO stylefinder');
        // Important: Grant schema usage
        // We need to switch to the stylefinder database to grant schema permissions on it,
        // OR allow the user to create objects in the current DB (postgres) - but we want stylefinder DB.
        // However, GRANT ON DATABASE doesn't grant schema creation.
        // Let's connect specifically to stylefinder DB as admin (if possible) or just make stylefinder owner.
        await client.query('ALTER DATABASE stylefinder OWNER TO stylefinder');

        // Also, connecting as postgres usually allows changing object ownership.
        console.log('✅ Granted database ownership to stylefinder');

        console.log('🎉 Setup complete!');
        await client.end();

        // Test connection with new credentials
        const testClient = new Client({
            connectionString: 'postgresql://stylefinder:devpassword@localhost:5432/stylefinder'
        });

        await testClient.connect();
        console.log('✅ Verified connection with new credentials!');
        await testClient.end();

    } catch (err) {
        console.error('❌ Error:', err);
        process.exit(1);
    }
}

setupDatabase();
