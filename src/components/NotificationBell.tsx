import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications, useMarkNotificationsRead } from '../api/inventoryQueries';
import { useRole } from '../hooks/useRole';
import type { InventoryNotification } from '../types/inventory';
import NotificationDropdown from './NotificationDropdown';

const MOVEMENT_UPDATES_KEY = 'inv_tracker_show_movement_notifications';

function NotificationBell() {
  const { isAdmin } = useRole();
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const seenNotificationIds = useRef<Set<string> | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [toastNotification, setToastNotification] = useState<InventoryNotification | null>(null);
  const [showMovementUpdates, setShowMovementUpdates] = useState(() => {
    try {
      return localStorage.getItem(MOVEMENT_UPDATES_KEY) !== 'false';
    } catch {
      return true;
    }
  });
  const { data = [], isLoading, error } = useNotifications();
  const markRead = useMarkNotificationsRead();

  useEffect(() => {
    if (isLoading) return;

    if (!seenNotificationIds.current) {
      seenNotificationIds.current = new Set(data.map((notification) => notification.id));
      return;
    }

    const newAlerts = data.filter(
      (notification) =>
        !seenNotificationIds.current?.has(notification.id) &&
        notification.type !== 'STOCK_UPDATED',
    );
    data.forEach((notification) => seenNotificationIds.current?.add(notification.id));

    if (newAlerts[0]) setToastNotification(newAlerts[0]);
  }, [data, isLoading]);

  useEffect(() => {
    if (!toastNotification) return;

    const timeoutId = window.setTimeout(() => setToastNotification(null), 6000);
    return () => window.clearTimeout(timeoutId);
  }, [toastNotification]);

  useEffect(() => {
    try {
      localStorage.setItem(MOVEMENT_UPDATES_KEY, String(showMovementUpdates));
    } catch {
      // Ignore unavailable browser storage.
    }
  }, [showMovementUpdates]);

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !containerRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setIsOpen(false);
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const notifications = data.filter((notification) => {
    if (notification.type !== 'STOCK_UPDATED') return true;
    return isAdmin && showMovementUpdates;
  });
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const handleSelect = (notification: InventoryNotification) => {
    if (!notification.isRead) markRead.mutate([notification.id]);
    setToastNotification(null);
    setIsOpen(false);
    navigate(`/inventory?item=${encodeURIComponent(notification.itemId)}`);
  };

  const handleMarkAllRead = () => {
    const unreadIds = notifications.filter((notification) => !notification.isRead).map((item) => item.id);
    if (unreadIds.length > 0) markRead.mutate(unreadIds);
  };

  return (
    <div className="notification-bell-wrap" ref={containerRef}>
      {toastNotification && (
        <div className="notification-toast" role="status">
          <button
            type="button"
            className="notification-toast-content"
            onClick={() => handleSelect(toastNotification)}
          >
            <strong>{toastNotification.title}</strong>
            <span>{toastNotification.message}</span>
            <small>Just now</small>
          </button>
          <button
            type="button"
            className="notification-toast-dismiss"
            aria-label="Dismiss notification"
            onClick={() => setToastNotification(null)}
          >
            ×
          </button>
        </div>
      )}
      <button
        type="button"
        className="notification-bell"
        aria-label={`Notifications, ${unreadCount} unread`}
        aria-expanded={isOpen}
        onClick={() => setIsOpen((open) => !open)}
        title="Notifications"
      >
        <span aria-hidden="true">🔔</span>
        {unreadCount > 0 && <span className="notification-count">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          unreadCount={unreadCount}
          isLoading={isLoading}
          error={error?.message ?? null}
          showAll={showAll}
          isAdmin={isAdmin}
          showMovementUpdates={showMovementUpdates}
          isMarkingRead={markRead.isPending}
          onSelect={handleSelect}
          onMarkAllRead={handleMarkAllRead}
          onToggleShowAll={() => setShowAll((value) => !value)}
          onToggleMovementUpdates={() => setShowMovementUpdates((value) => !value)}
        />
      )}
    </div>
  );
}

export default NotificationBell;