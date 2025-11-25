import { DataSource } from 'typeorm';
import dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'maximizee_db',
  synchronize: process.env.NODE_ENV !== 'production',
  logging: false,
  entities: [__dirname + '/../models/**/*.{js,ts}'],
  migrations: [__dirname + '/../migrations/**/*.{js,ts}'],
  subscribers: [],
});
