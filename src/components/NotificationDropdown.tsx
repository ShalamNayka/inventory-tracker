import type { InventoryNotification } from '../types/inventory';

type NotificationDropdownProps = {
  notifications: InventoryNotification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  showAll: boolean;
  isAdmin: boolean;
  showMovementUpdates: boolean;
  isMarkingRead: boolean;
  onSelect: (notification: InventoryNotification) => void;
  onMarkAllRead: () => void;
  onToggleShowAll: () => void;
  onToggleMovementUpdates: () => void;
};

const notificationIcons: Record<InventoryNotification['type'], string> = {
  OUT_OF_STOCK: '🔴',
  LOW_STOCK: '🟠',
  STOCK_ALERT: '🟡',
  STOCK_UPDATED: '🟢',
  STOCK_RESTORED: '✅',
};

function NotificationDropdown({
  notifications,
  unreadCount,
  isLoading,
  error,
  showAll,
  isAdmin,
  showMovementUpdates,
  isMarkingRead,
  onSelect,
  onMarkAllRead,
  onToggleShowAll,
  onToggleMovementUpdates,
}: NotificationDropdownProps) {
  const visibleNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <section className="notification-dropdown" aria-label="Notifications">
      <div className="notification-dropdown-header">
        <div>
          <h2>Notifications ({unreadCount})</h2>
          <p>{notifications.length} updates for your inventory</p>
        </div>
        <button
          type="button"
          className="notification-mark-read"
          onClick={onMarkAllRead}
          disabled={unreadCount === 0 || isMarkingRead}
        >
          Mark all as read
        </button>
      </div>

      {isLoading && <p className="notification-state">Loading notifications...</p>}
      {error && <p className="notification-state notification-error" role="alert">{error}</p>}
      {!isLoading && !error && notifications.length === 0 && (
        <p className="notification-state">No notifications yet.</p>
      )}

      {!isLoading && !error && visibleNotifications.length > 0 && (
        <div className="notification-list">
          {visibleNotifications.map((notification) => (
            <button
              type="button"
              key={notification.id}
              className={`notification-item${notification.isRead ? '' : ' notification-item--unread'}`}
              onClick={() => onSelect(notification)}
            >
              <span className="notification-icon" aria-hidden="true">
                {notificationIcons[notification.type]}
              </span>
              <span className="notification-copy">
                <strong>{notification.title}</strong>
                <span>{notification.message}</span>
                <time dateTime={notification.createdAt}>
                  {new Date(notification.createdAt).toLocaleString()}
                </time>
              </span>
              {!notification.isRead && <span className="notification-unread-dot" aria-label="Unread" />}
            </button>
          ))}
        </div>
      )}

      <button type="button" className="notification-view-all" onClick={onToggleShowAll}>
        {showAll ? 'Show recent notifications' : 'View all notifications'}
      </button>

      {isAdmin && (
        <div className="notification-settings">
          <label>
            <input
              type="checkbox"
              checked={showMovementUpdates}
              onChange={onToggleMovementUpdates}
            />
            Include stock movement updates
          </label>
        </div>
      )}
    </section>
  );
}

export default NotificationDropdown;