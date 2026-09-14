import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found-page',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="not-found-container">
      <div class="not-found-card">
        <div class="status-code">404</div>
        <h1 class="title">الصفحة غير موجودة</h1>
        <p class="description">عذراً، الصفحة التي تحاول الوصول إليها غير متاحة أو قد تم نقلها.</p>
        <div class="actions">
          <a routerLink="/" class="home-btn">
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            العودة للرئيسية
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      direction: rtl;
      font-family: inherit;
    }
    .not-found-card {
      text-align: center;
      max-width: 480px;
      width: 100%;
      background: #ffffff;
      padding: 3rem 2rem;
      border-radius: 1.25rem;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.03);
      border: 1px solid #f1f5f9;
    }
    .status-code {
      font-size: 5.5rem;
      font-weight: 900;
      line-height: 1;
      color: #2A5841;
      letter-spacing: -0.05em;
      margin-bottom: 1rem;
    }
    .title {
      font-size: 1.5rem;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 0.75rem 0;
    }
    .description {
      color: #64748b;
      font-size: 0.95rem;
      line-height: 1.6;
      margin: 0 0 2rem 0;
    }
    .actions {
      display: flex;
      justify-content: center;
    }
    .home-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.75rem;
      background: linear-gradient(135deg, #2A5841 0%, #1E4130 100%);
      color: #ffffff;
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 0.75rem;
      text-decoration: none;
      transition: all 0.2s ease;
    }
    .home-btn:hover {
      background: linear-gradient(135deg, #1E4130 0%, #152E22 100%);
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(42, 88, 65, 0.35);
    }
  `]
})
export class NotFoundPageComponent {}
