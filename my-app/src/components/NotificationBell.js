import { useState, useEffect } from "react";
import API from "../services/api";
import { Bell as BellIcon } from "lucide-react";
import { io } from "socket.io-client";
import { useNavigate } from "react-router-dom";

export default function NotificationBell({ token, userId }) {
  console.debug("NotificationBell: render", { tokenProvided: !!token, userId });
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  // no dropdown in header anymore — header only shows bell + count; clicking navigates to notifications page
  const [toast, setToast] = useState(null); // transient popup for incoming notifications

  // Double-safety: compute token and userId without early-return (hooks must be called unconditionally)
  const tokenLocalFromStorage = token || localStorage.getItem("token");
  const resolvedUserId =
    userId ||
    (function () {
      try {
        const u = localStorage.getItem("user");
        return u ? JSON.parse(u)._id || JSON.parse(u).id : null;
      } catch (e) {
        return null;
      }
    })();
  const isAuthenticated = !!tokenLocalFromStorage && !!resolvedUserId;

  // Small wrapper that ensures an icon is always rendered even if CSS (Tailwind) is not present.
  const IconWrapper = ({ onClick }) => {
    try {
      // lucide-react icons accept size and color props; use explicit values instead of relying on CSS classes
      return (
        <BellIcon
          size={20}
          color="#ffffff"
          style={{ cursor: "pointer", display: "block" }}
          onClick={onClick}
        />
      );
    } catch (e) {
      // Fallback inline SVG in case lucide-react isn't available for any reason
      return (
        <svg
          onClick={onClick}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          width="20"
          height="20"
          style={{ cursor: "pointer", color: "#ffffff", display: "block" }}
        >
          <path d="M12 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 006 14h12a1 1 0 00.707-1.707L18 11.586V8a6 6 0 00-6-6zM8 20a4 4 0 008 0H8z" />
        </svg>
      );
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return; // don't attempt to fetch/connect when not authenticated
    const tokenLocal = tokenLocalFromStorage;
    const fetchNotifications = async () => {
      try {
        const res = await API.get("/notifications", {
          headers: { Authorization: `Bearer ${tokenLocal}` },
        });
        console.debug("NotificationBell: fetched notifications", res.data);
        setNotifications(res.data || []);
        setUnreadCount((res.data || []).filter((n) => !n.isRead).length);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      }
    };

    // Listen for app:login event and re-fetch immediately when user logs in
    const onAppLogin = (e) => {
      try {
        fetchNotifications();
      } catch (err) {
        console.debug("NotificationBell: failed to fetch on app:login", err);
      }
    };
    window.addEventListener("app:login", onAppLogin);

    // Helper: resolve current user id reliably (string) from prop or localStorage
    const resolveCurrentUid = () => {
      let uid = userId;
      if (!uid) {
        try {
          const u = localStorage.getItem("user");
          uid = u ? JSON.parse(u)._id || JSON.parse(u).id : null;
        } catch (e) {
          uid = null;
        }
      }
      return uid ? String(uid) : null;
    };

  // Fetch existing notifications first
  fetchNotifications();

    // --- Fallback polling: refresh notifications every 10s in case socket events are missed ---
    const pollInterval = 10000; // 10 seconds
    const pollId = setInterval(() => {
      fetchNotifications();
    }, pollInterval);

    // Determine current user id — if unknown, skip socket connect (prevents receiving unrelated emits)
    const currentUid = resolveCurrentUid();
    if (!currentUid) {
      console.warn("NotificationBell: current user id not found; skipping Socket.IO connection");
      return;
    }

    const backendOrigin = API.defaults && API.defaults.baseURL
      ? String(API.defaults.baseURL).replace(/\/api\/?$/, "")
      : (typeof window !== "undefined" ? window.location.origin : "");

    const socket = io(backendOrigin, { auth: { token: tokenLocal } });

    socket.on("connect", () => {
      console.debug("NotificationBell: socket connected", socket.id, "(handshake auth sent)");
    });

    socket.on("newNotification", (notification) => {
      console.debug("NotificationBell: received newNotification", notification);

      // Resolve notification's intended user id (supports populated object or raw id)
      let notifUserId = null;
      if (notification && notification.user) {
        try {
          notifUserId = notification.user._id ? String(notification.user._id) : String(notification.user);
        } catch (e) {
          notifUserId = String(notification.user);
        }
      }

      // Strict check: only accept notification if both ids exist and match
      if (!notifUserId || notifUserId !== currentUid) {
        console.debug("NotificationBell: ignoring notification not for this user", { notifUserId, currentUid });
        return;
      }

      setNotifications((prev) => [notification, ...prev]);
      setUnreadCount((prev) => prev + 1);

      // Show transient toast popup for recipient only
      try {
        setToast({ id: notification._id || Date.now(), message: notification.message });
        // auto-dismiss after 4s
        setTimeout(() => setToast(null), 4000);
        // Also try the Web Notification API as a best-effort (requires user permission)
        if (window.Notification && Notification.permission === "granted") {
          new Notification("New notification", { body: notification.message });
        } else if (window.Notification && Notification.permission !== "denied") {
          Notification.requestPermission().then((perm) => {
            if (perm === "granted") new Notification("New notification", { body: notification.message });
          });
        }
      } catch (e) {
        console.debug("NotificationBell: toast show failed", e);
      }
    });

    return () => {
      clearInterval(pollId);
      socket.disconnect();
      window.removeEventListener("app:login", onAppLogin);
    };
  }, [isAuthenticated, resolvedUserId, tokenLocalFromStorage, userId]);

  // Individual mark-as-read removed from header component; notifications are marked on the Notifications page.

  // Mark all unread notifications as read (used when opening the dropdown)
  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter((n) => !n.isRead).map((n) => n._id);
      if (unread.length === 0) return;
      const tokenLocal = token || localStorage.getItem("token");
      await Promise.all(
        unread.map((id) => API.put(`/notifications/${id}/read`, null, { headers: { Authorization: `Bearer ${tokenLocal}` } }))
      );
      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // (old) handleNotificationClick removed — header click now navigates to /notifications

  return (
    <div style={{ position: "relative", display: "inline-block" }}>
      <IconWrapper
        onClick={async () => {
          // When user clicks the bell in the header, mark all unread as read and go to the notifications page
          try {
            await markAllAsRead();
          } catch (e) {
            console.debug("NotificationBell: markAllAsRead failed", e);
          }
          try {
            navigate("/notifications");
          } catch (e) {
            console.debug("NotificationBell: navigate failed", e);
          }
        }}
      />
      {unreadCount > 0 && (
        <span
          style={{
            position: "absolute",
            top: -6,
            right: -6,
            backgroundColor: "#ff4d4d",
            color: "#fff",
            borderRadius: "50%",
            width: 18,
            height: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 10,
            lineHeight: "10px",
          }}
        >
          {unreadCount}
        </span>
      )}

      {/* Header no longer renders full messages — messages live on /notifications page. */}

      {/* Transient toast popup for incoming notifications */}
      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            right: 20,
            top: 80,
            backgroundColor: "#111827",
            color: "#fff",
            padding: "10px 14px",
            borderRadius: 8,
            boxShadow: "0 6px 18px rgba(0,0,0,0.2)",
            zIndex: 9999,
            maxWidth: 320,
          }}
          onClick={() => setToast(null)}
        >
          <div style={{ fontWeight: 600, marginBottom: 4 }}>New notification</div>
          <div style={{ fontSize: 13 }}>{toast.message}</div>
        </div>
      )}
    </div>
  );
}

