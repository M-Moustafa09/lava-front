import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, concat, forkJoin } from 'rxjs';
import { map, switchMap, catchError, toArray } from 'rxjs/operators';
import { IOrderRepository } from '../../domain/interfaces/order.repository';
import { TrackedOrder, TrackedOrderStatus, TrackedOrderStatusUpdater } from '../../domain/models/order.model';
import { SEED_TRACKED_ORDERS } from '../mock/seed-orders.mock';
import { environment } from '../../../environments/environment';
import { ContextService } from '../../core/services/context/context.service';

const STORAGE_KEY = `${environment.storagePrefix}completed-orders`;
const ORDERS_PAGE_SIZE = 100;

/** Backend `OrderStatus` enum values, sent as numbers because the API reads enums numerically. */
const BACKEND_ORDER_STATUS: Record<TrackedOrderStatus, number> = {
  confirmed: 0,          // NewOrder
  'pending-approval': 1, // PendingApproval
  preparing: 2,          // Prepared
  shipped: 3,            // Shipping
  'out-for-delivery': 3, // Shipping
  delivered: 4,          // Delivered
  cancelled: 5,          // Cancelled
  postponed: 6,          // Incomplete
};

const BACKEND_PAYMENT_STATUS = { Pending: 0, Paid: 2 } as const;

/** The dashboard's payment-method labels and the backend `PaymentMethod` values they stand for. */
const BACKEND_PAYMENT_METHOD: Record<string, number> = {
  'بطاقة مدى': 1,          // DebitCard
  'تحويل بنكي': 2,         // BankTransfer
  'الدفع عند الاستلام': 3, // CashOnDelivery
};

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  DebitCard: 'بطاقة مدى',
  BankTransfer: 'تحويل بنكي',
  CashOnDelivery: 'الدفع عند الاستلام',
};

function toFrontStatus(status: string): TrackedOrderStatus {
  switch (status) {
    case 'PendingApproval': return 'pending-approval';
    case 'Prepared': return 'preparing';
    case 'Shipping': return 'out-for-delivery';
    case 'Delivered': return 'delivered';
    case 'Cancelled': return 'cancelled';
    case 'Incomplete': return 'postponed';
    default: return 'confirmed';
  }
}

@Injectable({
  providedIn: 'root',
})
export class OrderRepositoryImpl implements IOrderRepository {
  private http = inject(HttpClient);
  private context = inject(ContextService);

  getOrders(): Observable<TrackedOrder[]> {
    if (!environment.useMockData) {
      return this.fetchAllOrderPages().pipe(
        map(items => {
          return items.map((o: any) => {
            const isBank = o.paymentMethod === 'BankTransfer' || o.paymentMethod === 2 || o.paymentMethod === 'تحويل بنكي' || o.paymentMethod === 'CHECKOUT.BANK_TRANSFER';
            let receiptUrl = o.proofImageUrl || o.bankTransferReceiptUrl || (o.bankTransfers && o.bankTransfers.length > 0 ? o.bankTransfers[0].proofImageUrl : undefined);
            return {
              id: o.id,
              orderNumber: o.orderNumber || o.id.split('-')[0].toUpperCase(),
              shipmentCode: o.shipmentCode || undefined,
              createdAt: o.createdAt,
              updatedAt: o.createdAt,
              status: toFrontStatus(o.status),
              paymentStatus: o.paymentStatus === 'Paid' ? 'paid' : 'unpaid',
              notes: o.notes || undefined,
              items: (o.items || []).map((i: any) => ({
                productId: i.productId,
                name: i.productNameAr || i.productNameEn || '',
                image: i.productImage || '/assets/home/product-1.png',
                size: i.size || '',
                color: '',
                quantity: i.quantity,
                unitPrice: i.unitPrice ?? i.value ?? 0
              })),
              subtotal: o.total || o.totalAmount || 0,
              shipping: 0,
              discount: 0,
              total: o.total || o.totalAmount || 0,
              currency: o.currency || undefined,
              customerName: o.customerName || 'Guest',
              phone: o.phone || '',
              city: o.city || o.country || '',
              area: o.area || '',
              address: o.address || '',
              paymentMethod: PAYMENT_METHOD_LABELS[o.paymentMethod] || (isBank ? 'تحويل بنكي' : 'الدفع عند الاستلام'),
              country: o.country || '',
              countryCode: o.countryCode || undefined,
              deliveryCompany: o.deliveryCompany || 'LAVVA Delivery',
              estimatedDelivery: o.estimatedDelivery || '',
              bankTransferReceipt: receiptUrl ? {
                name: 'Receipt',
                type: 'image/jpeg',
                dataUrl: receiptUrl
              } : undefined
            } as TrackedOrder;
          });
        })
      );
    }

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return of(parsed);
        }
      }
      this.saveLocal(SEED_TRACKED_ORDERS);
      return of(SEED_TRACKED_ORDERS);
    } catch {
      return of(SEED_TRACKED_ORDERS);
    }
  }

  getOrderById(id: string): Observable<TrackedOrder | undefined> {
    if (!environment.useMockData) {
      return this.http.get<TrackedOrder>(`${environment.apiBaseUrl}/orders/${id}`);
    }
    return this.getOrders().pipe(map(orders => orders.find(o => o.id === id || o.orderNumber === id)));
  }

  createOrder(order: TrackedOrder): Observable<TrackedOrder> {
    if (!environment.useMockData) {
      const isGuid = (val: any) => typeof val === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
      const DEFAULT_PRODUCT_ID = '3D5D8C97-25BC-4457-A721-9EF43297FD54';
      const isBank = (order.paymentMethod || '').includes('تحويل') || (order.paymentMethod || '').toLowerCase().includes('bank') || !!order.bankTransferReceipt;

      const payload = {
        address: order.address,
        phone: order.phone,
        notes: order.notes,
        // The CRM picks the courier from the city, so it must reach the order.
        city: order.city || null,
        area: order.area || null,
        paymentMethod: isBank ? 2 : 1, // 1: COD, 2: BankTransfer
        items: (order.items && order.items.length > 0 ? order.items : [{ productId: DEFAULT_PRODUCT_ID, quantity: 1 }]).map(i => ({
          productId: isGuid(i.productId) ? i.productId : DEFAULT_PRODUCT_ID,
          quantity: i.quantity || 1,
          // The chosen size picks the CRM code the line is synced with (each size is its own CRM product).
          size: (i as any).size || null
        })),
        guestName: order.customerName,
        guestCountryName: order.country,
        countryId: (order as any).countryId ?? this.context.currentCountryId()
      };

      return this.http.post<any>(`${environment.apiBaseUrl}/orders`, payload).pipe(
        switchMap(response => {
          const orderId = response?.data?.orderId || response?.orderId;
          if (order.bankTransferReceipt && order.bankTransferReceipt.dataUrl && orderId) {
            const arr = order.bankTransferReceipt.dataUrl.split(',');
            const mimeMatch = arr[0].match(/:(.*?);/);
            const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';
            const bstr = atob(arr[1]);
            let n = bstr.length;
            const u8arr = new Uint8Array(n);
            while (n--) {
              u8arr[n] = bstr.charCodeAt(n);
            }
            const blob = new Blob([u8arr], { type: mime });
            const formData = new FormData();
            formData.append('orderId', orderId);
            formData.append('proofImage', blob, order.bankTransferReceipt.name || 'receipt.jpg');

            return this.http.post(`${environment.apiBaseUrl}/bank-transfers`, formData).pipe(
              map(() => ({ ...order, id: orderId, orderNumber: response?.data?.orderNumber || response?.orderNumber || order.orderNumber })),
              catchError(() => of({ ...order, id: orderId, orderNumber: response?.data?.orderNumber || response?.orderNumber || order.orderNumber }))
            );
          }
          return of({ ...order, id: orderId, orderNumber: response?.data?.orderNumber || response?.orderNumber || order.orderNumber });
        })
      );
    }
    return this.getOrders().pipe(
      map(orders => {
        const next = [order, ...orders.filter(o => o.id !== order.id)];
        this.saveLocal(next);
        return order;
      })
    );
  }

  updateOrder(id: string, updates: Partial<TrackedOrder>): Observable<TrackedOrder> {
    if (!environment.useMockData) {
      const requests: Observable<unknown>[] = [];

      const statusBody: Record<string, number> = {};
      if (updates.status) statusBody['status'] = BACKEND_ORDER_STATUS[updates.status];
      if (updates.paymentStatus) statusBody['paymentStatus'] = updates.paymentStatus === 'paid' ? BACKEND_PAYMENT_STATUS.Paid : BACKEND_PAYMENT_STATUS.Pending;
      if (Object.keys(statusBody).length > 0) {
        requests.push(this.http.patch(`${environment.apiBaseUrl}/orders/${id}`, statusBody));
      }

      if (updates.customerName !== undefined || updates.phone !== undefined || updates.address !== undefined || updates.items) {
        const paymentMethod = updates.paymentMethod ? BACKEND_PAYMENT_METHOD[updates.paymentMethod] : undefined;
        requests.push(this.http.put(`${environment.apiBaseUrl}/orders/${id}`, {
          customerName: updates.customerName ?? '',
          phone: updates.phone ?? '',
          address: updates.address ?? '',
          shipmentCode: updates.shipmentCode ?? null,
          city: updates.city ?? null,
          area: updates.area ?? null,
          deliveryCompany: updates.deliveryCompany ?? null,
          notes: updates.notes ?? null,
          paymentMethod: paymentMethod ?? null,
          items: updates.items ? updates.items.map(i => ({ productId: i.productId, quantity: i.quantity, size: i.size || null })) : null
        }));
      }

      if (requests.length === 0) return of(updates as TrackedOrder);
      return concat(...requests).pipe(toArray(), map(() => updates as TrackedOrder));
    }
    return this.getOrders().pipe(
      map(orders => {
        let updated: TrackedOrder | undefined;
        const next = orders.map(o => {
          if (o.id === id || o.orderNumber === id) {
            updated = { ...o, ...updates, updatedAt: new Date().toISOString() };
            return updated;
          }
          return o;
        });
        this.saveLocal(next);
        return updated || (updates as TrackedOrder);
      })
    );
  }

  deleteOrder(id: string): Observable<boolean> {
    if (!environment.useMockData) {
      return this.http.delete<void>(`${environment.apiBaseUrl}/orders/${id}`).pipe(map(() => true));
    }
    return this.getOrders().pipe(
      map(orders => {
        const next = orders.filter(o => o.id !== id && o.orderNumber !== id);
        this.saveLocal(next);
        return true;
      })
    );
  }

  bulkUpdateStatus(ids: string[], status: TrackedOrderStatus, updatedBy?: TrackedOrderStatusUpdater): Observable<boolean> {
    if (!environment.useMockData) {
      return this.http.post<{ success: boolean }>(`${environment.apiBaseUrl}/orders/bulk-status`, {
        orderIds: ids,
        newStatus: BACKEND_ORDER_STATUS[status]
      }).pipe(map(res => res.success));
    }
    return this.getOrders().pipe(
      map(orders => {
        const targetIds = new Set(ids);
        const next = orders.map(o => {
          if (targetIds.has(o.id) || targetIds.has(o.orderNumber)) {
            return {
              ...o,
              status,
              updatedAt: new Date().toISOString(),
              ...(updatedBy ? { statusUpdatedBy: updatedBy } : {}),
            };
          }
          return o;
        });
        this.saveLocal(next);
        return true;
      })
    );
  }

  /** Approves the order's bank-transfer receipt; the API marks the order paid when it does. */
  approveBankTransfer(orderId: string): Observable<boolean> {
    if (environment.useMockData) return of(true);
    return this.http.get<any>(`${environment.apiBaseUrl}/bank-transfers/order/${orderId}`).pipe(
      switchMap(res => {
        const transferId = res?.data?.id;
        if (!transferId || res?.data?.status !== 'PendingReview') return of(true);
        return this.http.patch(`${environment.apiBaseUrl}/bank-transfers/${transferId}/review`, { approved: true }).pipe(map(() => true));
      })
    );
  }

  /** The orders endpoint is paged; the dashboard filters and paginates on its own, so it gets every page. */
  private fetchAllOrderPages(): Observable<any[]> {
    const url = `${environment.apiBaseUrl}/orders`;
    return this.http.get<any>(url, { params: { page: 1, pageSize: ORDERS_PAGE_SIZE } }).pipe(
      switchMap(res => {
        const first = res?.data?.data || [];
        const totalPages = res?.data?.totalPages || 1;
        if (totalPages <= 1) return of(first);
        const rest = Array.from({ length: totalPages - 1 }, (_, i) =>
          this.http.get<any>(url, { params: { page: i + 2, pageSize: ORDERS_PAGE_SIZE } }).pipe(map(r => r?.data?.data || []))
        );
        return forkJoin(rest).pipe(map(pages => first.concat(...pages)));
      })
    );
  }

  private saveLocal(orders: TrackedOrder[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
    } catch { }
  }
}
