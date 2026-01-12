const db = require("../models");
const { Op } = require("sequelize");
const {
  NotFoundError,
  AuthorizationError,
  ValidationError,
} = require("../utils/errors");
const { UserRole } = require("../constants/common.types");

const { Event, User, Booking, sequelize } = db;
const cloudinary = require("../lib/cloudinary");

class EventService {
  createLocalDate(dateInput) {
    console.log("createLocalDate input:", dateInput, typeof dateInput);

    try {
      if (typeof dateInput === "string") {
        if (dateInput.includes("T")) {
          const dateObj = new Date(dateInput);
          return new Date(
            dateObj.getFullYear(),
            dateObj.getMonth(),
            dateObj.getDate(),
            0,
            0,
            0,
            0
          );
        } else {
          const [year, month, day] = dateInput.split("-").map(Number);
          return new Date(year, month - 1, day, 0, 0, 0, 0);
        }
      } else if (dateInput instanceof Date) {
        return new Date(
          dateInput.getFullYear(),
          dateInput.getMonth(),
          dateInput.getDate(),
          0,
          0,
          0,
          0
        );
      } else {
        console.error("Invalid date input type:", typeof dateInput, dateInput);
        throw new Error(`Invalid date input: ${dateInput}`);
      }
    } catch (error) {
      console.error("Error in createLocalDate:", error);
      throw new Error(`Invalid date format: ${dateInput}`);
    }
  }

  compareDatesOnly(date1, date2) {
    try {
      const d1 = new Date(
        date1.getFullYear(),
        date1.getMonth(),
        date1.getDate()
      );
      const d2 = new Date(
        date2.getFullYear(),
        date2.getMonth(),
        date2.getDate()
      );
      return d1 < d2;
    } catch (error) {
      console.error("Error in compareDatesOnly:", error);
      return false;
    }
  }

  async createEvent(eventData, userId) {
    return await sequelize.transaction(async (transaction) => {
      let eventDate = eventData.date;

      console.log("Creating event with data:", eventData);
      console.log("Date received:", eventDate, typeof eventDate);

      if (typeof eventDate === "string") {
        eventDate = this.createLocalDate(eventDate);
      }

      if (eventData.images && Array.isArray(eventData.images)) {
        console.log("Event images:", eventData.images);
      }

      const event = await Event.create(
        {
          ...eventData,
          date: eventDate,
          created_by: userId,
        },
        { transaction }
      );
      const isPastEvent = this.compareDatesOnly(event.date, new Date());

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        ticket_price: event.ticket_price,
        capacity: event.capacity,
        images: event.images,
        created_by: userId,
        pastEvent: isPastEvent,
      };
    });
  }

  async getEvents(page = 1, limit = 10, filters = {}, userRole) {
    const offset = (page - 1) * limit;
    const where = {};

    if (filters.created_by) {
      where.created_by = filters.created_by;
    }

    if (filters.date) {
      console.log("Filtering by date:", filters.date, typeof filters.date);

      try {
        let filterDate;
        if (typeof filters.date === "string") {
          const [year, month, day] = filters.date.split("-").map(Number);
          filterDate = new Date(year, month - 1, day, 0, 0, 0, 0);
        } else if (filters.date instanceof Date) {
          filterDate = new Date(
            filters.date.getFullYear(),
            filters.date.getMonth(),
            filters.date.getDate(),
            0,
            0,
            0,
            0
          );
        } else {
          console.error("Invalid date filter type:", typeof filters.date);
          throw new Error("Invalid date filter format");
        }

        const nextDay = new Date(filterDate);
        nextDay.setDate(nextDay.getDate() + 1);

        console.log("Filter date range:", filterDate, "to", nextDay);

        where.date = {
          [Op.gte]: filterDate,
          [Op.lt]: nextDay,
        };
      } catch (error) {
        console.error("Error processing date filter:", error);
        throw new Error(`Invalid date format for filter: ${filters.date}`);
      }
    }

    if (filters.q) {
      where.title = { [Op.like]: `%${filters.q}%` };
    }

    const { count, rows } = await Event.findAndCountAll({
      where,
      limit,
      offset,
      order: [["date", "ASC"]],
      attributes: [
        "id",
        "title",
        "date",
        "location",
        "images",
        "ticket_price",
        "capacity",
        "created_by",
      ],
    });

    const eventIds = rows.map((event) => event.id);
    const bookings = await Booking.findAll({
      where: { event_id: { [Op.in]: eventIds } },
      attributes: [
        "event_id",
        [sequelize.fn("SUM", sequelize.col("quantity")), "total_quantity"],
      ],
      group: ["event_id"],
      raw: true,
    });

    const bookedMap = {};
    bookings.forEach((booking) => {
      bookedMap[booking.event_id] = parseInt(booking.total_quantity) || 0;
    });

    const events = rows.map((event) => {
      const bookedTickets = bookedMap[event.id] || 0;
      const isPastEvent = this.compareDatesOnly(event.date, new Date());

      return {
        id: event.id,
        title: event.title,
        date: event.date,
        location: event.location,
        ticket_price: event.ticket_price,
        capacity: event.capacity,
        images: event.images,
        created_by: event.created_by,
        bookings: [{ quantity: bookedTickets }],
        pastEvent: isPastEvent,
      };
    });

    return {
      events,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit),
      },
    };
  }

  async getEventById(eventId, userRole, userId = null) {
    const event = await Event.findByPk(eventId, {
      attributes: [
        "id",
        "title",
        "description",
        "images",
        "date",
        "location",
        "ticket_price",
        "capacity",
        "created_by",
      ],
    });

    if (!event) {
      throw new NotFoundError("Event not found");
    }

    const isPastEvent = this.compareDatesOnly(event.date, new Date());

    const response = {
      id: event.id,
      title: event.title,
      images: event.images,
      description: event.description,
      date: event.date,
      location: event.location,
      ticket_price: event.ticket_price,
      capacity: event.capacity,
      created_by: event.created_by,
      pastEvent: isPastEvent,
    };

    if (userRole === UserRole.ADMIN) {
      const detailedBookings = await Booking.findAll({
        where: { event_id: eventId },
        attributes: [
          "id",
          "attendee_name",
          "quantity",
          "booking_amount",
          "createdAt",
        ],
        order: [["createdAt", "DESC"]],
        raw: true,
      });

      const totalBooked = detailedBookings.reduce(
        (sum, booking) => sum + (booking.quantity || 0),
        0
      );

      response.bookings = detailedBookings.map((booking) => ({
        id: booking.id,
        attendee_name: booking.attendee_name,
        quantity: booking.quantity,
        booking_amount: booking.booking_amount,
        createdAt: booking.createdAt,
      }));
      response.totalBooked = totalBooked;
      response.remainingTickets = event.capacity - totalBooked;
    } else {
      const totalBooked =
        (await Booking.sum("quantity", {
          where: { event_id: eventId },
        })) || 0;

      response.totalBooked = totalBooked;
      response.remainingTickets = event.capacity - totalBooked;

      if (userId) {
        const userBookings = await Booking.findAll({
          where: {
            event_id: eventId,
            user_id: userId,
          },
          attributes: [
            "id",
            "attendee_name",
            "quantity",
            "booking_amount",
            "createdAt",
          ],
          order: [["createdAt", "DESC"]],
          raw: true,
        });

        response.bookings = userBookings.map((booking) => ({
          id: booking.id,
          attendee_name: booking.attendee_name,
          quantity: booking.quantity,
          booking_amount: booking.booking_amount,
          createdAt: booking.createdAt,
        }));
      } else {
        // If no userId, just show total booked
        response.bookings = [{ quantity: totalBooked }];
      }
    }

    return response;
  }

  async updateEvent(eventId, updateData, userId, userRole) {
    return await sequelize.transaction(async (transaction) => {
      const event = await Event.findByPk(eventId, {
        transaction,
        include: [
          {
            model: Booking,
            as: "bookings",
            attributes: ["id", "quantity"],
          },
        ],
      });

      if (!event) {
        throw new NotFoundError("Event not found");
      }

      if (userRole === UserRole.EVENT_MANAGER && event.created_by !== userId) {
        throw new AuthorizationError(
          "You can only update events created by you"
        );
      }

      const bookedTickets =
        event.bookings?.reduce(
          (sum, booking) => sum + (booking.quantity || 0),
          0
        ) || 0;

      if (updateData.capacity !== undefined) {
        const newCapacity = parseInt(updateData.capacity, 10);

        if (newCapacity < bookedTickets) {
          throw new ValidationError(
            `Capacity cannot be less than ${bookedTickets} (already booked tickets)`,
            {
              capacity: `Capacity cannot be less than ${bookedTickets} (already booked tickets)`,
            }
          );
        }
      }

      if (updateData.date && typeof updateData.date === "string") {
        updateData.date = this.createLocalDate(updateData.date);

        if (userRole !== UserRole.ADMIN) {
          const today = new Date();
          const todayOnly = new Date(
            today.getFullYear(),
            today.getMonth(),
            today.getDate()
          );
          const eventDateOnly = new Date(
            updateData.date.getFullYear(),
            updateData.date.getMonth(),
            updateData.date.getDate()
          );

          if (this.compareDatesOnly(eventDateOnly, todayOnly)) {
            throw new ValidationError(
              "Event date must be today or in the future",
              {
                date: "Event date must be today or in the future",
              }
            );
          }
        }
      }

      if (
        updateData.images !== undefined ||
        updateData.retain_images !== undefined ||
        updateData.remove_images !== undefined
      ) {
        const existingImages = event.images || [];

        let retainIds = [];
        if (updateData.retain_images) {
          if (typeof updateData.retain_images === "string") {
            try {
              retainIds = JSON.parse(updateData.retain_images);
            } catch (e) {
              console.error("Error parsing retain_images:", e);
              retainIds = [];
            }
          } else if (Array.isArray(updateData.retain_images)) {
            retainIds = updateData.retain_images;
          }
        }

        let removeIds = [];
        if (updateData.remove_images) {
          if (typeof updateData.remove_images === "string") {
            try {
              removeIds = JSON.parse(updateData.remove_images);
            } catch (e) {
              console.error("Error parsing remove_images:", e);
              removeIds = [];
            }
          } else if (Array.isArray(updateData.remove_images)) {
            removeIds = updateData.remove_images;
          }
        }

        const newImages = Array.isArray(updateData.images)
          ? updateData.images
          : [];
        console.log("New uploaded images count:", newImages.length);

        let finalImages = [];

        if (removeIds.length > 0) {
          console.log("Processing images marked for removal:", removeIds);

          for (const img of existingImages) {
            if (img.public_id && removeIds.includes(img.public_id)) {
              try {
                await cloudinary.destroy(img.public_id);
              } catch (err) {
                console.error(
                  "Failed to delete Cloudinary image",
                  img.public_id,
                  err
                );
              }
            }
          }

          const imagesAfterRemoval = existingImages.filter(
            (img) => !removeIds.includes(img.public_id)
          );

          if (retainIds.length > 0) {
            finalImages = imagesAfterRemoval.filter((img) =>
              retainIds.includes(img.public_id)
            );
          } else {
            finalImages = imagesAfterRemoval;
          }

          finalImages = [...finalImages, ...newImages];
        } else if (retainIds.length > 0) {
          console.log("Processing with retain_ids only");

          const keptExistingImages = existingImages.filter((img) =>
            retainIds.includes(img.public_id)
          );

          const imagesToDelete = existingImages.filter(
            (img) => !retainIds.includes(img.public_id)
          );

          for (const img of imagesToDelete) {
            try {
              if (img.public_id) {
                console.log(
                  "Deleting from Cloudinary (not in retain list):",
                  img.public_id
                );
                await cloudinary.destroy(img.public_id);
              }
            } catch (err) {
              console.error(
                "Failed to delete Cloudinary image",
                img.public_id,
                err
              );
            }
          }

          finalImages = [...keptExistingImages, ...newImages];
        } else if (
          updateData.retain_images === null ||
          updateData.retain_images === undefined
        ) {
          console.log(
            "No retain_ids or remove_ids, keeping all existing images"
          );
          finalImages = [...existingImages, ...newImages];
        } else if (
          Array.isArray(updateData.retain_images) &&
          updateData.retain_images.length === 0
        ) {
          console.log("Empty retain_ids array, deleting all existing images");

          for (const img of existingImages) {
            try {
              if (img.public_id) {
                console.log(
                  "Deleting from Cloudinary (empty retain list):",
                  img.public_id
                );
                await cloudinary.destroy(img.public_id);
              }
            } catch (err) {
              console.error(
                "Failed to delete Cloudinary image",
                img.public_id,
                err
              );
            }
          }

          finalImages = [...newImages];
        }

        console.log("Final images count:", finalImages.length);
        updateData.images = finalImages;

        delete updateData.retain_images;
        delete updateData.remove_images;
      }

      const updateFields = { ...updateData };

      if (updateFields.images !== undefined) {
        await event.update({ images: updateFields.images }, { transaction });
        delete updateFields.images;
      }

      if (Object.keys(updateFields).length > 0) {
        await event.update(updateFields, { transaction });
      }

      await event.reload({ transaction });

      const isPastEvent = this.compareDatesOnly(event.date, new Date());

      return {
        id: event.id,
        title: event.title,
        description: event.description,
        images: event.images,
        date: event.date,
        location: event.location,
        ticket_price: event.ticket_price,
        capacity: event.capacity,
        created_by: event.created_by,
        pastEvent: isPastEvent,
      };
    });
  }

  async deleteEvent(eventId, userId, userRole) {
    return await sequelize.transaction(async (transaction) => {
      const event = await Event.findByPk(eventId, {
        transaction,
        attributes: ["id", "created_by", "images"],
      });

      if (!event) {
        throw new NotFoundError("Event not found");
      }

      if (userRole === UserRole.EVENT_MANAGER && event.created_by !== userId) {
        throw new AuthorizationError(
          "You can only delete events created by you"
        );
      }

      if (userRole === UserRole.CUSTOMER) {
        throw new AuthorizationError(
          "Only administrators or event managers can delete events"
        );
      }

      if (event.images && Array.isArray(event.images)) {
        console.log(
          `Deleting ${event.images.length} images from Cloudinary for event ${eventId}`
        );

        for (const img of event.images) {
          try {
            if (img.public_id) {
              console.log("Deleting from Cloudinary:", img.public_id);
              await cloudinary.destroy(img.public_id);
              console.log("Successfully deleted:", img.public_id);
            }
          } catch (err) {
            console.error(
              "Failed to delete Cloudinary image",
              img.public_id,
              err
            );
          }
        }
      }
      await Booking.destroy({ where: { event_id: eventId }, transaction });

      await Event.destroy({
        where: { id: eventId },
        transaction,
      });

      return { message: "Event deleted successfully" };
    });
  }

  async getEventsList(processedSearchTerm, page = 1, limit = 10) {
    const offset = (page - 1) * limit;
    let where = {};

    if (processedSearchTerm) {
      where = {
        title: {
          [Op.like]: `%${processedSearchTerm}%`,
        },
      };
    }

    try {
      const { count, rows } = await Event.findAndCountAll({
        where,
        limit: Number(limit),
        offset: Number(offset),
        order: [["created_at", "DESC"]],
        attributes: ["id", "title"],
      });

      return {
        events: rows,
        pagination: {
          total: count,
          page: Number(page),
          limit: Number(limit),
          totalPages: Math.ceil(count / limit),
          hasMore: Number(page) < Math.ceil(count / limit),
        },
      };
    } catch (error) {
      console.error("Database error in getEventsList:", error);
      throw error;
    }
  }
}

module.exports = new EventService();
