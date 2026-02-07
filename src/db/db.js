import { Sequelize } from "sequelize";


if (!process.env.DB_URI) {
  throw new Error("DATABASE_URL is not defined");
}

export const sequelize = new Sequelize(process.env.DB_URI, {
  logging: false, // opcional
});

export const dbConnection = async () => {
  try {
    await sequelize.authenticate();
    // await sequelize.sync();
    console.log("Connection has been established successfully.");
  } catch (error) {
    console.error("Connection has NOT been established successfully.", error);
    await sequelize.close();
    throw error;
  }
};
