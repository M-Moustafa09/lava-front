import { Component, signal, computed, inject, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TranslatePipe, TranslateDirective } from '@ngx-translate/core';
import { StoreLayoutComponent } from '../../../shared/components/layout/store-layout/store-layout.component';
import { LucideAngularModule, Bell, Package, Tag, MessageCircle, Info, CheckCheck } from 'lucide-angular';
import { NotificationsPageConfigService } from '../../../core/services/page-configs/notifications-page-config.service';
import { LangService } from '../../../core/services/lang/lang.service';
import { NotificationService } from '../../../core/services/notification/notification.service';
import { Notification } from '../../../shared/data/mockData';
import { AuthService } from '../../../core/services/auth/auth.service';
import { environment } from '../../../../environments/environment';
import { t } from '../../../shared/i18n/translations';

@Component({
  selector: 'app-notifications-page',
  standalone: true,
  imports: [CommonModule, StoreLayoutComponent, LucideAngularModule, TranslatePipe, TranslateDirective],
  templateUrl: './notifications-page.component.html',
  styleUrl: './notifications-page.component.css'
})
export class NotificationsPageComponent implements OnInit {
  readonly configService = inject(NotificationsPageConfigService);
  readonly langService = inject(LangService);
  readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly http = inject(HttpClient);
  private readonly authService = inject(AuthService);

  notifs = signal<Notification[]>([]);
  unread = computed(() => this.notifs().filter(n => !n.read).length);
  
  readonly Bell = Bell;
  readonly Package = Package;
  readonly Tag = Tag;
  readonly MessageCircle = MessageCircle;
  readonly Info = Info;
  readonly CheckCheck = CheckCheck;
  readonly t = t;

  ngOnInit() {
    // Notifications belong to a signed-in account; a guest has none.
    if (!this.authService.getToken()) return;
    this.http.get<any>(`${environment.apiBaseUrl}/notifications`).subscribe({
      next: res => this.notifs.set((res?.data || []).map((n: any) => toNotification(n))),
      error: () => this.notifs.set([])
    });
  }

  markAllRead() {
    this.notifs.update(prev => prev.map(n => ({ ...n, read: true })));
    this.notificationService.setUnreadCount(0);
    if (this.authService.getToken()) {
      this.http.patch(`${environment.apiBaseUrl}/notifications/read-all`, {}).subscribe();
    }
  }

  handleNotifClick(n: Notification) {
    if (!n.read) {
      this.http.patch(`${environment.apiBaseUrl}/notifications/${n.id}/read`, {}).subscribe();
    }
    this.notifs.update(prev => prev.map(x => x.id === n.id ? { ...x, read: true } : x));
    const currentUnread = this.notificationService.unreadCount();
    this.notificationService.setUnreadCount(Math.max(0, currentUnread - (n.read ? 0 : 1)));
    
    if (n.orderId) this.router.navigate(['/orders']);
    if (n.type === 'chat') this.router.navigate(['/chat']);
  }

  formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString(
      this.langService.lang() === 'ar' ? 'ar-EG' : 'en-US', 
      { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }
    );
  }
}

/** Maps an API notification (its type is the backend `NotificationType` name) onto the page's item. */
function toNotification(n: any): Notification {
  const apiType: string = n.type || '';
  const type: Notification['type'] =
    /Chat|Support/.test(apiType) ? 'chat' :
    /Promotional/.test(apiType) ? 'offer' :
    /Order|Payment|BankTransfer/.test(apiType) ? 'order' : 'system';
  const titleByType: Record<Notification['type'], string> = {
    order: 'NOTIFICATIONS.TYPE_ORDER',
    chat: 'NOTIFICATIONS.TYPE_CHAT',
    offer: 'NOTIFICATIONS.TYPE_OFFER',
    system: 'NOTIFICATIONS.TYPE_SYSTEM',
  };
  return {
    id: n.id,
    type,
    title: titleByType[type],
    message: n.message || '',
    read: !!n.isRead,
    createdAt: n.createdAt,
    orderId: type === 'order' ? n.relatedEntityId || undefined : undefined,
  };
}
