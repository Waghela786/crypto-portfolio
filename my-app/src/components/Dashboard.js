import { useState, useEffect } from "react";
import API from "../services/api";
import { Bell as BellIcon } from "lucide-react"; // correct import
import { io } from "socket.io-client";

export default function NotificationBell({ token, userId }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
  const tokenLocal = token || localStorage.getItem("token");
    console.log("NotificationBell mounted", { tokenLocal, userId }); // debug log
    if (!tokenLocal) return;

    // Fetch notifications
    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications", {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        });
        setNotifications(res.data || []);
        setUnreadCount((res.data || []).filter((n) => !n.isRead).length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    fetchNotifications();

    // derive backend origin from API baseURL (e.g. http://localhost:5000)
    const backendOrigin =
      (API.defaults && API.defaults.baseURL
        ? String(API.defaults.baseURL).replace(/\/api\/?$/, "")
        : "") || "http://localhost:5000";

    const socket = io(backendOrigin, { auth: { token: tokenLocal } });

    socket.on("connect", () => {
      console.debug("Dashboard Notification socket connected", socket.id);
    });

    // Listen for changes in notifications
    const handleNotificationUpdate = () => {
      setNotifications((prev) => [...prev]);
    };

    socket.on("newNotification", (notification) => {
      try {
        // Resolve notification user id (supports populated object or raw id)
        let notifUserId = null;
        if (notification && notification.user) {
          try {
            notifUserId = notification.user._id ? String(notification.user._id) : String(notification.user);
          } catch (e) {
            notifUserId = String(notification.user);
          }
        }

        // Resolve current user id from props or localStorage
        const currentUid = userId || (function () {
          try {
            const u = localStorage.getItem("user");
            return u ? (JSON.parse(u)._id || JSON.parse(u).id) : null;
          } catch (e) {
            return null;
          }
        })();

        if (!notifUserId || !currentUid || String(notifUserId) !== String(currentUid)) {
          console.debug("Dashboard: ignoring notification not for this user", { notifUserId, currentUid });
          return;
        }

        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        handleNotificationUpdate(); // Trigger update
      } catch (err) {
        console.error("Error handling incoming notification in Dashboard:", err);
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [token, userId]);

  // Mark notification as read
  const markAsRead = async (id) => {
    try {
      const tokenLocal = localStorage.getItem("token");
      await API.put(`/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${tokenLocal}` },
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  return (
    <div className="relative">
      {console.log("NotificationBell rendered", { showDropdown })} {/* Debug log */}
      {/* Bell Icon */}
      <BellIcon
        className="w-6 h-6 text-gray-700 cursor-pointer"
        onClick={() => setShowDropdown(!showDropdown)}
      />

      {/* Unread Badge */}
      {unreadCount > 0 && (
        <span className="absolute top-0 right-0 bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-xs">
          {unreadCount}
        </span>
      )}

      {/* Dropdown List */}
      {showDropdown && (
        <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg border rounded-md z-50 max-h-64 overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="p-2 text-sm text-gray-500">No notifications</p>
          ) : (
            notifications.map((n) => (
              <div
                key={n._id}
                className={`p-2 text-sm cursor-pointer hover:bg-gray-100 ${
                  !n.isRead ? "font-bold bg-gray-50" : ""
                }`}
                onClick={() => markAsRead(n._id)}
              >
                {n.message}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

// In the parent component (e.g., Dashboard.js
