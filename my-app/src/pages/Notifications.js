import React, { useEffect, useState } from "react";
import API from "../services/api";
import { useNavigate } from "react-router-dom";

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await API.get("/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications(res.data || []);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // When the page mounts, mark all unread notifications as read so badge clears
  useEffect(() => {
    const markAllUnread = async () => {
      try {
        const unread = notifications.filter((n) => !n.isRead).map((n) => n._id);
        if (unread.length === 0) return;
        const token = localStorage.getItem("token");
        await Promise.all(unread.map((id) => API.put(`/notifications/${id}/read`, null, { headers: { Authorization: `Bearer ${token}` } })));
        setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      } catch (err) {
        console.error("Error marking notifications read on page mount:", err);
      }
    };
    markAllUnread();
  }, [notifications]);

  const markAsRead = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await API.put(`/notifications/${id}/read`, null, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Notifications</h2>
      {loading ? (
        <p>Loading...</p>
      ) : notifications.length === 0 ? (
        <p>No notifications</p>
      ) : (
        <div style={{ marginTop: 12 }}>
          {notifications.map((n) => (
            <div
              key={n._id}
              onClick={async () => {
                if (!n.isRead) await markAsRead(n._id);
                // Future: navigate to related resource if n.link exists
                if (n.link) navigate(n.link);
              }}
              style={{
                padding: 12,
                borderRadius: 6,
                background: n.isRead ? "#fff" : "#f3f4f6",
                marginBottom: 8,
                cursor: "pointer",
                border: "1px solid #e5e7eb",
              }}
            >
              <div style={{ fontWeight: n.isRead ? 400 : 700 }}>{n.message}</div>
              <div style={{ fontSize: 12, color: "#6b7280", marginTop: 6 }}>{new Date(n.createdAt).toLocaleString()}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
