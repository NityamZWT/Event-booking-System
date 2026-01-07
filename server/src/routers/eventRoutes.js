const express = require("express");
const eventController = require("../controllers/eventController");
const { authenticate, authorize } = require("../middlewares/authMiddleware");
const { UserRole } = require("../constants/common.types");

const router = express.Router();

router.post(
  "/",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EVENT_MANAGER),
  eventController.createEvent
);

router.get("/", authenticate, eventController.getEvents);
router.get('/list', eventController.searchEvents);

router.get("/:id", authenticate, eventController.getEventById);

router.put(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN, UserRole.EVENT_MANAGER),
  eventController.updateEvent
);


router.delete(
  "/:id",
  authenticate,
  authorize(UserRole.ADMIN),
  eventController.deleteEvent
);

module.exports = router;
