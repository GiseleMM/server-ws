import { DataTypes } from "sequelize";
import { sequelize } from "./db.js";

export const Matches = sequelize.define(
  "Matches",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    sport: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    homeTeam: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    awayTeam: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM("scheduled", "live", "finished"),
      allowNull: false,
      defaultValue: "scheduled",
    },
    startTime: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    endTime: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    homeScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    awayScore: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    tableName: "matches",
    timestamps: true,
    underscored: true,
  }
);

export const Commentary = sequelize.define(
  "Commentary",
  {
    id: {
      type: DataTypes.INTEGER.UNSIGNED,
      primaryKey: true,
      autoIncrement: true,
    },
    matchId: {
      type: DataTypes.INTEGER.UNSIGNED,
      allowNull: false,
      references: {
        model: "matches", // 👈 string para MySQL
        key: "id",
      },
      onDelete: "CASCADE",
      onUpdate: "CASCADE",
    },
    minute: {
      type: DataTypes.INTEGER,
    },
    sequence: {
      type: DataTypes.INTEGER,
    },
    period: {
      type: DataTypes.STRING,
    },
    eventType: {
      type: DataTypes.STRING,
    },
    actor: {
      type: DataTypes.STRING,
    },
    team: {
      type: DataTypes.STRING,
    },
    message: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    tags: {
      type: DataTypes.JSON, // ✅ compatible con MySQL
      allowNull: true,
    },
  },
  {
    tableName: "commentary",
    timestamps: true,
    underscored: true,
  }
);

// Relaciones
Matches.hasMany(Commentary, {
  foreignKey: "matchId",
});

Commentary.belongsTo(Matches, {
  foreignKey: "matchId",
});
