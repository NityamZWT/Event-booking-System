const { Sequelize } = require("sequelize");
const sequelize = require("../config/db");

const UserModel = require("./User");
const EventModel = require("./Event");
const BookingModel = require("./Booking");

// initialize models
const User = UserModel(sequelize, Sequelize.DataTypes);
const Event = EventModel(sequelize, Sequelize.DataTypes);
const Booking = BookingModel(sequelize, Sequelize.DataTypes);

// collect models
const models = {
  User,
  Event,
  Booking,
};

// run associations
Object.values(models).forEach((model) => {
  if (model.associate) {
    model.associate(models);
  }
});

module.exports = {
  ...models,
  sequelize,
  Sequelize,
};
