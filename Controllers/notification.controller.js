const {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} = require("../Models/notification.model");

async function listNotifications(req, res, next) {
  try {
    const unreadOnly = req.query.unread === "true";
    const notifications = await getNotifications(req.user.username, {
      unreadOnly,
    });
    const unread_count = await getUnreadNotificationCount(req.user.username);
    res.status(200).send({ notifications, unread_count });
  } catch (error) {
    next(error);
  }
}

async function getNotificationCount(req, res, next) {
  try {
    const unread_count = await getUnreadNotificationCount(req.user.username);
    res.status(200).send({ unread_count });
  } catch (error) {
    next(error);
  }
}

async function readNotification(req, res, next) {
  try {
    const notification = await markNotificationRead(
      req.user.username,
      req.params.notification_id
    );
    res.status(200).send({ notification });
  } catch (error) {
    next(error);
  }
}

async function readAllNotifications(req, res, next) {
  try {
    await markAllNotificationsRead(req.user.username);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getNotificationCount,
  listNotifications,
  readAllNotifications,
  readNotification,
};
