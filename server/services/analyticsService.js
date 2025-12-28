const db = require("../models");
const { UserRole } = require("../types/common.types");

const { Event, Booking, sequelize } = db;

class AnalyticsService {
  async getAnalytics(userId, userRole) {
    return await sequelize.transaction(async (transaction) => {
      const whereClause =
        userRole === UserRole.EVENT_MANAGER ? { created_by: userId } : {};

      const totalEvents = await Event.count({
        where: whereClause,
        transaction,
      });

      const totalBookingsQuery =
        userRole === UserRole.ADMIN
          ? await Booking.count({ transaction })
          : await Booking.count({
              include: [
                {
                  model: Event,
                  as: "event",
                  where: { created_by: userId },
                  attributes: [],
                },
              ],
              transaction,
            });

      const totalRevenueQuery =
        userRole === UserRole.ADMIN
          ? await Booking.sum("booking_amount", { transaction })
          : await Booking.sum("booking_amount", {
              include: [
                {
                  model: Event,
                  as: "event",
                  where: { created_by: userId },
                  attributes: [],
                },
              ],
              transaction,
            });

      const revenueByEventQuery =
        userRole === UserRole.ADMIN
          ? await Booking.findAll({
              attributes: [
                "event_id",
                [
                  sequelize.fn("SUM", sequelize.col("booking_amount")),
                  "revenue",
                ],
                [
                  sequelize.fn("SUM", sequelize.col("quantity")),
                  "total_tickets",
                ],
                [
                  sequelize.fn("COUNT", sequelize.col("Booking.id")),
                  "booking_count",
                ],
              ],
              include: [
                {
                  model: Event,
                  as: "event",
                  attributes: ["id", "title", "date", "location", "capacity"],
                },
              ],
              group: ["event_id", "event.id"],
              raw: false,
              transaction,
            })
          : await Booking.findAll({
              attributes: [
                "event_id",
                [
                  sequelize.fn("SUM", sequelize.col("booking_amount")),
                  "revenue",
                ],
                [
                  sequelize.fn("SUM", sequelize.col("quantity")),
                  "total_tickets",
                ],
                [
                  sequelize.fn("COUNT", sequelize.col("Booking.id")),
                  "booking_count",
                ],
              ],
              include: [
                {
                  model: Event,
                  as: "event",
                  where: { created_by: userId },
                  attributes: ["id", "title", "date", "location", "capacity"],
                },
              ],
              group: ["event_id", "event.id"],
              raw: false,
              transaction,
            });

      const revenueByEvent = revenueByEventQuery.map((item) => {
        const eventData = item.get("event");
        const revenue = parseFloat(item.getDataValue("revenue") || 0);
        const totalTickets = parseInt(item.getDataValue("total_tickets") || 0);
        const bookingCount = parseInt(item.getDataValue("booking_count") || 0);

        return {
          event_id: item.event_id,
          event_title: eventData.title,
          event_date: eventData.date,
          location: eventData.location,
          capacity: eventData.capacity,
          revenue,
          total_tickets_sold: totalTickets,
          booking_count: bookingCount,
          capacity_utilization: (
            (totalTickets / eventData.capacity) *
            100
          ).toFixed(2),
        };
      });

      return {
        summary: {
          total_events: totalEvents,
          total_bookings: totalBookingsQuery,
          total_revenue: parseFloat(totalRevenueQuery || 0).toFixed(2),
        },
        revenue_by_event: revenueByEvent,
      };
    });
  }
}

module.exports = new AnalyticsService();
