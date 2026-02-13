const express = require("express");
const eventController = require("../controllers/eventController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const imageUploaderasync = require("../middlewares/imageUploaderMiddleware");

const router = express.Router();

router.post("/",    authenticate, authorize(), imageUploaderasync, eventController.createEvent);
router.get("/",     authenticate,                                  eventController.getEvents);
router.get("/list",                                                eventController.searchEvents);
router.get("/:id",  authenticate,                                  eventController.getEventById);
router.put("/:id",  authenticate, authorize(), imageUploaderasync, eventController.updateEvent);
router.delete("/:id", authenticate, authorize(),                   eventController.deleteEvent);

module.exports = router;