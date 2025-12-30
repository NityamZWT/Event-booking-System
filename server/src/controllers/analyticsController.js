const analyticsService = require('../services/analyticsService');
const { SuccessResponse } = require('../utils/responseHandler');

const getAnalytics = async (req, res, next) => {
  try {
    const analytics = await analyticsService.getAnalytics(req.user.id, req.user.role);

    return new SuccessResponse('Analytics retrieved successfully', analytics).send(res);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAnalytics
};