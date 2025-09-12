const { Sequelize } = require('sequelize');
require('dotenv').config();

// Database configuration
const sequelize = new Sequelize({
    dialect: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    database: process.env.DB_NAME || 'learnify',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    
    // Connection options
    dialectOptions: {
        charset: 'utf8mb4',
        dateStrings: true,
        typeCast: true
    },
    
    // Connection pool
    pool: {
        max: 10,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    
    // Logging
    logging: process.env.NODE_ENV === 'development' ? console.log : false,
    
    // Model options
    define: {
        charset: 'utf8mb4',
        collate: 'utf8mb4_unicode_ci',
        timestamps: true
    }
});

const connectDB = async () => {
    try {
        // Test connection
        await sequelize.authenticate();
        console.log('✅ Database connected successfully');
        
        // Sync models in development (be careful with this in production!)
        if (process.env.NODE_ENV === 'development') {
            console.log('🔄 Syncing database models...');
            await sequelize.sync({ 
                alter: false, // Set to true only if you want to alter existing tables
                force: false  // NEVER set to true in production - it drops tables!
            });
            console.log('✅ Database models synchronized');
        }
        
        return sequelize;
    } catch (error) {
        console.error('❌ Unable to connect to the database:', error);
        
        // Log more details about the connection error
        if (error.code === 'ECONNREFUSED') {
            console.error('💡 Make sure MySQL server is running and accessible');
        } else if (error.code === 'ER_BAD_DB_ERROR') {
            console.error('💡 Database does not exist. Please create it first.');
        } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
            console.error('💡 Check your database credentials in .env file');
        }
        
        process.exit(1);
    }
};

// Test connection function for manual testing
const testConnection = async () => {
    try {
        await sequelize.authenticate();
        console.log('Database connection test successful!');
        
        // Test a simple query
        const [results] = await sequelize.query('SELECT 1 + 1 AS result');
        console.log('Test query result:', results[0].result);
        
        await sequelize.close();
    } catch (error) {
        console.error('Database connection test failed:', error);
    }
};

module.exports = {
    sequelize,
    connectDB,
    testConnection
};




// const { Sequelize } = require('sequelize');
// require('dotenv').config();

// const sequelize = new Sequelize({
//     dialect: 'mysql',
//     host: process.env.DB_HOST || 'localhost',
//     port: process.env.DB_PORT || 3306,
//     database: process.env.DB_NAME || 'learnify',
//     username: process.env.DB_USER || 'root',
//     password: process.env.DB_PASSWORD || '',
//     logging: process.env.NODE_ENV === 'development' ? console.log : false,
//     pool: {
//         max: 5,
//         min: 0,
//         acquire: 30000,
//         idle: 10000
//     },
//     define: {
//         charset: 'utf8mb4',
//         collate: 'utf8mb4_unicode_ci'
//     }
// });

// const connectDB = async () => {
//     try {
//         await sequelize.authenticate();
//         console.log('✅ Database connected successfully');
        
//         // Sync models (create tables if they don't exist)
//         if (process.env.NODE_ENV === 'development') {
//             await sequelize.sync({ alter: true });
//             console.log('✅ Database synchronized');
//         }
//     } catch (error) {
//         console.error('❌ Database connection failed:', error);
//         process.exit(1);
//     }
// };

// module.exports = {
//     sequelize,
//     connectDB
// };